const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

async function checkExactSkuPhotos() {
  const { data: cfgTokens } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfgTokens?.valor?.access_token;

  if (!token) {
    console.error('No Bling token found');
    return;
  }

  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, bling_id, codigo_barras, nome, imagens')
    .not('bling_id', 'is', null)
    .limit(10);

  console.log(`Checking ${produtos.length} products against Bling V3 API...\n`);

  for (const p of produtos) {
    const res = await fetch(`https://api.bling.com.br/Api/v3/produtos/${p.bling_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    const blingProd = json.data;

    const ext = blingProd?.midia?.imagens?.externas?.map(i => i.link) || [];
    const int = blingProd?.midia?.imagens?.internas?.map(i => i.link) || [];
    const blingFotos = [...ext, ...int];

    console.log(`--------------------------------------------------`);
    console.log(`SKU: [${p.codigo_barras}] | Nome: ${p.nome}`);
    console.log(`Bling ID: ${p.bling_id} | Bling Retornou SKU: [${blingProd?.codigo}]`);
    console.log(`Fotos no Banco (${p.imagens ? p.imagens.length : 0}):`, p.imagens ? p.imagens[0] : 'Nenhuma');
    console.log(`Fotos no Bling (${blingFotos.length}):`, blingFotos ? blingFotos[0] : 'Nenhuma');

    const batePrimeiraFoto = p.imagens?.[0] && blingFotos?.[0] && p.imagens[0] === blingFotos[0];
    console.log(`=> Primeira Foto Coincide com o Bling? ${batePrimeiraFoto ? '✅ SIM' : '❌ NÃO / DIFERENTE'}`);
  }
}

checkExactSkuPhotos();
