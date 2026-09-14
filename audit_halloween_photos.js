const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

async function auditHalloween() {
  const { data: cfgTokens } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfgTokens?.valor?.access_token;

  if (!token) {
    console.error('No Bling token found');
    return;
  }

  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, bling_id, codigo_barras, nome, imagens')
    .not('bling_id', 'is', null);

  const regexHal = /hal|hallowe|halowe|hallowen/i;
  const halloweenProds = produtos.filter(p => regexHal.test(p.nome) || regexHal.test(p.codigo_barras || ''));

  console.log(`Found ${halloweenProds.length} Halloween products in database.\n`);

  for (const p of halloweenProds) {
    const res = await fetch(`https://api.bling.com.br/Api/v3/produtos/${p.bling_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    const blingProd = json.data;

    const ext = blingProd?.midia?.imagens?.externas?.map(i => i.link) || [];
    const int = blingProd?.midia?.imagens?.internas?.map(i => i.link) || [];
    const blingFotos = [...ext, ...int];

    console.log(`--------------------------------------------------`);
    console.log(`DB Name: ${p.nome}`);
    console.log(`DB SKU: [${p.codigo_barras}] | BlingID: ${p.bling_id}`);
    console.log(`Bling Name: ${blingProd?.nome}`);
    console.log(`Bling SKU: [${blingProd?.codigo}]`);
    console.log(`Fotos no Banco (${p.imagens ? p.imagens.length : 0}):`, p.imagens ? p.imagens[0] : 'NENHUMA');
    console.log(`Fotos no Bling (${blingFotos.length}):`, blingFotos ? blingFotos[0] : 'NENHUMA');
  }
}

auditHalloween();
