const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkKits() {
  const skus = ['KIT1960', 'KIT1959', 'KIT1957', 'kit1960', 'kit1959', 'kit1957'];
  const { data: prods } = await supabase.from('produtos').select('id, nome, codigo_barras, imagens').in('codigo_barras', skus);
  
  console.log('Produtos encontrados por codigo_barras:', prods?.length);
  (prods || []).forEach(p => {
    console.log(`SKU: ${p.codigo_barras} | Nome: ${p.nome}`);
    console.log(`Imagens (raw):`, JSON.stringify(p.imagens));
  });

  // Também buscar por busca ilike no nome
  const { data: halloweenProds } = await supabase.from('produtos').select('id, nome, codigo_barras, imagens').ilike('nome', '%gravata pet halloween%');
  console.log('\nGravatas Halloween encontradas:', halloweenProds?.length);
  (halloweenProds || []).forEach(p => {
    console.log(`SKU: ${p.codigo_barras} | Nome: ${p.nome}`);
    console.log(`Imagens (raw):`, JSON.stringify(p.imagens));
  });
}

checkKits();
