import { supabase } from '../src/lib/supabase';

async function main() {
  const { data, error } = await supabase.from('produtos').select('*').limit(2);
  if (error) console.error('Error fetching produtos:', error);
  else console.log('Exemplo de produto:', Object.keys(data[0] || {}), data[0]);
}

main();
