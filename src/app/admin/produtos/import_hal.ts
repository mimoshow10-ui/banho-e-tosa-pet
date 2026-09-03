import { supabase } from '@/lib/supabase';

export async function runImportHAL() {
  try {
    const { data: cfg, error: cfgError } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
    
    if (cfgError || !cfg?.valor?.access_token) {
      console.error('ERRO: Token do Bling não encontrado no banco!');
      return { erro: 'Token do Bling não encontrado.' };
    }

    const token = cfg.valor.access_token;
    console.log('Token do Bling recuperado com sucesso.');

    console.log('Buscando produtos no Bling contendo "HAL"...');
    
    const req = await fetch('https://api.bling.com.br/Api/v3/produtos?pagina=1&limite=100&pesquisa=HAL', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await req.json();

    if (data?.error) {
      console.error('Erro retornado pelo Bling:', data.error);
      return { erro: JSON.stringify(data.error) };
    }

    const produtosBling = data.data || [];
    console.log(`Total de produtos retornados pelo Bling com busca 'HAL': ${produtosBling.length}`);

    if (produtosBling.length === 0) {
      console.log('Nenhum produto encontrado com o termo HAL.');
      return { total: 0, mensagem: 'Nenhum produto encontrado com o termo HAL.' };
    }

    const resultados: any[] = [];

    for (const prod of produtosBling) {
      const sku = prod.codigo;
      const prodId = prod.id;
      console.log(`Importando SKU: ${sku} (ID Bling: ${prodId}) - ${prod.nome}...`);

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

        let imagensBling: string[] = [];
        const ext = prodCompleto.midia?.imagens?.externas?.map((i: any) => i.link) || [];
        const int = prodCompleto.midia?.imagens?.internas?.map((i: any) => i.link) || [];
        imagensBling = [...ext, ...int];
        if (imagensBling.length === 0 && Array.isArray(prodCompleto.midia)) {
          imagensBling = prodCompleto.midia.map((m: any) => m.url || m.link).filter(Boolean);
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
          resultados.push({ sku, nome: prod.nome, status: 'erro', mensagem: upsertError.message });
        } else {
          resultados.push({ sku, nome: upsertData.nome, preco: upsertData.preco, estoque: upsertData.estoque, status: 'sucesso' });
        }
      } catch (err: any) {
        resultados.push({ sku, status: 'erro', mensagem: err.message });
      }
    }

    return { total: produtosBling.length, resultados };
  } catch (err: any) {
    return { erro: err.message };
  }
}
