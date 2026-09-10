import { supabase } from '../src/lib/supabase';
import { getFamilyConfig } from '../src/lib/familyManager';

async function main() {
  console.log('--- BUSCANDO PRODUTO MS4541 NO BANCO ---');
  
  const { data: prods, error } = await supabase
    .from('produtos')
    .select('*')
    .or('codigo_barras.ilike.%MS4541%,nome.ilike.%MS4541%');

  if (error) {
    console.error('Erro na busca:', error);
    return;
  }

  console.log(`Encontrado(s) ${prods?.length || 0} produto(s):`);
  for (const p of (prods || [])) {
    console.log('\n========================================');
    console.log(`ID: ${p.id}`);
    console.log(`Nome: "${p.nome}"`);
    console.log(`SKU / Código Barras: "${p.codigo_barras}"`);
    console.log(`Bling ID: "${p.bling_id}"`);
    console.log(`Imagens (${p.imagens?.length || 0}):`, JSON.stringify(p.imagens, null, 2));
    
    // Check family
    const familyConfig = await getFamilyConfig();
    const famId = familyConfig.productToFamilyMap[p.id];
    console.log(`Família ID vinculada: ${famId || 'NENHUMA'}`);
    if (famId && familyConfig.familias[famId]) {
      const members = familyConfig.familias[famId].members;
      console.log(`Membros da família (${members.length}):`);
      const { data: mProds } = await supabase.from('produtos').select('id, nome, codigo_barras, imagens').in('id', members);
      for (const m of (mProds || [])) {
        console.log(`   - [${m.codigo_barras}] "${m.nome}" (${m.imagens?.length || 0} fotos)`);
        console.log(`     Primeiras imagens:`, JSON.stringify((m.imagens || []).slice(0, 2)));
      }
    }
  }
}

main();
