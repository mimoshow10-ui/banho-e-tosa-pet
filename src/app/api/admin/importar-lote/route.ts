import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { skus, textoCsv } = body;

    let listaSkus: string[] = [];

    if (Array.isArray(skus)) {
      listaSkus = skus;
    } else if (typeof textoCsv === 'string') {
      listaSkus = textoCsv
        .split(/[\r\n,;]+/)
        .map((s) => s.trim())
        .filter((s) => s);
    }

    if (listaSkus.length === 0) {
      return NextResponse.json({ erro: 'Nenhum SKU fornecido para importação.' }, { status: 400 });
    }

    // Puxar token do Bling
    const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
    const token = cfg?.valor?.access_token;

    if (!token) {
      return NextResponse.json(
        { erro: 'Token do Bling não encontrado. Autorize o aplicativo em Configurações > Bling.' },
        { status: 401 }
      );
    }

    const resultados: { sku: string; status: 'sucesso' | 'erro'; mensagem: string }[] = [];

    for (const rawSku of listaSkus) {
      const sku = rawSku.trim();
      if (!sku) continue;

      try {
        const response = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${sku}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (response.status === 401 || data?.error?.type === 'invalid_token') {
          resultados.push({ sku, status: 'erro', mensagem: 'Token do Bling expirado' });
          break;
        }

        if (!data.data || data.data.length === 0) {
          resultados.push({ sku, status: 'erro', mensagem: 'Produto não encontrado no Bling' });
          continue;
        }

        const produtoBuscado = data.data.find(
          (p: any) => (p.codigo && p.codigo.toLowerCase() === sku.toLowerCase()) || String(p.id) === sku
        );

        if (!produtoBuscado) {
          resultados.push({ sku, status: 'erro', mensagem: `Código não confere exatamente com '${sku}'` });
          continue;
        }

        // Buscar detalhes e estoque
        const prodId = produtoBuscado.id;
        const detalhesReq = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prodId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const detalhesJson = await detalhesReq.json();
        const prodCompleto = detalhesJson.data || produtoBuscado;

        let estoqueAtual = 0;
        try {
          const estoqueReq = await fetch(`https://api.bling.com.br/Api/v3/estoques/saldos?idsProdutos[]=${prodId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const estoqueJson = await estoqueReq.json();
          estoqueAtual = estoqueJson.data?.[0]?.saldoFisicoTotal || 0;
        } catch {}

        let imagensBling: any[] = [];
        const externas = prodCompleto.midia?.imagens?.externas?.map((img: any) => img.link) || [];
        const internas = prodCompleto.midia?.imagens?.internas?.map((img: any) => img.link) || [];
        imagensBling = [...externas, ...internas];

        if (imagensBling.length === 0 && Array.isArray(prodCompleto.midia)) {
          imagensBling = prodCompleto.midia.map((m: any) => m.url || m.link).filter(Boolean);
        }

        if (imagensBling.length === 0 && prodCompleto.imagemURL) {
          imagensBling = [prodCompleto.imagemURL];
        }

        const { uploadBlingImagesToSupabase } = await import('@/lib/upload-images');
        let imagensPermanentes: any[] | null = null;
        if (imagensBling.length > 0) {
          imagensPermanentes = await uploadBlingImagesToSupabase(imagensBling, String(prodCompleto.id));
        }

        const baseSlug = prodCompleto.nome.toLowerCase().replace(/ /g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const slug = `${baseSlug}-${prodCompleto.id}`;

        const produtoParaInserir = {
          bling_id: String(prodCompleto.id),
          codigo_barras: prodCompleto.codigo || prodCompleto.gtin,
          nome: prodCompleto.nome,
          preco: prodCompleto.preco,
          estoque: estoqueAtual,
          slug,
          ativo: prodCompleto.situacao === 'A',
          peso_liquido: prodCompleto.pesoLiquido || 0,
          peso_bruto: prodCompleto.pesoBruto || 0,
          largura: prodCompleto.dimensoes?.largura || 0,
          altura: prodCompleto.dimensoes?.altura || 0,
          profundidade: prodCompleto.dimensoes?.profundidade || 0,
          marca: prodCompleto.marca || '',
          ncm: prodCompleto.tributacao?.ncm || '',
          descricao_curta: prodCompleto.descricaoCurta || '',
          imagens: imagensPermanentes && imagensPermanentes.length > 0 ? imagensPermanentes : null,
        };

        const { error } = await supabase
          .from('produtos')
          .upsert(produtoParaInserir, { onConflict: 'bling_id' });

        if (error) {
          resultados.push({ sku, status: 'erro', mensagem: error.message });
        } else {
          resultados.push({ sku, status: 'sucesso', mensagem: 'Importado com sucesso!' });
        }
      } catch (err: any) {
        resultados.push({ sku, status: 'erro', mensagem: err.message || 'Erro inesperado' });
      }
    }

    const sucessos = resultados.filter((r) => r.status === 'sucesso').length;
    const erros = resultados.filter((r) => r.status === 'erro').length;

    return NextResponse.json({
      sucesso: true,
      total: listaSkus.length,
      sucessos,
      erros,
      resultados,
    });
  } catch (err: any) {
    return NextResponse.json({ erro: err.message }, { status: 500 });
  }
}
