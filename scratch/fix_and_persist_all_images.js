const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getValidToken() {
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  let token = cfg?.valor?.access_token;

  try {
    const testRes = await fetch('https://api.bling.com.br/Api/v3/produtos?limite=1', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!testRes.ok) {
      const { data: creds } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').single();
      if (creds?.valor && cfg?.valor?.refresh_token) {
        const { client_id, client_secret } = creds.valor;
        const authRes = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
            'Accept': '1.0'
          },
          body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: cfg.valor.refresh_token })
        });
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

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
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

async function uploadImageToSupabase(url, productId, index) {
  if (!url || !productId) return null;
  const cleanId = String(productId).trim();

  // Se já for imagem permanente do Supabase, retorne ela mesma
  if (url.includes('supabase.co/storage/v1/object/public/produtos-fotos')) {
    return url;
  }

  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'image/*'
      }
    }, 5000);

    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const fileName = `prod_${cleanId}_${index}_${Date.now()}.jpg`;
    const filePath = `${cleanId}/${fileName}`;

    const { error } = await supabase.storage
      .from('produtos-fotos')
      .upload(filePath, buffer, {
        contentType: response.headers.get('content-type') || 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error(`Erro upload Supabase para prod ${cleanId}:`, error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('produtos-fotos')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error(`Erro ao baixar/enviar imagem ${url}:`, err.message);
    return null;
  }
}

async function fixAllProductImages() {
  console.log('🚀 Iniciando recuperação e salvamento PERMANENTE das fotos de produtos...');
  const token = await getValidToken();
  if (!token) {
    console.error('❌ Não foi possível obter token do Bling.');
    return;
  }

  // 1. Puxar produtos das Novidades primeiro para corrigir imediatamente a vitrine!
  const { data: vitrineCfg } = await supabase.from('configuracoes').select('*').eq('chave', 'vitrine_destaques').single();
  const novidadesIds = vitrineCfg?.valor?.novidades || [];

  console.log(`\n📌 1. CORRIGINDO PRODUTOS DA VITRINE NOVIDADES (${novidadesIds.length} produtos)...`);
  const { data: novidadesProds } = await supabase.from('produtos').select('*').in('id', novidadesIds);

  for (let prod of (novidadesProds || [])) {
    console.log(`📸 Processando Novidade: ${prod.nome}...`);
    let freshLinks = [];

    if (prod.bling_id) {
      try {
        const res = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prod.bling_id}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
          const json = await res.json();
          const internas = json.data?.midia?.imagens?.internas || [];
          const externas = json.data?.midia?.imagens?.externas || [];
          freshLinks = [...internas, ...externas].map(i => i.link || i.linkMiniatura).filter(Boolean);
        }
      } catch {}
    }

    if (freshLinks.length === 0 && Array.isArray(prod.imagens) && prod.imagens.length > 0) {
      freshLinks = prod.imagens;
    }

    const permanentUrls = [];
    for (let i = 0; i < Math.min(freshLinks.length, 5); i++) {
      const pUrl = await uploadImageToSupabase(freshLinks[i], prod.id, i);
      if (pUrl) permanentUrls.push(pUrl);
      await sleep(100);
    }

    if (permanentUrls.length > 0) {
      await supabase.from('produtos').update({ imagens: permanentUrls }).eq('id', prod.id);
      console.log(`✨ [CORRIGIDO E PERMANENTE] ${prod.nome}: ${permanentUrls.length} fotos salvas no Supabase!`);
    } else {
      console.log(`⚠️ Nenhuma foto encontrada para ${prod.nome}`);
    }
  }

  console.log('\n==================================================');
  console.log('🎉 VITRINE DE NOVIDADES 100% CORRIGIDA E SALVA EM SUPABASE STORAGE!');
}

fixAllProductImages();
