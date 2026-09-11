import { supabase } from '../src/lib/supabase';

async function testBlingKit981() {
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;

  if (!token) {
    console.error("Token do Bling não encontrado!");
    return;
  }

  const skusToTest = ['kit981', 'KIT981', 'kit 981', 'KIT 981', '981'];

  for (const sku of skusToTest) {
    console.log(`\n=== Testando busca por codigo='${sku}' ===`);
    let res = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(sku)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    let json = await res.json();
    console.log(`Status por codigo '${sku}':`, res.status, "Length:", json.data?.length);
    if (json.data && json.data.length > 0) {
      console.log("Encontrados:", json.data.map((p: any) => ({ id: p.id, codigo: p.codigo, nome: p.nome })));
    }

    console.log(`=== Testando busca por pesquisa='${sku}' ===`);
    res = await fetch(`https://api.bling.com.br/Api/v3/produtos?pesquisa=${encodeURIComponent(sku)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    json = await res.json();
    console.log(`Status por pesquisa '${sku}':`, res.status, "Length:", json.data?.length);
    if (json.data && json.data.length > 0) {
      console.log("Encontrados:", json.data.map((p: any) => ({ id: p.id, codigo: p.codigo, nome: p.nome })));
    }
  }
}

testBlingKit981().catch(console.error);
