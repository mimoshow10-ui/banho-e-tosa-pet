import { supabase } from './supabase';

export async function uploadBlingImagesToSupabase(blingUrls: string[], productId: string): Promise<string[]> {
  const permanentUrls: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < blingUrls.length; i++) {
    const url = blingUrls[i];
    
    if (url.includes('supabase.co/storage/v1/object/public/produtos-fotos')) {
      permanentUrls.push(url);
      continue;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Servidor da imagem retornou status ${response.status} (${response.statusText}).`);
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
        console.error(`Falha no Supabase Storage: ${error.message}. Fazendo fallback para Base64.`);
        const base64 = Buffer.from(buffer).toString('base64');
        const mime = response.headers.get('content-type') || 'image/jpeg';
        permanentUrls.push(`data:${mime};base64,${base64}`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('produtos-fotos')
        .getPublicUrl(filePath);

      permanentUrls.push(publicUrlData.publicUrl);
    } catch (e: any) {
      console.error('Exceção no processamento da imagem:', e);
      errors.push(`URL ${url}: ${e.message || e}`);
      continue;
    }
  }

  if (blingUrls.length > 0 && permanentUrls.length === 0) {
    throw new Error(`O Bling enviou ${blingUrls.length} URLs de fotos, mas TODAS falharam ao baixar. Detalhes: ${errors.join(' | ')}`);
  }

  return permanentUrls;
}
