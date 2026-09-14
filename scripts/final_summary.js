const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function summary() {
  const { data: categorias } = await supabase.from('categorias').select('id, nome, slug');
  const { data: produtos } = await supabase.from('produtos').select('id, categoria_id');

  const counts = {};
  produtos.forEach(p => {
    if (p.categoria_id) counts[p.categoria_id] = (counts[p.categoria_id] || 0) + 1;
  });

  console.log('--- Resumo Final por Categoria ---');
  categorias.forEach(c => {
    const total = counts[c.id] || 0;
    if (total > 0) {
      console.log(`- ${c.nome} (${c.slug}): ${total} produtos`);
    }
  });
  console.log(`\nTotal Geral de Produtos no Catálogo: ${produtos.length}`);
}

summary().catch(console.error);
