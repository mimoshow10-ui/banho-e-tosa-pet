const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBling() {
  const { data: cfgToken } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfgToken?.valor?.access_token;
  if (!token) return console.log('Sem token');

  // Buscar primeira página de produtos do Bling
  const res = await fetch('https://api.bling.com.br/Api/v3/produtos?limite=20', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(`Bling retornou ${data?.data?.length || 0} produtos na página 1:`);
  data?.data?.forEach(p => console.log(`- [${p.codigo}] ${p.nome} (tipo: ${p.tipo}, situacao: ${p.situacao})`));
}

checkBling().catch(console.error);
