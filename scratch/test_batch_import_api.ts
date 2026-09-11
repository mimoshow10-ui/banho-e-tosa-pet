import { supabase } from '../src/lib/supabase';

async function testBatchImportApi() {
  const skusTexto = `
MS4541
kit981
  `;

  console.log("Testando API /api/admin/importar-lote com múltiplos SKUs por linha...");

  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;
  if (!token) {
    console.error("Token não encontrado!");
    return;
  }

  // Parse SKUs like route.ts
  const listaSkus = skusTexto.split(/[\r\n,;\t]+/).map(s => s.trim()).filter(Boolean);
  console.log("SKUs parseados:", listaSkus);

  for (const sku of listaSkus) {
    const res = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(sku)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    console.log(`Resultado Bling para '${sku}':`, json.data?.length ? json.data[0].nome : 'Nenhum');
  }
}

testBatchImportApi();
