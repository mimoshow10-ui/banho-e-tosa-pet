const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function getValidToken() {
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  let token = cfg?.valor?.access_token;

  try {
    const testRes = await fetchWithTimeout('https://api.bling.com.br/Api/v3/produtos?limite=1', {
      headers: { 'Authorization': 'Bearer ' + token }
    }, 4000);

    if (!testRes.ok) {
      const { data: creds } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').single();
      if (creds?.valor && cfg?.valor?.refresh_token) {
        const { client_id, client_secret } = creds.valor;
        const authRes = await fetchWithTimeout('https://www.bling.com.br/Api/v3/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
            'Accept': '1.0'
          },
          body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: cfg.valor.refresh_token })
        }, 6000);
        const authData = await authRes.json();
        if (authData.access_token) {
          token = authData.access_token;
          await supabase.from('configuracoes').upsert({
            chave: 'bling_tokens',
            valor: {
              access_token: authData.access_token,
              refresh_token: authData.refresh_token || cfg.valor.refresh_token
            }
          }, { onConflict: 'chave' });
        }
      }
    }
  } catch {}
  return token;
}

async function fixProductAmazonUrls(prod, token) {
  if (!prod || !prod.id) return false;

  let freshLinks = [];

  // Buscar links renovados diretamente da API do Bling
  if (prod.bling_id) {
    try {
      const res = await fetchWithTimeout(`https://api.bling.com.br/Api/v3/produtos/${prod.bling_id}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      }, 10000);

      if (res.ok) {
        const json = await res.json();
        const internas = json.data?.midia?.imagens?.internas || [];
        const externas = json.data?.midia?.imagens?.externas || [];
        freshLinks = [...internas, ...externas].map(i => i.link || i.linkMiniatura).filter(Boolean);
      }
    } catch {}
  }

  // Tentar baixar os links expirados se o token do Bling não trouxe novos
  if (freshLinks.length === 0 && Array.isArray(prod.imagens) && prod.imagens.length > 0) {
    freshLinks = prod.imagens.filter(img => typeof img === 'string' && img.length > 0);
  }

  if (freshLinks.length === 0) {
    // Se não há links válidos em lugar nenhum, limpar para marcar 🟡 Sem Foto
    await supabase.from('produtos').update({ imagens: [] }).eq('id', prod.id);
    return 'cleared';
  }

  const permanentUrls = [];
  for (let i = 0; i < Math.min(freshLinks.length, 4); i++) {
    const rawUrl = freshLinks[i];
    if (!rawUrl || typeof rawUrl !== 'string') continue;

    if (rawUrl.includes('supabase.co/storage/v1/object/public/produtos-fotos')) {
      permanentUrls.push(rawUrl);
      continue;
    }

    try {
      const imgRes = await fetchWithTimeout(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'image/*'
        }
      }, 6000);

      if (!imgRes.ok) continue;

      const buffer = await imgRes.arrayBuffer();
      const filePath = `${prod.id}/prod_${prod.id}_${i}_${Date.now()}.jpg`;

      const { error } = await supabase.storage
        .from('produtos-fotos')
        .upload(filePath, buffer, {
          contentType: imgRes.headers.get('content-type') || 'image/jpeg',
          upsert: true
        });

      if (!error) {
        const { data: pubData } = supabase.storage
          .from('produtos-fotos')
          .getPublicUrl(filePath);

        if (pubData?.publicUrl) {
          permanentUrls.push(pubData.publicUrl);
        }
      }
    } catch {}
  }

  if (permanentUrls.length > 0) {
    await supabase.from('produtos').update({ imagens: permanentUrls }).eq('id', prod.id);
    return 'fixed';
  } else {
    // Não conseguiu baixar nenhuma foto válida, desmarcar para virar 🟡 Sem Foto
    await supabase.from('produtos').update({ imagens: [] }).eq('id', prod.id);
    return 'cleared';
  }
}

async function runFixRemainingAmazonUrls() {
  console.log('⚡ Iniciando conversão definitiva dos 267 produtos com links Amazon S3 expirados...');
  let token = await getValidToken();

  const { data: prods } = await supabase.from('produtos').select('id, nome, imagens, bling_id');

  const amazonProds = (prods || []).filter(p => {
    const str = JSON.stringify(p.imagens || '');
    return str.includes('amazonaws.com');
  });

  console.log(`📦 Encontrados ${amazonProds.length} produtos com links Amazon S3 expirados.`);

  let fixos = 0;
  let limpos = 0;
  const BATCH_SIZE = 5;

  for (let i = 0; i < amazonProds.length; i += BATCH_SIZE) {
    const chunk = amazonProds.slice(i, i + BATCH_SIZE);

    if (i % 50 === 0 && i > 0) {
      token = await getValidToken();
    }

    console.log(`\n🔄 Processando lote [${i + 1} a ${Math.min(i + BATCH_SIZE, amazonProds.length)} de ${amazonProds.length}]...`);

    const results = await Promise.all(
      chunk.map(prod => fixProductAmazonUrls(prod, token))
    );

    for (const res of results) {
      if (res === 'fixed') fixos++;
      else if (res === 'cleared') limpos++;
    }

    console.log(`✅ Progresso: ${fixos} fotos salvas permanentemente no Supabase | ${limpos} marcados 🟡 Sem Foto`);
    await sleep(200);
  }

  console.log(`\n==================================================`);
  console.log(`🎉 CONVERSÃO DE LINKS EXPIRADOS CONCLUÍDA!`);
  console.log(`Fotos salvas permanentemente no Supabase Storage: ${fixos}`);
  console.log(`Produtos sem foto no Bling limpos e sinalizados com 🟡: ${limpos}`);
}

runFixRemainingAmazonUrls();
