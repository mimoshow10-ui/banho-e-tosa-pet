import { supabase } from '../src/lib/supabase';

async function inspectProduct() {
  const { data: prod } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', 'ff42a69f-1055-4433-859a-9c8329ff625f')
    .single();

  console.log("Produto Kit 110 Dia das Mães:", JSON.stringify(prod, null, 2));
}

inspectProduct();
