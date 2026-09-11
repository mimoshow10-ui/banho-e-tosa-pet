import { supabase } from '../src/lib/supabase';
import { getCategoriasComProdutosAtivos } from '../src/lib/categoria-vincular';

async function debugKits() {
  const { data: maesCat } = await supabase
    .from('categorias')
    .select('*')
    .ilike('nome', '%mae%')
    .single();

  console.log("Dia das Mães Category:", maesCat);

  if (maesCat) {
    const { data: subs } = await supabase
      .from('categorias')
      .select('*')
      .eq('parent_id', maesCat.id);

    console.log("Subcategorias do Dia das Mães em categorias:", subs);

    const kitsSub = subs?.find(s => s.nome.toLowerCase().includes('kit'));
    console.log("Kits Subcategory under Dia das Mães:", kitsSub);

    if (kitsSub) {
      const { data: directProds } = await supabase
        .from('produtos')
        .select('id, nome, ativo, categoria_id')
        .eq('categoria_id', kitsSub.id);

      console.log("Direct products with categoria_id = kitsSub.id:", directProds);

      const { data: cfgMap } = await supabase.from('configuracoes').select('valor').eq('chave', 'produto_categorias_map').maybeSingle();
      const { data: cfgAdic } = await supabase.from('configuracoes').select('valor').eq('chave', 'produtos_categorias_adicionais').maybeSingle();

      const m1 = cfgMap?.valor || {};
      const m2 = cfgAdic?.valor || {};

      const mappedProdIds1 = Object.entries(m1).filter(([pId, catIds]) => Array.isArray(catIds) && catIds.includes(kitsSub.id)).map(([pId]) => pId);
      const mappedProdIds2 = Object.entries(m2).filter(([pId, catIds]) => Array.isArray(catIds) && catIds.includes(kitsSub.id)).map(([pId]) => pId);

      console.log("Products mapped to Kits via produto_categorias_map:", mappedProdIds1);
      console.log("Products mapped to Kits via produtos_categorias_adicionais:", mappedProdIds2);

      const allKitsProdIds = Array.from(new Set([...(directProds?.map(p => p.id) || []), ...mappedProdIds1, ...mappedProdIds2]));

      if (allKitsProdIds.length > 0) {
        const { data: prodsDetails } = await supabase
          .from('produtos')
          .select('id, nome, ativo, categoria_id')
          .in('id', allKitsProdIds);

        console.log("Product details for Kits under Dia das Mães:", prodsDetails);
      } else {
        console.log("Nenhum produto associado a Kits em Dia das Mães!");
      }
    }
  }

  const result = await getCategoriasComProdutosAtivos();
  const maesSubsInAll = result.all.filter(c => c.parent_id === maesCat?.id);
  console.log("Subcategories returned in `all` for Dia das Mães:", maesSubsInAll);
}

debugKits();
