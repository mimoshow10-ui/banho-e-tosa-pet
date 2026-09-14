const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectColumns() {
  const { data, error } = await supabase.from('produtos').select('*').limit(1);
  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('Colunas de produtos:', Object.keys(data[0] || {}));
  }
}

inspectColumns().catch(console.error);
