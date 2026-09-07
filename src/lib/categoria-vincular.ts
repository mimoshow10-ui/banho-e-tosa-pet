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
