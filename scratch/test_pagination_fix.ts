import { supabase } from '../src/lib/supabase';

async function testPagination() {
  let allProdutosAtivos: { id: string; categoria_id: string | null }[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: chunk } = await supabase
      .from('produtos')
      .select('id, categoria_id')
      .eq('ativo', true)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (chunk && chunk.length > 0) {
      allProdutosAtivos.push(...chunk);
      if (chunk.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  console.log("Total produtos ativos buscados com paginação:", allProdutosAtivos.length);

  const activeProdIds = new Set(allProdutosAtivos.map(p => p.id));
  const catIdsComProdutos = new Set<string>();

  allProdutosAtivos.forEach(p => {
    if (p.categoria_id) catIdsComProdutos.add(p.categoria_id);
  });

  const { data: cfgMap } = await supabase.from('configuracoes').select('valor').eq('chave', 'produto_categorias_map').maybeSingle();
  const { data: cfgAdic } = await supabase.from('configuracoes').select('valor').eq('chave', 'produtos_categorias_adicionais').maybeSingle();

  const m1: Record<string, string[]> = cfgMap?.valor || {};
  const m2: Record<string, string[]> = cfgAdic?.valor || {};

  for (const [pId, catIds] of Object.entries(m1)) {
    if (activeProdIds.has(pId) && Array.isArray(catIds)) {
      catIds.forEach(cId => catIdsComProdutos.add(cId));
    }
  }
  for (const [pId, catIds] of Object.entries(m2)) {
    if (activeProdIds.has(pId) && Array.isArray(catIds)) {
      catIds.forEach(cId => catIdsComProdutos.add(cId));
    }
  }

  // Kits Dia das Mães ID: 3e38a8db-d575-4ec1-bc84-561c4982c531
  console.log("O id de Kits Dia das Mães está presente em catIdsComProdutos?", catIdsComProdutos.has('3e38a8db-d575-4ec1-bc84-561c4982c531'));
}

testPagination();
