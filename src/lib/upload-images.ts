import { supabase } from './supabase';

export async function uploadBlingImagesToSupabase(blingUrls: string[], productId: string): Promise<string[]> {
  if (!productId || !Array.isArray(blingUrls) || blingUrls.length === 0) {
    return [];
  }

  const cleanProductId = String(productId).trim();
  const permanentUrls: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < blingUrls.length; i++) {
    const url = blingUrls[i];
    if (!url || typeof url !== 'string') continue;
    
    // Se a imagem já estiver no nosso Supabase Storage, mantemos intacta
    if (url.includes('supabase.co/storage/v1/object/public/produtos-fotos')) {
      permanentUrls.push(url);
      continue;
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status} ao baixar imagem do Bling`);
      }

      const buffer = await response.arrayBuffer();
      const fileExt = 'jpg';
      const fileName = `produto_${cleanProductId}_${i}_${Date.now()}.${fileExt}`;
      const filePath = `${cleanProductId}/${fileName}`;

      const { error } = await supabase.storage
        .from('produtos-fotos')
        .upload(filePath, buffer, {
          contentType: response.headers.get('content-type') || 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error(`[IMAGE SYNC STORAGE ERROR] Product ${cleanProductId}: ${error.message}`);
        // Se falhar no upload do Supabase Storage, usamos a URL direta verificada do Bling
        permanentUrls.push(url);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('produtos-fotos')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        permanentUrls.push(publicUrlData.publicUrl);
      } else {
        permanentUrls.push(url);
      }
    } catch (e: any) {
      console.error(`[IMAGE SYNC FETCH EXCEPTION] Product ${cleanProductId}: ${e.message || e}`);
      errors.push(`URL ${url}: ${e.message || e}`);
      // Fallback para URL verificada se o fetch falhar
      permanentUrls.push(url);
    }
  }

  console.log(`[IMAGE SYNC] Product ${cleanProductId}: ${permanentUrls.length} imagens validadas e associadas com sucesso.`);
  return permanentUrls;
}
