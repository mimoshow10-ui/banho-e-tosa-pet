const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConfig() {
  const { data } = await supabase.from('configuracoes').select('*').eq('chave', 'resend_config').maybeSingle();
  console.log("Resend config no Supabase:", data);
}

checkConfig();
