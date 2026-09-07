const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Searching for products with "jogo" or "mascara" ---');
  const { data: prods, error } = await supabase
    .from('produtos')
    .select('id, codigo_barras, nome')
    .or('nome.ilike.%jogo%,nome.ilike.%mascara%');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${prods.length} products to remove:`);
  prods.forEach(p => {
    console.log(`- [${p.codigo_barras || 'SEM SKU'}] ${p.nome} (ID: ${p.id})`);
  });

  if (prods.length > 0) {
    const ids = prods.map(p => p.id);
    const { error: delErr } = await supabase.from('produtos').delete().in('id', ids);
    if (delErr) {
      console.error('Error deleting products:', delErr);
    } else {
      console.log(`✅ Successfully deleted ${ids.length} products containing "jogo" or "mascara"!`);
    }
  } else {
    console.log('No products found matching criteria.');
  }
}

main();
