import { supabase } from '../src/lib/supabase';

async function checkCount() {
  const { data: pAll, count } = await supabase
    .from('produtos')
    .select('id, categoria_id', { count: 'exact' })
    .eq('ativo', true);

  console.log("Exact active count:", count, "Fetched count:", pAll?.length);
  
  const foundKitsProd = pAll?.find(p => p.id === 'ff42a69f-1055-4433-859a-9c8329ff625f');
  console.log("Is Kits product in fetched array?", !!foundKitsProd);
}

checkCount();
