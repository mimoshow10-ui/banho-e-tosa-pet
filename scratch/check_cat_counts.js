const path = require('path');
const workspaceDir = 'C:\\Users\\User\\Desktop\\site Pet-';
const { createClient } = require(path.join(workspaceDir, 'node_modules', '@supabase', 'supabase-js'));

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCategoriesAndPromos() {
  const { data: cats } = await supabase.from('categorias').select('*').order('nome');
  const { data: addCatDb1 } = await supabase.from('configuracoes').select('valor').eq('chave', 'produtos_categorias_adicionais').maybeSingle();
  const { data: addCatDb2 } = await supabase.from('configuracoes').select('valor').eq('chave', 'produto_categorias_map').maybeSingle();
  
  const map1 = addCatDb1?.valor || {};
  const map2 = addCatDb2?.valor || {};
  const adicionaisMap = {};
  for (const [pId, cArr] of Object.entries(map1)) {
    adicionaisMap[pId] = Array.isArray(cArr) ? [...cArr] : [];
  }
  for (const [pId, cArr] of Object.entries(map2)) {
    if (Array.isArray(cArr)) {
      adicionaisMap[pId] = Array.from(new Set([...(adicionaisMap[pId] || []), ...cArr]));
    }
  }

  const { data: allProds } = await supabase.from('produtos').select('id, nome, codigo_barras, categoria_id, destaque_super_promocao, preco_promocional, ativo');

  console.log('--- CATEGORIES PRODUCT COUNTS ---');
  for (const cat of cats || []) {
    const directProds = allProds?.filter(p => p.categoria_id === cat.id) || [];
    
    // Additional map prods
    const addProds = allProds?.filter(p => p.categoria_id !== cat.id && (adicionaisMap[p.id] || []).includes(cat.id)) || [];
    
    const totalCatProds = [...directProds, ...addProds];
    const totalPromosInCat = totalCatProds.filter(p => p.destaque_super_promocao || (p.preco_promocional && p.preco_promocional > 0));

    if (totalCatProds.length > 0) {
      console.log(`Cat: "${cat.nome}" (id: ${cat.id}) | Direct: ${directProds.length} | Additional: ${addProds.length} | TOTAL: ${totalCatProds.length} | Promos in Cat: ${totalPromosInCat.length}`);
      if (totalCatProds.length === 11 || totalPromosInCat.length === 11 || totalCatProds.length === 20) {
        console.log(`  -> MATCH 11 or 20! Details:`, totalCatProds.map(p => p.nome));
      }
    }
  }
}

checkCategoriesAndPromos();
