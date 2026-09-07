const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Checking MS2986CA ---');
  const { data: pList, error } = await supabase
    .from('produtos')
    .select('*')
    .or('codigo_barras.ilike.%MS2986CA%,nome.ilike.%MS2986CA%');
  
  if (error) {
    console.error('Error fetching MS2986CA:', error);
    return;
  }
  console.log('Found', pList.length, 'products for MS2986CA:');
  pList.forEach(p => {
    console.log(`ID: ${p.id} | SKU: ${p.codigo_barras} | Nome: ${p.nome}`);
    console.log(`Imagens:`, p.imagens);
  });

  // Check storage files in bucket 'produtos'
  console.log('\n--- Checking Supabase Storage bucket list for MS2986CA ---');
  const { data: files, error: listErr } = await supabase.storage.from('produtos').list('MS2986CA');
  if (listErr) {
    console.error('Error listing storage for MS2986CA:', listErr);
  } else {
    console.log(`Files in bucket 'produtos/MS2986CA':`, files);
  }

  // Also search root list or list all folders in storage
  console.log('\n--- Checking root storage folders containing 2986 ---');
  const { data: rootFiles } = await supabase.storage.from('produtos').list('', { limit: 1000 });
  const matches = (rootFiles || []).filter(f => f.name.toLowerCase().includes('2986') || f.name.toLowerCase().includes('ms2986'));
  console.log('Matching storage folders/files:', matches);
}

main();
