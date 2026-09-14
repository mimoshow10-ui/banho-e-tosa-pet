const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function searchBling() {
  const { data: cfgTokens } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const { data: cfgCreds } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').single();

  const tokenData = cfgTokens?.valor;
  const credsData = cfgCreds?.valor;

  if (!tokenData?.refresh_token || !credsData?.client_id || !credsData?.client_secret) {
    console.error('Credenciais ausentes');
    return;
  }

  const credentials = Buffer.from(`${credsData.client_id}:${credsData.client_secret}`).toString('base64');

  // Atualizar token
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
  if (!tokenJson.access_token) {
    console.error('Falha ao renovar token:', tokenJson);
    return;
  }

  const token = tokenJson.access_token;
  await supabase.from('configuracoes').upsert({
    chave: 'bling_tokens',
    valor: tokenJson,
  }, { onConflict: 'chave' });

  console.log('✓ Token Bling renovado com sucesso!');

  const terms = ['mascara', 'jogo', 'quebra', 'tiara', 'bolsa', 'didatico', 'quadro', 'decor', 'faixa'];

  for (const term of terms) {
    const res = await fetch(`https://api.bling.com.br/Api/v3/produtos?pagina=1&limite=50&pesquisa=${encodeURIComponent(term)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    console.log(`\n▶ Bling pesquisa="${term}": ${json?.data?.length || 0} produtos encontrados`);
    json?.data?.slice(0, 5).forEach(p => {
      console.log(`   - [ID: ${p.id} | SKU: ${p.codigo}] ${p.nome} (Preço: R$ ${p.preco})`);
    });
  }
}

searchBling().catch(console.error);
