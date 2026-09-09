import { supabase } from '../src/lib/supabase';

async function main() {
  // Fetch active products
  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, categoria_id, grupo_id, subgrupo_id, ativo')
    .eq('ativo', true);

  console.log(`Total de produtos ativos: ${produtos?.length || 0}`);

  // Fetch produto_categorias_map
  const { data: configMap } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'produto_categorias_map')
    .maybeSingle();

  const { data: configAdicionais } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'produtos_categorias_adicionais')
    .maybeSingle();

  const activeCategoryIds = new Set<string>();

  (produtos || []).forEach(p => {
    if (p.categoria_id) activeCategoryIds.add(p.categoria_id);
    if (p.grupo_id) activeCategoryIds.add(p.grupo_id);
    if (p.subgrupo_id) activeCategoryIds.add(p.subgrupo_id);
  });

  const map1 = configMap?.valor || {};
  const map2 = configAdicionais?.valor || {};

  const activeProductIds = new Set((produtos || []).map(p => p.id));

  for (const [prodId, catIds] of Object.entries(map1)) {
    if (activeProductIds.has(prodId) && Array.isArray(catIds)) {
      catIds.forEach((cId: any) => activeCategoryIds.add(cId));
    }
  }
  for (const [prodId, catIds] of Object.entries(map2)) {
    if (activeProductIds.has(prodId) && Array.isArray(catIds)) {
      catIds.forEach((cId: any) => activeCategoryIds.add(cId));
    }
  }

  // Fetch all categories
  const { data: categorias } = await supabase.from('categorias').select('*');

  const subComProdutos = (categorias || []).filter(c => c.parent_id && activeCategoryIds.has(c.id));
  const gruposComProdutosDirect = (categorias || []).filter(c => !c.parent_id && activeCategoryIds.has(c.id));
  
  // A parent group also has products if ANY of its sub-groups has products!
  const parentIdsWithSubProducts = new Set(subComProdutos.map(s => s.parent_id));
  const gruposComProdutosTotal = (categorias || []).filter(c => !c.parent_id && (activeCategoryIds.has(c.id) || parentIdsWithSubProducts.has(c.id)));

  console.log('\n--- RESUMO DE CATEGORIAS ATIVAS ---');
  console.log(`Subgrupos com produtos ativos: ${subComProdutos.length} de ${categorias?.filter(c => c.parent_id).length}`);
  console.log(`Grupos com produtos ativos (diretos ou via subgrupo): ${gruposComProdutosTotal.length} de ${categorias?.filter(c => !c.parent_id).length}`);

  for (const g of gruposComProdutosTotal) {
    const subs = subComProdutos.filter(s => s.parent_id === g.id);
    console.log(`GRUPO ATIVO: "${g.nome}" (Subgrupos ativos: ${subs.map(s => s.nome).join(', ') || 'Nenhum subgrupo especifico'})`);
  }
}

main();
