const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectData() {
  console.log('--- 1. Categorias Atuais no Supabase ---');
  const { data: categorias, error: errCat } = await supabase.from('categorias').select('*');
  if (errCat) {
    console.error('Erro ao buscar categorias:', errCat);
  } else {
    console.log(`Total categorias: ${categorias.length}`);
    categorias.forEach(c => console.log(`[${c.id}] ${c.nome} (slug: ${c.slug}, parent_id: ${c.parent_id})`));
  }

  console.log('\n--- 2. Total de Produtos no Banco ---');
  const { count, error: countErr } = await supabase.from('produtos').select('*', { count: 'exact', head: true });
  console.log(`Total geral de produtos cadastrados: ${count}`);

  console.log('\n--- 3. Amostra de Produtos ---');
  const { data: produtos } = await supabase.from('produtos').select('id, nome, categoria_id, sku, preco, tags').limit(20);
  produtos?.forEach(p => console.log(`[${p.sku || p.id}] ${p.nome} (cat: ${p.categoria_id})`));
}

inspectData().catch(console.error);
