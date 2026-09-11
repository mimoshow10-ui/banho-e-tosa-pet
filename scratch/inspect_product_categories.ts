import { supabase } from '../src/lib/supabase';

async function checkProductCats() {
  const { data: prods } = await supabase.from('produtos').select('id, nome, codigo_barras, categoria_id');
  const { data: cats } = await supabase.from('categorias').select('*');

  const catMap = new Map(cats?.map(c => [c.id, c]));

  console.log("Total produtos:", prods?.length);

  const countsPerCat: Record<string, { nome: string; count: number; parent: string | null }> = {};

  prods?.forEach(p => {
    if (p.categoria_id) {
      const c = catMap.get(p.categoria_id);
      const name = c ? c.nome : 'UNKNOWN';
      const parentName = c && c.parent_id ? catMap.get(c.parent_id)?.nome || 'UNKNOWN_PARENT' : null;
      if (!countsPerCat[p.categoria_id]) {
        countsPerCat[p.categoria_id] = { nome: name, count: 0, parent: parentName };
      }
      countsPerCat[p.categoria_id].count++;
    }
  });

  console.log("\nDistribution of products across categories:", countsPerCat);

  // Also check configuracoes for additional category maps
  const { data: cfg1 } = await supabase.from('configuracoes').select('valor').eq('chave', 'produto_categorias_map').maybeSingle();
  const { data: cfg2 } = await supabase.from('configuracoes').select('valor').eq('chave', 'produtos_categorias_adicionais').maybeSingle();

  console.log("\nMap 1 entries:", Object.keys(cfg1?.valor || {}).length);
  console.log("Map 2 entries:", Object.keys(cfg2?.valor || {}).length);
}

checkProductCats();
