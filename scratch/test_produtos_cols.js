const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCols() {
  const { data, error } = await supabase.from('produtos').select('*').limit(1);
  if (data && data[0]) {
    console.log("Colunas da tabela produtos:", Object.keys(data[0]));
  } else {
    console.log("Erro ao buscar produtos:", error);
  }
}

testCols();
