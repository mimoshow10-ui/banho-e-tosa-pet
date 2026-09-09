const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testImport() {
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;
  console.log('Token do Bling presente:', !!token);

  if (!token) return;

  const sku = 'kit1957';
  const response = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${sku}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  console.log('Status Bling API:', response.status);
  console.log('Bling data:', JSON.stringify(data, null, 2));

  if (data?.data && data.data.length > 0) {
    const produtoBuscado = data.data[0];
    const prodId = String(produtoBuscado.id);
    
    // Test fetch details
    const detalhesReq = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prodId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const detalhesJson = await detalhesReq.json();
    const prodCompleto = detalhesJson.data || produtoBuscado;
    console.log('Produto Completo Nome:', prodCompleto.nome);

    const baseSlug = prodCompleto.nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const slug = `${baseSlug}-${prodCompleto.id}`;

    const produtoParaInserir = {
      bling_id: prodId,
      codigo_barras: prodCompleto.codigo || prodCompleto.gtin,
      nome: prodCompleto.nome,
      preco: prodCompleto.preco,
      estoque: 0,
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
      imagens: null,
      parent_id: null
    };

    console.log('Tentando inserir no Supabase...');
    const { data: insertedData, error } = await supabase.from('produtos').insert([produtoParaInserir]).select('id').single();
    if (error) {
      console.error('ERRO SUPABASE INSERT:', error);
    } else {
      console.log('SUCESSO INSERT:', insertedData);
    }
  }
}

testImport();
