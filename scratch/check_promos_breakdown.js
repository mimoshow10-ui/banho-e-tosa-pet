const path = require('path');
const workspaceDir = 'C:\\Users\\User\\Desktop\\site Pet-';
const { createClient } = require(path.join(workspaceDir, 'node_modules', '@supabase', 'supabase-js'));

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPromoBreakdown() {
  const { data: prods } = await supabase
    .from('produtos')
    .select('id, nome, codigo_barras, categoria_id, destaque_super_promocao, preco_promocional, ativo, imagens, categorias(id, nome, parent_id)')
    .or('destaque_super_promocao.is.true,preco_promocional.gt.0');

  console.log('=== ALL 22 PROMO PRODUCTS IN DB ===');
  prods?.forEach((p, idx) => {
    const catName = p.categorias?.nome || 'SEM CATEGORIA';
    console.log(`${idx + 1}. [${p.codigo_barras}] ${p.nome} | Cat: ${catName} | Ativo: ${p.ativo} | Fotos: ${p.imagens?.length || 0} | SuperPromo: ${p.destaque_super_promocao} | PrecoPromo: ${p.preco_promocional}`);
  });
}

checkPromoBreakdown();
