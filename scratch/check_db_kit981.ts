import { supabase } from '../src/lib/supabase';

async function checkDbKit981() {
  const { data: prod } = await supabase
    .from('produtos')
    .select('*')
    .ilike('codigo_barras', 'kit981')
    .maybeSingle();

  console.log("Resultado da busca no banco local por SKU kit981:", prod);
}

checkDbKit981();
