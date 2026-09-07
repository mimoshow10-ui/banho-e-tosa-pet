const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpdate() {
  const { data: p } = await supabase.from('produtos').select('id, categorias_adicionais').limit(1);
  console.log("Teste de consulta de categorias_adicionais:", p);
}

testUpdate();
