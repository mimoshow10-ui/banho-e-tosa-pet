const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

async function testSlug() {
  const slug = '1-cartela-adesiva-holografica-mundo-animal-pet-banho-etosa-16691490953';
  const { data, error } = await supabase.from('produtos').select('*').eq('slug', slug);
  console.log('Result count:', data ? data.length : 0);
  if (data && data.length > 0) {
    console.log('Product:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('Error:', error);
  }
}

testSlug();
