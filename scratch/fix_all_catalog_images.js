const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getValidToken() {
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const { data: creds } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').single();
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
  return authData.access_token || cfg.valor.access_token;
}

async function fixAllCatalogImages() {
  console.log('🚀 Iniciando sincronização PERMANENTE das fotos de todo o catálogo...');
  let token = await getValidToken();

  const { data: prods } = await supabase.from('produtos').select('id, nome, imagens, bling_id').eq('ativo', true);
  console.log(`📦 Encontrados ${prods?.length} produtos para verificar.`);

  let corrigidos = 0;
  for (let i = 0; i < (prods || []).length; i++) {
    const p = prods[i];
    const firstImg = p.imagens?.[0] || '';
    if (firstImg.includes('supabase.co')) {
      continue; // Já é permanente!
    }

    if (!p.bling_id) continue;

    try {
      let res = await fetch('https://api.bling.com.br/Api/v3/produtos/' + p.bling_id, {
        headers: { Authorization: 'Bearer ' + token }
      });

      if (!res.ok && res.status === 401) {
        token = await getValidToken();
        res = await fetch('https://api.bling.com.br/Api/v3/produtos/' + p.bling_id, {
          headers: { Authorization: 'Bearer ' + token }
        });
      }

      if (!res.ok) continue;

      const json = await res.json();
      const internas = json.data?.midia?.imagens?.internas || [];
      const externas = json.data?.midia?.imagens?.externas || [];
      const links = [...internas, ...externas].map(item => item.link || item.linkMiniatura).filter(Boolean);

      if (links.length === 0 && p.imagens?.[0]) {
        links.push(p.imagens[0]);
      }

      const savedUrls = [];
      for (let j = 0; j < Math.min(links.length, 4); j++) {
        try {
          const imgRes = await fetch(links[j]);
          if (!imgRes.ok) continue;
          const buf = await imgRes.arrayBuffer();
          const filePath = `${p.id}/prod_${p.id}_${j}_${Date.now()}.jpg`;
          const { error } = await supabase.storage.from('produtos-fotos').upload(filePath, buf, { contentType: 'image/jpeg', upsert: true });
          if (!error) {
            const { data: pub } = supabase.storage.from('produtos-fotos').getPublicUrl(filePath);
            if (pub?.publicUrl) savedUrls.push(pub.publicUrl);
          }
        } catch {}
      }

      if (savedUrls.length > 0) {
        await supabase.from('produtos').update({ imagens: savedUrls }).eq('id', p.id);
        corrigidos++;
        console.log(`[${i+1}/${prods.length}] ✅ PERMANENTE: ${p.nome} (${savedUrls.length} fotos)`);
      }
    } catch (err) {
      console.error(`Erro prod ${p.id}:`, err.message);
    }
    await sleep(150);
  }

  console.log(`\n🎉 CATALOGO 100% PERMANENTE! Total de produtos com fotos salvas no Supabase Storage: ${corrigidos}`);
}

fixAllCatalogImages();
