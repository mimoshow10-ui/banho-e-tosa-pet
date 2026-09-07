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
    }, 3000);

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
        }, 5000);
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

async function processProduct(prod, token) {
  if (!prod || !prod.id) return false;

  let links = [];

  // Se tem bling_id, buscar fotos direto da API estendida do Bling
  if (prod.bling_id) {
    try {
      const res = await fetchWithTimeout(`https://api.bling.com.br/Api/v3/produtos/${prod.bling_id}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      }, 12000);

      if (res.ok) {
        const json = await res.json();
        const internas = json.data?.midia?.imagens?.internas || [];
        const externas = json.data?.midia?.imagens?.externas || [];
        links = [...internas, ...externas].map(i => i.link || i.linkMiniatura).filter(Boolean);
      }
    } catch {}
  }

  // Se não encontrou links novos na API mas já tinha algum link no array de imagens, tentar usar ele
  if (links.length === 0 && Array.isArray(prod.imagens) && prod.imagens.length > 0) {
    links = prod.imagens.filter(img => typeof img === 'string' && img.length > 0);
  }

  if (links.length === 0) {
    return false;
  }

  const savedUrls = [];
  for (let i = 0; i < Math.min(links.length, 3); i++) {
    const rawUrl = links[i];
    if (!rawUrl || typeof rawUrl !== 'string') continue;

    if (rawUrl.includes('supabase.co/storage/v1/object/public/produtos-fotos')) {
      savedUrls.push(rawUrl);
      continue;
    }

    try {
      const imgRes = await fetchWithTimeout(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'image/*'
        }
      }, 4000);

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
          savedUrls.push(pubData.publicUrl);
        }
      }
    } catch {}
  }

  if (savedUrls.length > 0) {
    const { error } = await supabase.from('produtos').update({ imagens: savedUrls }).eq('id', prod.id);
    if (!error) {
      return true;
    }
  }

  return false;
}

async function runSuperFastImageRecovery() {
  console.log('⚡ Iniciando RECUPERAÇÃO ULTRA-RÁPIDA PARALELA de todas as fotos de produtos...');
  let token = await getValidToken();

  const { data: prods } = await supabase.from('produtos').select('id, nome, imagens, bling_id').eq('ativo', true);

  // Filtrar apenas produtos que ainda NÃO possuem imagem permanente no Supabase
  const pendingProds = (prods || []).filter(p => {
    const first = p.imagens?.[0] || '';
    return !first.includes('supabase.co');
  });

  console.log(`📦 Encontrados ${pendingProds.length} produtos pendentes de recuperação de imagem.`);

  const BATCH_SIZE = 3; // Processar 3 produtos simultaneamente sem dar timeout no AWS S3
  let sucessos = 0;

  for (let i = 0; i < pendingProds.length; i += BATCH_SIZE) {
    const chunk = pendingProds.slice(i, i + BATCH_SIZE);
    
    // Atualizar token caso necessário
    if (i % 150 === 0 && i > 0) {
      token = await getValidToken();
    }

    console.log(`\n🔄 Processando lote [${i + 1} a ${Math.min(i + BATCH_SIZE, pendingProds.length)} de ${pendingProds.length}]...`);

    const results = await Promise.all(
      chunk.map(prod => processProduct(prod, token))
    );

    const okCount = results.filter(Boolean).length;
    sucessos += okCount;
    console.log(`✅ Lote concluído: +${okCount} produtos recuperados com sucesso! (Total até agora: ${sucessos})`);

    await sleep(200);
  }

  console.log(`\n==================================================`);
  console.log(`🎉 RECUPERAÇÃO PARALELA CONCLUÍDA!`);
  console.log(`Total de produtos atualizados com fotos permanentes no Supabase Storage: ${sucessos}/${pendingProds.length}`);
}

runSuperFastImageRecovery();
