const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

async function testBlingDirect() {
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;
  if (!token) {
    console.error('No Bling token found');
    return;
  }

  const ids = ['16314383103', '16314448264', '16314566070', '16314583252'];

  for (const id of ids) {
    const res = await fetch(`https://api.bling.com.br/Api/v3/produtos/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    const prod = json.data;
    if (prod) {
      const ext = prod.midia?.imagens?.externas?.map(i => i.link) || [];
      const int = prod.midia?.imagens?.internas?.map(i => i.link) || [];
      console.log(`\n=== BLING PRODUCT ID: ${id} ===`);
      console.log(`SKU: ${prod.codigo}`);
      console.log(`Nome: ${prod.nome}`);
      console.log(`Imagens Externas (${ext.length}):`, ext[0] || 'Nenhuma');
      console.log(`Imagens Internas (${int.length}):`, int[0] || 'Nenhuma');
    } else {
      console.log(`Product ID ${id} not returned by Bling`, json);
    }
  }
}

testBlingDirect();
