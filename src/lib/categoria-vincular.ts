import { supabase } from '@/lib/supabase';

export type MapCategorias = Record<string, string[]>;

/**
 * Busca o mapa de vinculação de categorias adicionais por produto:
 * Estutura: { [produto_id]: ["categoria_id_1", "categoria_id_2"] }
 */
export async function getProdutoCategoriasMap(): Promise<MapCategorias> {
  try {
    const { data } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'produto_categorias_map')
      .maybeSingle();

    return (data?.valor as MapCategorias) || {};
  } catch (err) {
    console.error('Erro ao buscar produto_categorias_map:', err);
    return {};
  }
}

/**
 * Salva a lista de categorias vinculadas a um produto específico.
 */
export async function salvarCategoriasDoProduto(produtoId: string, categoriasIds: string[]): Promise<boolean> {
  try {
    const mapAtual = await getProdutoCategoriasMap();
    
    if (categoriasIds.length > 0) {
      mapAtual[produtoId] = Array.from(new Set(categoriasIds));
    } else {
      delete mapAtual[produtoId];
    }

    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'produto_categorias_map',
      valor: mapAtual
    }, { onConflict: 'chave' });

    return !error;
  } catch (err) {
    console.error('Erro ao salvar categorias do produto:', err);
    return false;
  }
}

/**
 * Retorna todos os IDs de produtos vinculados a uma determinada categoria (seja principal ou adicional).
 */
export async function getProdutosIDsDaCategoria(categoriaId: string): Promise<string[]> {
  // 1. Produtos cuja categoria_id principal é categoriaId
  const { data: prodsDiretos } = await supabase
    .from('produtos')
    .select('id')
    .eq('categoria_id', categoriaId);

  const idsDiretos = (prodsDiretos || []).map(p => p.id);

  // 2. Produtos vinculados via mapa de categorias adicionais
  const mapCategorias = await getProdutoCategoriasMap();
  const idsAdicionais: string[] = [];

  for (const [prodId, catList] of Object.entries(mapCategorias)) {
    if (Array.isArray(catList) && catList.includes(categoriaId)) {
      idsAdicionais.push(prodId);
    }
  }

  return Array.from(new Set([...idsDiretos, ...idsAdicionais]));
}

export interface CategoriaItem {
  id: string;
  nome: string;
  slug: string;
  parent_id: string | null;
}

/**
 * Retorna apenas os Grupos Principais e Subgrupos que possuem pelo menos 1 produto ativo publicado na loja.
 */
export async function getCategoriasComProdutosAtivos(): Promise<{
  pais: CategoriaItem[];
  all: CategoriaItem[];
}> {
  try {
    const { data: categoriasAll } = await supabase
      .from('categorias')
      .select('id, nome, slug, parent_id')
      .order('nome');

    if (!categoriasAll || categoriasAll.length === 0) {
      return { pais: [], all: [] };
    }

    // Busca TODOS os produtos ativos usando paginação (evita o limite de 1000 da API do Supabase)
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

    const activeProdIds = new Set(produtosAtivos.map(p => p.id));
    const catIdsComProdutosDirect = new Set<string>();

    produtosAtivos.forEach(p => {
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

    // Coleta todas as categorias ativas incluindo pais/ancestrais
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
  } catch (err) {
    console.error('Erro ao buscar categorias ativas:', err);
    return { pais: [], all: [] };
  }
}
