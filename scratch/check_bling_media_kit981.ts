import { supabase } from '../src/lib/supabase';

async function checkBlingMedia() {
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;

  const res = await fetch(`https://api.bling.com.br/Api/v3/produtos/15919622117`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const json = await res.json();
  console.log("Bling product 15919622117 midia:", JSON.stringify(json.data?.midia, null, 2));
}

checkBlingMedia();
