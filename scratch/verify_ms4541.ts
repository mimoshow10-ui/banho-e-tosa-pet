import { supabase } from '../src/lib/supabase';

async function verify() {
  const { data } = await supabase
    .from('produtos')
    .select('id, nome, codigo_barras, imagens')
    .eq('codigo_barras', 'MS4541')
    .single();

  console.log("Status final do SKU MS4541:", JSON.stringify(data, null, 2));
}

verify();
