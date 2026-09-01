'use server'

import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export async function importarSKU(formData: FormData) {
  const rawSku = formData.get('sku') as string;
  const sku = rawSku ? rawSku.trim() : '';
  if (!sku) return;

  let redirectTo = '';

  try {
    const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
    const token = cfg?.valor?.access_token;
    
    if (!token) {
      redirectTo = '/admin/produtos?erro=Token do Bling não encontrado. Vá nas Configurações e autorize o app.';
    } else {
      const response = await fetch(`https://www.bling.com.br/Api/v3/produtos?codigo=${sku}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();

      if (response.status === 401 || data?.error?.type === 'invalid_token') {
        redirectTo = `/admin/produtos?erro=Token do Bling expirado. Vá em Configurações e autorize o aplicativo novamente!`;
      } else if (!data.data || data.data.length === 0) {
        redirectTo = `/admin/produtos?erro=Produto SKU ${sku} não encontrado no Bling.`;
      } else {
        const prodId = data.data[0].id;
        
        const detalhesReq = await fetch(`https://www.bling.com.br/Api/v3/produtos/${prodId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const detalhesJson = await detalhesReq.json();
        const prodCompleto = detalhesJson.data || data.data[0];

        let estoqueAtual = 0;
        try {
          const estoqueReq = await fetch(`https://www.bling.com.br/Api/v3/estoques/saldos?idsProdutos[]=${prodId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const estoqueJson = await estoqueReq.json();
          estoqueAtual = estoqueJson.data?.[0]?.saldoFisicoTotal || 0;
        } catch(e) {}

        const externas = prodCompleto.midia?.imagens?.externas?.map((img: any) => img.link) || [];
        const internas = prodCompleto.midia?.imagens?.internas?.map((img: any) => img.link) || [];
        let imagensBling = [...externas, ...internas];
        if (imagensBling.length === 0 && prodCompleto.imagemURL) {
          imagensBling = [prodCompleto.imagemURL];
        }

        const { uploadBlingImagesToSupabase } = await import('@/lib/upload-images');
        let imagensPermanentes = null;
        if (imagensBling.length > 0) {
          imagensPermanentes = await uploadBlingImagesToSupabase(imagensBling, String(prodCompleto.id));
        }

        const baseSlug = prodCompleto.nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const slug = `${baseSlug}-${prodCompleto.id}`;

        const produtoParaInserir = {
          bling_id: String(prodCompleto.id),
          codigo_barras: prodCompleto.codigo || prodCompleto.gtin,
          nome: prodCompleto.nome,
          preco: prodCompleto.preco,
          estoque: estoqueAtual,
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
          imagens: imagensPermanentes && imagensPermanentes.length > 0 ? imagensPermanentes : null
        };

        const { error } = await supabase.from('produtos').upsert(produtoParaInserir, { onConflict: 'bling_id' });
        
        if (error) {
          redirectTo = `/admin/produtos?erro=Banco recusou salvar: ${error.message}`;
        } else {
          redirectTo = `/admin/produtos?msg=Produto ${sku} importado com sucesso!`;
        }
      }
    }
  } catch (error: any) {
    redirectTo = `/admin/produtos?erro=Erro fatal: ${error.message}`;
  }
  
  redirect(redirectTo);
}
