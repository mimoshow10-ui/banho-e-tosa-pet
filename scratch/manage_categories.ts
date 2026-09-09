import { supabase } from '../src/lib/supabase';

async function main() {
  const { data: categorias, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nome');

  if (error) {
    console.error('Error fetching categorias:', error);
    return;
  }

  console.log('--- CATEGORIAS ATUAIS ---');
  const grupos = categorias.filter(c => !c.parent_id);
  for (const g of grupos) {
    const sub = categorias.filter(c => c.parent_id === g.id);
    console.log(`GRUPO [${g.id}] "${g.nome}" (slug: ${g.slug}):`);
    for (const s of sub) {
      console.log(`   - SUBGRUPO [${s.id}] "${s.nome}" (slug: ${s.slug})`);
    }
  }
}

main();
