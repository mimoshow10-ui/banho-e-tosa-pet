import { supabase } from './supabase';

export async function uploadBlingImagesToSupabase(blingUrls: string[], productId: string): Promise<string[]> {
  const permanentUrls: string[] = [];

  for (let i = 0; i < blingUrls.length; i++) {
    const url = blingUrls[i];
    
    if (url.includes('supabase.co/storage/v1/object/public/produtos-imagens')) {
      permanentUrls.push(url);
      continue;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Falha ao baixar imagem do Bling:', url);
        continue;
      }
      const buffer = await response.arrayBuffer();

      const fileExt = 'jpg';
      const fileName = `produto_${productId}_${i}_${Date.now()}.${fileExt}`;
      const filePath = `${productId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('produtos-imagens')
        .upload(filePath, buffer, {
          contentType: response.headers.get('content-type') || 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error('Erro no upload para o Supabase:', error.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('produtos-imagens')
        .getPublicUrl(filePath);

      permanentUrls.push(publicUrlData.publicUrl);
    } catch (e) {
      console.error('Exceção no processamento da imagem:', e);
    }
  }

  return permanentUrls;
}
