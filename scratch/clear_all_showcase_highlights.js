const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🧹 CLEARING ALL SHOWCASE HIGHLIGHTS (SUPER PROMOÇÃO, NOVIDADES, MAIS VENDIDOS)...');

  // 1. Reset vitrine_destaques config in configuracoes table
  const { error: cfgErr } = await supabase.from('configuracoes').upsert({
    chave: 'vitrine_destaques',
    valor: { mais_vendidos: [], novidades: [] }
  }, { onConflict: 'chave' });

  if (cfgErr) {
    console.error('Error resetting vitrine_destaques:', cfgErr);
  } else {
    console.log('✅ Reset vitrine_destaques in configuracoes to empty arrays.');
  }

  // 2. Set destaque_super_promocao = false for ALL products in produtos table
  const { error: prodErr } = await supabase
    .from('produtos')
    .update({ destaque_super_promocao: false, promocao_expira_em: null })
    .not('id', 'is', null);

  if (prodErr) {
    console.error('Error resetting destaque_super_promocao in produtos:', prodErr);
  } else {
    console.log('✅ Reset destaque_super_promocao = false and promocao_expira_em = null for ALL products in DB!');
  }

  console.log('🎉 ALL SHOWCASE HIGHLIGHTS ARE NOW COMPLETELY CLEAN & READY FOR YOUR MANUAL SELECTION!');
}

main();
