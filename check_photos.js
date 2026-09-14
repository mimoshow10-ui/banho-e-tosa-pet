const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, nome, codigo_barras, bling_id, imagens')
    .order('criado_em', { ascending: false })
    .limit(25);

  console.log("=================================================");
  console.log("ÚLTIMOS PRODUTOS CADASTRADOS/ATUALIZADOS:");
  console.log("=================================================");

  produtos.forEach(p => {
    console.log(`SKU: ${p.codigo_barras || 'Sem SKU'} | Bling ID: ${p.bling_id}`);
    console.log(`Nome: ${p.nome}`);
    console.log(`Imagens: ${JSON.stringify(p.imagens)}`);
    console.log('-------------------------------------------------');
  });
}

check();
