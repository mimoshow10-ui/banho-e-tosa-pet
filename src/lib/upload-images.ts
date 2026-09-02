import { supabase } from './supabase';

export async function uploadBlingImagesToSupabase(blingUrls: string[], productId: string): Promise<string[]> {
  const permanentUrls: string[] = [];

  for (let i = 0; i < blingUrls.length; i++) {
    const url = blingUrls[i];
    
    if (url.includes('supabase.co/storage/v1/object/public/produtos-fotos')) {
      permanentUrls.push(url);
      continue;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Servidor da imagem retornou status ${response.status} (${response.statusText}). O link da imagem no Bling pode estar quebrado ou bloqueado.`);
      }
      const buffer = await response.arrayBuffer();

      const fileExt = 'jpg';
      const fileName = `produto_${productId}_${i}_${Date.now()}.${fileExt}`;
      const filePath = `${productId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('produtos-fotos')
        .upload(filePath, buffer, {
          contentType: response.headers.get('content-type') || 'image/jpeg',
          upsert: true
        });

      if (error) {
        throw new Error(`Falha no banco de dados Supabase ao salvar a imagem: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('produtos-fotos')
        .getPublicUrl(filePath);

      permanentUrls.push(publicUrlData.publicUrl);
    } catch (e: any) {
      console.error('Exceção no processamento da imagem:', e);
      throw new Error(`Falha no download/upload da imagem ${url}: ${e.message || e}`);
    }
  }

  if (blingUrls.length > 0 && permanentUrls.length === 0) {
    throw new Error(`O Bling enviou ${blingUrls.length} URLs de fotos, mas o nosso sistema falhou ao tentar baixar todas elas. Certifique-se de que as URLs de imagem cadastradas no Bling são válidas, públicas e começam com https://`);
  }

  return permanentUrls;
}
