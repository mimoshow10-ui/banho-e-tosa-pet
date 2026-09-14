const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

async function refreshAndTest() {
  const { data: cfgTokens } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const { data: cfgCreds } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').single();

  const tokenData = cfgTokens?.valor;
  const credsData = cfgCreds?.valor;

  if (!tokenData?.refresh_token || !credsData?.client_id || !credsData?.client_secret) {
    console.error('Missing tokens or credentials');
    return;
  }

  const credentials = Buffer.from(`${credsData.client_id}:${credsData.client_secret}`).toString('base64');

  const tokenRes = await fetch('https://api.bling.com.br/Api/v3/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenData.refresh_token,
    }),
  });

  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    console.error('Token refresh failed:', tokenJson);
    return;
  }

  const newToken = tokenJson.access_token;
  await supabase.from('configuracoes').upsert({
    chave: 'bling_tokens',
    valor: tokenJson,
  }, { onConflict: 'chave' });

  console.log('Token refreshed successfully! New Access Token:', newToken);

  // Now test sample products from Bling
  const ids = ['16314383103', '16314448264', '16314566070', '16314583252'];

  for (const id of ids) {
    const res = await fetch(`https://api.bling.com.br/Api/v3/produtos/${id}`, {
      headers: { Authorization: `Bearer ${newToken}` }
    });
    const json = await res.json();
    const prod = json.data;
    if (prod) {
      const ext = prod.midia?.imagens?.externas?.map(i => i.link) || [];
      const int = prod.midia?.imagens?.internas?.map(i => i.link) || [];
      console.log(`\n=== BLING PRODUCT ID: ${id} ===`);
      console.log(`SKU: ${prod.codigo}`);
      console.log(`Nome: ${prod.nome}`);
      console.log(`Imagens Externas (${ext.length}):`, ext);
      console.log(`Imagens Internas (${int.length}):`, int);
    } else {
      console.log(`Product ID ${id} not returned by Bling`, json);
    }
  }
}

refreshAndTest();
