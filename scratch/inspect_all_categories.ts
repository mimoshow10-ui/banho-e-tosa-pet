import { supabase } from '../src/lib/supabase';

async function listAllCategories() {
  const { data: categories } = await supabase.from('categorias').select('*').order('nome');
  console.log("Total categorias:", categories?.length);
  
  const parents = categories?.filter(c => c.parent_id === null) || [];
  console.log("\n=== GRUPOS PRINCIPAIS (parent_id: null) ===");
  parents.forEach(p => console.log(`- ${p.nome} (id: ${p.id}, slug: ${p.slug})`));

  const subs = categories?.filter(c => c.parent_id !== null) || [];
  console.log("\n=== SUBGRUPOS sample ===");
  subs.slice(0, 30).forEach(s => {
    const parent = categories?.find(c => c.id === s.parent_id);
    console.log(`- ${s.nome} (parent: ${parent?.nome})`);
  });
}

listAllCategories();
