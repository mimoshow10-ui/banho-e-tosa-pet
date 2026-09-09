import { supabase } from '../src/lib/supabase';

async function main() {
  const { data: prods } = await supabase
    .from('produtos')
    .select('id, categoria_id, ativo')
    .eq('ativo', true);

  console.log('Total produtos ativos:', prods?.length);

  const catCountMap = new Map<string, number>();
  (prods || []).forEach(p => {
    if (p.categoria_id) {
      catCountMap.set(p.categoria_id, (catCountMap.get(p.categoria_id) || 0) + 1);
    }
  });

  const { data: configAdicionais } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'produtos_categorias_adicionais')
    .maybeSingle();

  const { data: configMap } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'produto_categorias_map')
    .maybeSingle();

  const mapAdic: Record<string, string[]> = configAdicionais?.valor || {};
  const map2: Record<string, string[]> = configMap?.valor || {};

  const activeProdIds = new Set((prods || []).map(p => p.id));

  for (const [pId, catIds] of Object.entries(mapAdic)) {
    if (activeProdIds.has(pId) && Array.isArray(catIds)) {
      catIds.forEach(cId => catCountMap.set(cId, (catCountMap.get(cId) || 0) + 1));
    }
  }
  for (const [pId, catIds] of Object.entries(map2)) {
    if (activeProdIds.has(pId) && Array.isArray(catIds)) {
      catIds.forEach(cId => catCountMap.set(cId, (catCountMap.get(cId) || 0) + 1));
    }
  }

  console.log(`Categorias (grupos/subgrupos) com pelo menos 1 produto ativo: ${catCountMap.size}`);

  const { data: categorias } = await supabase.from('categorias').select('*');

  const subgruposComProduto = (categorias || []).filter(c => c.parent_id && (catCountMap.get(c.id) || 0) > 0);
  const parentIdsFromSubs = new Set(subgruposComProduto.map(s => s.parent_id));

  const gruposComProduto = (categorias || []).filter(c => !c.parent_id && ((catCountMap.get(c.id) || 0) > 0 || parentIdsFromSubs.has(c.id)));

  console.log('\n--- GRUPOS E SUBGRUPOS QUE FICARÃO VISÍVEIS NA LOJA ---');
  for (const g of gruposComProduto) {
    const subs = subgruposComProduto.filter(s => s.parent_id === g.id);
    console.log(`GRUPO: "${g.nome}"`);
    for (const s of subs) {
      console.log(`   - SUBGRUPO: "${s.nome}" (${catCountMap.get(s.id)} produtos)`);
    }
  }

  console.log('\n--- GRUPOS QUE FICARÃO OCULTOS (0 PRODUTOS ATIVOS) ---');
  const gruposOcultos = (categorias || []).filter(c => !c.parent_id && !gruposComProduto.some(g => g.id === c.id));
  for (const g of gruposOcultos) {
    console.log(`GRUPO OCULTO: "${g.nome}"`);
  }
}

main();
