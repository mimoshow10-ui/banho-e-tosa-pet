const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('⚡ Starting HYBRID photo recovery for all Amazon S3 URL products...');

  const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;

  // Fetch all products in DB
  let allProds = [];
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from('produtos')
      .select('id, codigo_barras, nome, imagens')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allProds.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  const amazonProds = allProds.filter(p => p.imagens && p.imagens.some(i => typeof i === 'string' && i.includes('amazonaws.com')));
  console.log(`Found ${amazonProds.length} products with Amazon S3 URLs.`);

  let recoveredCount = 0;
  let trulyNullCount = 0;

  const batchSize = 10;
  for (let i = 0; i < amazonProds.length; i += batchSize) {
    const batch = amazonProds.slice(i, i + batchSize);

    await Promise.all(batch.map(async (prod) => {
      const sku = (prod.codigo_barras || prod.id).trim();
      const safeFolder = sku.replace(/[^a-zA-Z0-9_-]/g, '_');
      const urlsToTry = [];

      // 1. First collect existing Amazon URLs from DB
      if (Array.isArray(prod.imagens)) {
        prod.imagens.forEach(img => {
          if (typeof img === 'string' && img.startsWith('http')) {
            urlsToTry.push(img);
          }
        });
      }

      // 2. Also query Bling API for fresh URLs if token available
      if (token && prod.codigo_barras) {
        try {
          const searchRes = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(prod.codigo_barras)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const searchJson = await searchRes.json();
          const blingId = searchJson.data?.[0]?.id;

          if (blingId) {
            const detailRes = await fetch(`https://api.bling.com.br/Api/v3/produtos/${blingId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const detailJson = await detailRes.json();
            const blingData = detailJson.data;

            if (blingData?.midia?.imagens?.externas?.length) urlsToTry.push(...blingData.midia.imagens.externas.map(m => m.link));
            if (blingData?.midia?.imagens?.internas?.length) urlsToTry.push(...blingData.midia.imagens.internas.map(m => m.link));
            if (blingData?.midia?.imagens?.anexos?.length) urlsToTry.push(...blingData.midia.imagens.anexos.map(m => m.link));
          }
        } catch (e) {}
      }

      // De-duplicate URLs
      const uniqueUrls = Array.from(new Set(urlsToTry));
      const permanentUrls = [];

      // Try downloading each URL
      for (let imgIdx = 0; imgIdx < uniqueUrls.length; imgIdx++) {
        const rawUrl = uniqueUrls[imgIdx];
        try {
          const imgRes = await fetch(rawUrl);
          if (!imgRes.ok) continue;

          const buffer = Buffer.from(await imgRes.arrayBuffer());
          if (buffer.length < 500) continue; // Skip corrupted/empty responses

          const ext = rawUrl.includes('.png') ? 'png' : 'jpg';
          const fileName = `${safeFolder}_${Date.now()}_${imgIdx + 1}.${ext}`;
          const storagePath = `produtos/${safeFolder}/${fileName}`;

          const { error: uploadErr } = await supabase.storage
            .from('produtos-fotos')
            .upload(storagePath, buffer, {
              contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
              upsert: true
            });

          if (!uploadErr) {
            permanentUrls.push(`https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/${storagePath}`);
          }
        } catch (e) {}
      }

      if (permanentUrls.length > 0) {
        await supabase.from('produtos').update({ imagens: permanentUrls }).eq('id', prod.id);
        recoveredCount++;
      } else {
        // ONLY if no URL could be downloaded, mark as null (🟡 Sem Foto)
        await supabase.from('produtos').update({ imagens: null }).eq('id', prod.id);
        trulyNullCount++;
      }
    }));

    if ((i + batchSize) % 50 === 0 || (i + batchSize) >= amazonProds.length) {
      console.log(`[Progress: ${Math.min(i + batchSize, amazonProds.length)}/${amazonProds.length}] Recovered & Saved to Supabase: ${recoveredCount} | Truly 🟡 Sem Foto: ${trulyNullCount}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n🎉 DONE! ${recoveredCount} products converted to permanent Supabase Storage photos, ${trulyNullCount} products confirmed without photo in Bling.`);
}

main();
