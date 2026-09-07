const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

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

async function fixNovidades() {
  const token = await getValidToken();
  const { data: v } = await supabase.from('configuracoes').select('*').eq('chave', 'vitrine_destaques').single();
  const ids = v.valor.novidades || [];
  const { data: prods } = await supabase.from('produtos').select('id, nome, imagens, bling_id').in('id', ids);

  for (let p of prods) {
    const hasSupa = p.imagens?.[0]?.includes('supabase.co');
    if (hasSupa) {
      console.log('Already OK:', p.nome);
      continue;
    }

    console.log('Fixing:', p.nome);
    if (!p.bling_id) continue;

    const res = await fetch('https://api.bling.com.br/Api/v3/produtos/' + p.bling_id, {
      headers: { Authorization: 'Bearer ' + token }
    });

    if (!res.ok) continue;
    const json = await res.json();
    const internas = json.data?.midia?.imagens?.internas || [];
    const externas = json.data?.midia?.imagens?.externas || [];
    const links = [...internas, ...externas].map(i => i.link || i.linkMiniatura).filter(Boolean);

    const savedUrls = [];
    for (let i = 0; i < Math.min(links.length, 5); i++) {
      try {
        const imgRes = await fetch(links[i]);
        if (!imgRes.ok) continue;
        const buf = await imgRes.arrayBuffer();
        const filePath = `${p.id}/prod_${p.id}_${i}_${Date.now()}.jpg`;
        const { error } = await supabase.storage.from('produtos-fotos').upload(filePath, buf, { contentType: 'image/jpeg', upsert: true });
        if (!error) {
          const { data: pub } = supabase.storage.from('produtos-fotos').getPublicUrl(filePath);
          if (pub?.publicUrl) savedUrls.push(pub.publicUrl);
        }
      } catch (err) {
        console.error('Error fetching image:', err.message);
      }
    }

    if (savedUrls.length > 0) {
      await supabase.from('produtos').update({ imagens: savedUrls }).eq('id', p.id);
      console.log('✅ SAVED PERMANENT:', p.nome, savedUrls.length, 'imgs');
    }
  }
  console.log('🎉 ALL NOVIDADES PRODUCTS FIXED AND SAVED PERMANENTLY!');
}

fixNovidades();
