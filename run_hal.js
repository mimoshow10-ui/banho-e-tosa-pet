require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltam variáveis de ambiente SUPABASE URL ou KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Conectado ao Supabase:", supabaseUrl);
  
  const { data: cfg, error: cfgError } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  if (cfgError || !cfg?.valor?.access_token) {
    console.error('ERRO: Token do Bling não encontrado no banco!');
    return;
  }

  const token = cfg.valor.access_token;
  console.log('Token do Bling obtido com sucesso!');

  console.log('Buscando produtos no Bling com termo HAL...');
  const req = await fetch('https://api.bling.com.br/Api/v3/produtos?pagina=1&limite=100&pesquisa=HAL', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await req.json();
  const produtosBling = data.data || [];
  console.log(`Total de produtos Bling encontrados: ${produtosBling.length}`);

  if (produtosBling.length === 0) {
    console.log('Nenhum produto com HAL encontrado no Bling.');
    return;
  }

  const resultados = [];

  for (const prod of produtosBling) {
    const sku = prod.codigo;
    const prodId = prod.id;
    console.log(`\nImportando SKU: ${sku} - ${prod.nome}...`);

    try {
      const detReq = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prodId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const detJson = await detReq.json();
      const prodCompleto = detJson.data || prod;

      let estoque = 0;
      try {
        const estReq = await fetch(`https://api.bling.com.br/Api/v3/estoques/saldos?idsProdutos[]=${prodId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const estJson = await estReq.json();
        estoque = estJson.data?.[0]?.saldoFisicoTotal || 0;
      } catch (e) {}

      let imagensBling = [];
      const ext = prodCompleto.midia?.imagens?.externas?.map(i => i.link) || [];
      const int = prodCompleto.midia?.imagens?.internas?.map(i => i.link) || [];
      imagensBling = [...ext, ...int];
      if (imagensBling.length === 0 && Array.isArray(prodCompleto.midia)) {
        imagensBling = prodCompleto.midia.map(m => m.url || m.link).filter(Boolean);
      }
      if (imagensBling.length === 0 && prodCompleto.imagemURL) {
        imagensBling = [prodCompleto.imagemURL];
      }

      const baseSlug = prodCompleto.nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const slug = `${baseSlug}-${prodCompleto.id}`;

      const payload = {
        bling_id: String(prodCompleto.id),
        codigo_barras: prodCompleto.codigo || prodCompleto.gtin,
        nome: prodCompleto.nome,
        preco: prodCompleto.preco,
        estoque: estoque,
        slug: slug,
        ativo: prodCompleto.situacao === 'A',
        peso_liquido: prodCompleto.pesoLiquido || 0,
        peso_bruto: prodCompleto.pesoBruto || 0,
        largura: prodCompleto.dimensoes?.largura || 0,
        altura: prodCompleto.dimensoes?.altura || 0,
        profundidade: prodCompleto.dimensoes?.profundidade || 0,
        marca: prodCompleto.marca || '',
        ncm: prodCompleto.tributacao?.ncm || '',
        descricao_curta: prodCompleto.descricaoCurta || '',
        imagens: imagensBling.length > 0 ? imagensBling : null,
      };

      const { data: upsertData, error: upsertError } = await supabase
        .from('produtos')
        .upsert(payload, { onConflict: 'bling_id' })
        .select('id, nome, codigo_barras, preco, estoque')
        .single();

      if (upsertError) {
        console.error(`❌ Erro no upsert [${sku}]:`, upsertError.message);
        resultados.push({ sku, nome: prod.nome, status: 'erro', erro: upsertError.message });
      } else {
        console.log(`✅ SUCESSO: ${upsertData.nome} (SKU: ${upsertData.codigo_barras}) | R$ ${upsertData.preco} | Estoque: ${upsertData.estoque}`);
        resultados.push({ sku: upsertData.codigo_barras, nome: upsertData.nome, preco: upsertData.preco, estoque: upsertData.estoque, status: 'sucesso' });
      }
    } catch (e) {
      console.error(`❌ Exceção ao processar ${sku}:`, e.message);
      resultados.push({ sku, status: 'erro', erro: e.message });
    }
  }

  console.log('\n====================================================');
  console.log('RESULTADO DA IMPORTAÇÃO EM LOTE DO TERMO "HAL":');
  console.log('====================================================');
  console.log(`Total Sucessos: ${resultados.filter(r => r.status === 'sucesso').length}`);
  console.log(`Total Erros: ${resultados.filter(r => r.status === 'erro').length}`);
  console.log(JSON.stringify(resultados, null, 2));
}

run();
