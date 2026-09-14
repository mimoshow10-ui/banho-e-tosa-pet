const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCategoryCounts() {
  const { data: categorias } = await supabase.from('categorias').select('id, nome, slug, parent_id');
  const catMap = {};
  categorias.forEach(c => { catMap[c.id] = c; });

  const { data: produtos } = await supabase.from('produtos').select('id, nome, categoria_id, imagens, preco');

  const counts = {};
  produtos.forEach(p => {
    const catId = p.categoria_id;
    if (catId) {
      counts[catId] = (counts[catId] || 0) + 1;
    } else {
      counts['sem_categoria'] = (counts['sem_categoria'] || 0) + 1;
    }
  });

  console.log('=== CONTAGEM DE PRODUTOS POR CATEGORIA ===\n');
  
  const infantilSlugs = ['mascaras', 'bolsas', 'tiaras', 'jogos', 'quebra-cabeca', 'didatico'];
  const decorSlugs = ['quadros-mdf', 'quadros-impressos', 'decor-ambientes', 'faixas-decorativas'];

  console.log('🎈 LINHA INFANTIL:');
  infantilSlugs.forEach(slug => {
    const cat = categorias.find(c => c.slug === slug);
    if (cat) {
      const qtd = counts[cat.id] || 0;
      console.log(`  - ${cat.nome} (${slug}): ${qtd} produto(s) ativos`);
    }
  });

  console.log('\n✨ LINHA DECORAÇÃO:');
  decorSlugs.forEach(slug => {
    const cat = categorias.find(c => c.slug === slug);
    if (cat) {
      const qtd = counts[cat.id] || 0;
      console.log(`  - ${cat.nome} (${slug}): ${qtd} produto(s) ativos`);
    }
  });

  console.log('\n🐾 LINHA PET & DEMAIS:');
  categorias.filter(c => !infantilSlugs.includes(c.slug) && !decorSlugs.includes(c.slug) && !c.parent_id).forEach(cat => {
    const qtd = counts[cat.id] || 0;
    console.log(`  - ${cat.nome} (${cat.slug}): ${qtd} produto(s)`);
  });

  console.log(`\nTotal Geral de Produtos no Catálogo: ${produtos.length}`);
}

checkCategoryCounts().catch(console.error);
