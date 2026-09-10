import { supabase } from '../src/lib/supabase';

async function main() {
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;

  if (!token) {
    console.error('Token do Bling não encontrado!');
    return;
  }

  const sku = 'MS4541';
  console.log(`=== TESTANDO BUSCA BLING PARA SKU "${sku}" ===`);

  // 1. Buscando por codigo=MS4541
  console.log(`1. Fetching GET /Api/v3/produtos?codigo=${sku}`);
  const res1 = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(sku)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json1 = await res1.json();
  console.log(`Resultados por codigo:`, JSON.stringify(json1, null, 2));

  // 2. Buscando por pesquisa=MS4541
  console.log(`\n2. Fetching GET /Api/v3/produtos?pesquisa=${sku}`);
  const res2 = await fetch(`https://api.bling.com.br/Api/v3/produtos?pesquisa=${encodeURIComponent(sku)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json2 = await res2.json();
  console.log(`Resultados por pesquisa:`, JSON.stringify(json2, null, 2));

  // For each returned item, fetch details
  const items = json1?.data || json2?.data || [];
  for (const item of items) {
    console.log(`\n--- Detalhes do Produto ID Bling ${item.id} (Código: ${item.codigo}) ---`);
    const resDet = await fetch(`https://api.bling.com.br/Api/v3/produtos/${item.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const jsonDet = await resDet.json();
    console.log(`Nome: "${jsonDet?.data?.nome}"`);
    console.log(`Código: "${jsonDet?.data?.codigo}"`);
    console.log(`Mídia:`, JSON.stringify(jsonDet?.data?.midia, null, 2));
    console.log(`Variações:`, JSON.stringify(jsonDet?.data?.variacoes, null, 2));
  }
}

main();
