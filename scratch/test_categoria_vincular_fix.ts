import { supabase } from '../src/lib/supabase';

export interface CategoriaItem {
  id: string;
  nome: string;
  slug: string;
  parent_id: string | null;
}

export async function testGetCategoriasComProdutosAtivos() {
  const { data: categoriasAll } = await supabase
    .from('categorias')
    .select('id, nome, slug, parent_id')
    .order('nome');

  if (!categoriasAll || categoriasAll.length === 0) {
    return { pais: [], all: [] };
  }

  // Fetch ALL active products with pagination (bypassing 1000 limit)
  let produtosAtivos: { id: string; categoria_id: string | null }[] = [];
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
      produtosAtivos.push(...chunk);
      if (chunk.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  const activeProdIds = new Set((produtosAtivos || []).map(p => p.id));
  const catIdsComProdutosDirect = new Set<string>();

  (produtosAtivos || []).forEach(p => {
    if (p.categoria_id) catIdsComProdutosDirect.add(p.categoria_id);
  });

  const { data: cfgMap } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'produto_categorias_map')
    .maybeSingle();

  const { data: cfgAdic } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'produtos_categorias_adicionais')
    .maybeSingle();

  const map1: Record<string, string[]> = cfgMap?.valor || {};
  const map2: Record<string, string[]> = cfgAdic?.valor || {};

  for (const [pId, catIds] of Object.entries(map1)) {
    if (activeProdIds.has(pId) && Array.isArray(catIds)) {
      catIds.forEach(cId => catIdsComProdutosDirect.add(cId));
    }
  }
  for (const [pId, catIds] of Object.entries(map2)) {
    if (activeProdIds.has(pId) && Array.isArray(catIds)) {
      catIds.forEach(cId => catIdsComProdutosDirect.add(cId));
    }
  }

  const allCatsMap = new Map<string, CategoriaItem>(
    categoriasAll.map(c => [c.id, c as CategoriaItem])
  );

  // Collect all category IDs including ancestors
  const activeCatIdsAll = new Set<string>();

  for (const directCatId of catIdsComProdutosDirect) {
    let currId: string | null = directCatId;
    while (currId) {
      activeCatIdsAll.add(currId);
      const cat = allCatsMap.get(currId);
      currId = cat ? cat.parent_id : null;
    }
  }

  const allCats = (categoriasAll || []) as CategoriaItem[];
  const activeCatsList = allCats.filter(c => activeCatIdsAll.has(c.id));

  const paisAtivos = activeCatsList.filter(c => c.parent_id === null);

  return {
    pais: paisAtivos,
    all: activeCatsList
  };
}

async function run() {
  const result = await testGetCategoriasComProdutosAtivos();
  console.log("=== PAIS ATIVOS (Grupo Principal na Navegação) ===");
  result.pais.forEach(p => console.log(`- ${p.nome} (${p.slug})`));

  console.log("\n=== SUBGRUPOS SOB TEMÁTICOS ===");
  const tematicos = result.pais.find(p => p.slug === 'tematicos');
  if (tematicos) {
    const subsTem = result.all.filter(c => c.parent_id === tematicos.id);
    subsTem.forEach(s => console.log(`- ${s.nome} (${s.slug})`));
  }

  console.log("\n=== SUBGRUPOS SOB DIA DAS MÃES ===");
  const maes = result.all.find(p => p.slug === 'dia-das-maes');
  if (maes) {
    const subsMaes = result.all.filter(c => c.parent_id === maes.id);
    subsMaes.forEach(s => console.log(`- ${s.nome} (${s.slug})`));
  }
}

run();
