'use server'

import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function importarSKU(formData: FormData) {
  const rawSku = formData.get('sku') as string;
  const sku = rawSku ? rawSku.trim() : '';
  const currentParamsStr = (formData.get('currentParams') as string) || '';

  if (!sku) return;

  const urlParams = new URLSearchParams(currentParamsStr);
  urlParams.set('imported_sku', sku);

  function makeUrl(key: 'msg' | 'erro', message: string) {
    const p = new URLSearchParams(urlParams);
    p.set(key, message);
    return `/admin/produtos?${p.toString()}`;
  }

  let redirectTo = '';

  try {
    const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
    const token = cfg?.valor?.access_token;
    
    if (!token) {
      redirectTo = makeUrl('erro', 'Token do Bling não encontrado. Vá nas Configurações e autorize o app.');
    } else {
      const response = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${sku}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();

      if (response.status === 401 || data?.error?.type === 'invalid_token') {
        redirectTo = makeUrl('erro', 'Token do Bling expirado. Vá em Configurações e autorize o aplicativo novamente!');
      } else if (!data.data || data.data.length === 0) {
        redirectTo = makeUrl('erro', `Bling não encontrou nenhum produto com o SKU exato: '${sku}'. Verifique a digitação.`);
      } else {
        const produtoBuscado = data.data.find(
          (p: any) =>
            (p.codigo && p.codigo.trim().toLowerCase() === sku.toLowerCase()) ||
            String(p.id) === sku
        ) || data.data[0];
        
        if (!produtoBuscado) {
          redirectTo = makeUrl('erro', `Bling não encontrou o SKU exato: '${sku}'. Verifique a digitação.`);
          redirect(redirectTo);
          return;
        }

        async function fetchAndInsertBlingProduct(prodCompletoBase: any, parent_id: string | null = null): Promise<{id: string, imagensBling: any[], imagensPermanentes: any[], prodExistente: any} | null> {
          const prodId = String(prodCompletoBase.id);
          const detalhesReq = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prodId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const detalhesJson = await detalhesReq.json();
          const prodCompleto = detalhesJson.data || prodCompletoBase;

          if (String(prodCompleto.id) !== prodId) {
            console.error(`[IMAGE MAPPING UNRESOLVED] Invariante violado: Esperado BlingId ${prodId}, recebido ${prodCompleto.id}`);
            return null;
          }

          let estoqueAtual = 0;
          try {
            const estoqueReq = await fetch(`https://api.bling.com.br/Api/v3/estoques/saldos?idsProdutos[]=${prodId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const estoqueJson = await estoqueReq.json();
            estoqueAtual = estoqueJson.data?.[0]?.saldoFisicoTotal || 0;
          } catch(e) {}

          let imagensBling: string[] = [];
          const externas = prodCompleto.midia?.imagens?.externas?.map((img: any) => img.link) || [];
          const internas = prodCompleto.midia?.imagens?.internas?.map((img: any) => img.link) || [];
          imagensBling = [...externas, ...internas].filter(Boolean);

          if (imagensBling.length === 0 && Array.isArray(prodCompleto.midia)) {
            imagensBling = prodCompleto.midia.map((m: any) => m.url || m.link).filter(Boolean);
          }

          if (imagensBling.length === 0 && prodCompleto.imagemURL) {
            imagensBling = [prodCompleto.imagemURL];
          }

          const { data: prodExistente } = await supabase.from('produtos').select('id, imagens, origem').eq('bling_id', prodId).maybeSingle();

          const { uploadBlingImagesToSupabase } = await import('@/lib/upload-images');
          let imagensPermanentes: string[] | null = null;
          
          if (imagensBling.length > 0) {
            imagensPermanentes = await uploadBlingImagesToSupabase(imagensBling, prodId);
          }

          let imagensFinais: string[] | null = null;
          if (prodExistente?.origem === 'MANUAL') {
            imagensFinais = prodExistente.imagens;
          } else if (imagensPermanentes && imagensPermanentes.length > 0) {
            imagensFinais = imagensPermanentes;
          } else if (imagensBling && imagensBling.length > 0) {
            imagensFinais = imagensBling;
          } else {
            imagensFinais = null;
          }

          if (prodExistente) {
            await supabase.from('produtos').update({
              preco: prodCompleto.preco,
              estoque: estoqueAtual,
              codigo_barras: prodCompleto.codigo || prodCompleto.gtin,
              imagens: imagensFinais || prodExistente.imagens
            }).eq('id', prodExistente.id);

            return { id: prodExistente.id, imagensBling, imagensPermanentes: imagensPermanentes || [], prodExistente };
          } else {
            const baseSlug = prodCompleto.nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const slug = `${baseSlug}-${prodCompleto.id}`;

            const produtoParaInserir = {
              bling_id: prodId,
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
              imagens: imagensFinais,
              parent_id: parent_id
            };

            const { data: insertedData, error } = await supabase.from('produtos').insert([produtoParaInserir]).select('id').single();
            if (error) {
              console.error("Insert error ao importar SKU:", error);
              return null;
            }
            return { id: insertedData.id, imagensBling, imagensPermanentes: imagensPermanentes || [], prodExistente: null };
          }
        }

        const parentResult = await fetchAndInsertBlingProduct(produtoBuscado, null);
        if (!parentResult) {
          redirectTo = makeUrl('erro', 'Erro ao salvar produto importado do Bling.');
        } else {
          redirectTo = makeUrl('msg', `Produto para SKU ${sku} processado com sucesso!`);
        }
      }
    }
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Erro geral ao importar SKU:', error);
    redirectTo = makeUrl('erro', `Erro Fatal Code: ${encodeURIComponent(error.message)}`);
  }
  
  if (redirectTo) {
    redirect(redirectTo);
  }
}

export async function excluirProduto(id: string) {
  const { error } = await supabase.from('produtos').delete().eq('id', id);
  if (error) {
    redirect(`/admin/produtos?erro=Erro ao excluir produto: ${error.message}`);
  }
  revalidatePath('/admin/produtos');
  revalidatePath('/', 'layout');
  redirect(`/admin/produtos?msg=Produto excluído com sucesso!`);
}
