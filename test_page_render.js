const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

async function testPageLogic() {
  const slug = '200-adesivos-pet-piercings-super-herois-petshop-caes-gatos-11319897828';
  
  try {
    // 1. generateMetadata
    const { data: produtosMeta } = await supabase.from('produtos').select('nome, descricao_curta, seo_title, seo_description, imagens, parent_id').eq('slug', slug).limit(1);
    let prodMeta = produtosMeta?.[0];
    if (prodMeta?.parent_id) {
      const { data: parentMeta } = await supabase.from('produtos').select('nome, descricao_curta, seo_title, seo_description, imagens').eq('id', prodMeta.parent_id).maybeSingle();
      if (parentMeta) prodMeta = parentMeta;
    }
    const title = (prodMeta.seo_title || `${prodMeta.nome} | Banho & Tosa Pet`).slice(0, 70);
    const rawDesc = prodMeta.seo_description || prodMeta.descricao_curta || `Compre ${prodMeta.nome} no Banho & Tosa Pet!`;
    const description = rawDesc.replace(/<[^>]*>?/gm, '').replace(/[\r\n]+/g, ' ').slice(0, 160).trim();
    console.log('Metadata OK:', { title, description });

    // 2. ProdutoPage
    const { data: produtos } = await supabase.from('produtos').select('*').eq('slug', slug).limit(1);
    let prod = produtos?.[0];
    if (prod?.parent_id) {
      const { data: parentProd } = await supabase.from('produtos').select('*').eq('id', prod.parent_id).maybeSingle();
      if (parentProd) prod = parentProd;
    }
    console.log('Main Product OK:', prod.id, prod.nome, prod.slug);

    // Family query
    let family = [];
    const familyId = prod.parent_id || prod.id;
    if (familyId) {
      const { data: familyData } = await supabase
        .from('produtos')
        .select('id, nome, slug, imagens, preco, preco_promocional, estoque, ativo')
        .or('id.eq.' + familyId + ',parent_id.eq.' + familyId)
        .eq('ativo', true)
        .order('id');
      family = familyData || [];
    }
    console.log('Family OK count:', family.length);
  } catch (err) {
    console.error('Fatal execution error:', err);
  }
}

testPageLogic();
