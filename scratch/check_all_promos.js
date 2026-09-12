const path = require('path');
const workspaceDir = 'C:\\Users\\User\\Desktop\\site Pet-';
const { createClient } = require(path.join(workspaceDir, 'node_modules', '@supabase', 'supabase-js'));

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdminPromoFilter() {
  console.log('=== TESTING ADMIN PROMO FILTER QUERY ===');
  
  let countQuery = supabase.from('produtos').select('*', { count: 'exact', head: true });
  let query = supabase.from('produtos').select('*, categorias(id, nome, parent_id)').order('nome');

  // Filter promocao = sim
  countQuery = countQuery.or('destaque_super_promocao.is.true,preco_promocional.gt.0');
  query = query.or('destaque_super_promocao.is.true,preco_promocional.gt.0');

  const { count } = await countQuery;
  const { data, error } = await query;

  console.log('Count returned:', count);
  console.log('Data returned length:', data?.length);
  console.log('Error:', error);

  if (data) {
    console.log('--- LIST OF ALL PRODUCTS RETURNED BY ADMIN PROMO FILTER (' + data.length + ') ---');
    data.forEach((p, idx) => {
      const hasFotos = Array.isArray(p.imagens) && p.imagens.length > 0;
      console.log((idx + 1) + '. [' + (p.codigo_barras || 'SEM-SKU') + '] ' + p.nome + ' | Ativo: ' + p.ativo + ' | Fotos: ' + (hasFotos ? p.imagens.length : 0));
    });
  }
}

checkAdminPromoFilter();
