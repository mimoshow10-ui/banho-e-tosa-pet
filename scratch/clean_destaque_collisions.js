const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Cleaning Destaque Collisions ---');
  
  const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'vitrine_destaques').single();
  const novidades = cfg?.valor?.novidades || [];
  const maisVendidos = cfg?.valor?.mais_vendidos || [];

  console.log(`Novidades IDs count: ${novidades.length}`);
  console.log(`Mais Vendidos IDs count: ${maisVendidos.length}`);

  const excludeIds = [...novidades, ...maisVendidos];

  if (excludeIds.length > 0) {
    // Unset destaque_super_promocao for products that are in novidades or mais_vendidos
    const { error } = await supabase
      .from('produtos')
      .update({ destaque_super_promocao: false })
      .in('id', excludeIds);

    if (error) {
      console.error('Error updating DB:', error);
    } else {
      console.log(`✅ Removed destaque_super_promocao flag from ${excludeIds.length} products in Novidades / Mais Vendidos!`);
    }
  }
}

main();
