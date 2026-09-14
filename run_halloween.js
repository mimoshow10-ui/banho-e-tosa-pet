const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getValidBlingToken() {
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const { data: credsCfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').single();

  const tokenInfo = cfg?.valor;
  const creds = credsCfg?.valor;

  if (!tokenInfo?.access_token) return null;

  const testReq = await fetch('https://api.bling.com.br/Api/v3/produtos?pagina=1&limite=1', {
    headers: { 'Authorization': `Bearer ${tokenInfo.access_token}` }
  });

  if (testReq.status !== 401) {
    console.log('Access Token do Bling válido e ativo!');
    return tokenInfo.access_token;
  }

  console.log('Access Token expirou. Renovando via Refresh Token...');

  if (!tokenInfo?.refresh_token || !creds?.client_id || !creds?.client_secret) {
    console.error('Faltam credenciais para renovação.');
    return null;
  }

  try {
    const authResponse = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(creds.client_id + ':' + creds.client_secret).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenInfo.refresh_token,
      })
    });

    const authData = await authResponse.json();

    if (authData.access_token) {
      console.log('✅ Token do Bling RENOVADO COM SUCESSO!');
      await supabase.from('configuracoes').upsert({
        chave: 'bling_tokens',
        valor: {
          access_token: authData.access_token,
          refresh_token: authData.refresh_token || tokenInfo.refresh_token,
        }
      }, { onConflict: 'chave' });

      return authData.access_token;
    }
  } catch (e) {
    console.error('Erro na renovação:', e.message);
  }

  return null;
}

async function runImport() {
  const token = await getValidBlingToken();
  if (!token) {
    console.error('Não foi possível obter um token válido do Bling.');
    return;
  }

  console.log('Buscando produtos no Bling...');
  
  let todosProdutosBling = [];
  let pagina = 1;
  let temMais = true;

  while (temMais && pagina <= 15) {
    console.log(`Carregando página ${pagina} do Bling...`);
    try {
      const req = await fetch(`https://api.bling.com.br/Api/v3/produtos?pagina=${pagina}&limite=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await req.json();
      const itens = data.data || [];
      
      if (itens.length === 0) {
        temMais = false;
      } else {
        todosProdutosBling.push(...itens);
        pagina++;
      }
    } catch (e) {
      console.error(`Erro na página ${pagina}:`, e.message);
      temMais = false;
    }
  }

  console.log(`\nTotal de produtos retornados do Bling: ${todosProdutosBling.length}`);

  // Filtrar produtos com Halloween, Haloween, Hallowen ou HAL
  const regexHalloween = /hal|hallowe|halowe|hallowen/i;
  const produtosFiltrados = todosProdutosBling.filter(p => {
    const nome = p.nome || '';
    const codigo = p.codigo || '';
    return regexHalloween.test(nome) || regexHalloween.test(codigo);
  });

  console.log(`\n====================================================`);
  console.log(`TOTAL DE PRODUTOS HALLOWEEN / HAL ENCONTRADOS: ${produtosFiltrados.length}`);
  console.log(`====================================================`);

  if (produtosFiltrados.length === 0) {
    console.log('Nenhum produto encontrado com os termos de Halloween.');
    return;
  }

  const resultados = [];

  for (const prod of produtosFiltrados) {
    const sku = prod.codigo || prod.gtin || `ID-${prod.id}`;
    const prodId = prod.id;
    console.log(`\n📦 Importando SKU: ${sku} - ${prod.nome}...`);

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
        console.error(`❌ Erro [${sku}]:`, upsertError.message);
        resultados.push({ sku, nome: prod.nome, status: 'erro', erro: upsertError.message });
      } else {
        console.log(`✅ SUCESSO: ${upsertData.nome} (SKU: ${upsertData.codigo_barras}) | Preço: R$ ${upsertData.preco} | Estoque: ${upsertData.estoque}`);
        resultados.push({ sku: upsertData.codigo_barras, nome: upsertData.nome, preco: upsertData.preco, estoque: upsertData.estoque, status: 'sucesso' });
      }
    } catch (e) {
      console.error(`❌ Exceção [${sku}]:`, e.message);
      resultados.push({ sku, status: 'erro', erro: e.message });
    }
  }

  console.log('\n====================================================');
  console.log('RELATÓRIO DE IMPORTAÇÃO HALLOWEEN / HAL:');
  console.log('====================================================');
  console.log(`Total Sucessos: ${resultados.filter(r => r.status === 'sucesso').length}`);
  console.log(`Total Erros: ${resultados.filter(r => r.status === 'erro').length}`);
  console.log(JSON.stringify(resultados, null, 2));
}

runImport();
