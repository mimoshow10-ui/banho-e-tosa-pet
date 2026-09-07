const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('=== STARTING COMPLETE BLING PHOTO SYNC FOR ALL PRODUCTS ===');

  // 1. Fetch Bling token
  const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;
  if (!token) {
    console.error('CRITICAL: Bling token not found in configuracoes!');
    return;
  }

  // 2. Fetch all products from DB
  console.log('Fetching all products from Supabase DB...');
  let allProds = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, codigo_barras, nome, imagens')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error || !data || data.length === 0) break;
    allProds.push(...data);
    if (data.length < pageSize) break;
    page++;
  }
  console.log(`Total products in DB: ${allProds.length}`);

  // 3. Filter products needing photo recovery (containing amazonaws.com or missing photos with a SKU)
  const toFix = allProds.filter(p => {
    if (!p.codigo_barras) return false;
    if (!p.imagens || p.imagens.length === 0) return true;
    return p.imagens.some(img => typeof img === 'string' && img.includes('amazonaws.com'));
  });

  console.log(`Found ${toFix.length} products needing photo recovery/sync from Bling.`);

  let fixedCount = 0;
  let skippedCount = 0;

  for (let idx = 0; idx < toFix.length; idx++) {
    const prod = toFix[idx];
    const sku = prod.codigo_barras;
    console.log(`\n[${idx + 1}/${toFix.length}] Processing SKU ${sku} (${prod.nome})...`);

    try {
      // Query Bling API
      const searchRes = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(sku)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const searchJson = await searchRes.json();

      if (!searchJson.data || searchJson.data.length === 0) {
        console.warn(`  ⚠️ SKU ${sku} not found in Bling API.`);
        skippedCount++;
        continue;
      }

      const blingId = searchJson.data[0].id;
      const detailRes = await fetch(`https://api.bling.com.br/Api/v3/produtos/${blingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const detailJson = await detailRes.json();
      const blingData = detailJson.data;

      let rawImageUrls = [];
      if (blingData?.midia?.imagens?.externas?.length) {
        rawImageUrls.push(...blingData.midia.imagens.externas.map(img => img.link));
      }
      if (blingData?.midia?.imagens?.internas?.length) {
        rawImageUrls.push(...blingData.midia.imagens.internas.map(img => img.link));
      }
      if (blingData?.midia?.imagens?.anexos?.length) {
        rawImageUrls.push(...blingData.midia.imagens.anexos.map(img => img.link));
      }

      if (rawImageUrls.length === 0) {
        console.warn(`  ⚠️ No images available in Bling for SKU ${sku}.`);
        skippedCount++;
        continue;
      }

      // Download and save to Supabase Storage
      const permanentUrls = [];
      for (let i = 0; i < rawImageUrls.length; i++) {
        const rawUrl = rawImageUrls[i];
        try {
          const imgRes = await fetch(rawUrl);
          if (!imgRes.ok) continue;

          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const ext = rawUrl.includes('.png') ? 'png' : 'jpg';
          const fileName = `${sku.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}_${i + 1}.${ext}`;
          const storagePath = `produtos/${sku.replace(/[^a-zA-Z0-9_-]/g, '_')}/${fileName}`;

          const { error: uploadErr } = await supabase.storage
            .from('produtos-fotos')
            .upload(storagePath, buffer, {
              contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
              upsert: true
            });

          if (!uploadErr) {
            const publicUrl = `https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/${storagePath}`;
            permanentUrls.push(publicUrl);
          }
        } catch (e) {
          console.error(`  Error downloading image ${i + 1} for SKU ${sku}:`, e.message);
        }
      }

      if (permanentUrls.length > 0) {
        await supabase
          .from('produtos')
          .update({ imagens: permanentUrls })
          .eq('id', prod.id);
        console.log(`  ✅ Successfully updated DB for SKU ${sku} with ${permanentUrls.length} permanent photos!`);
        fixedCount++;
      } else {
        skippedCount++;
      }
    } catch (err) {
      console.error(`  Error processing SKU ${sku}:`, err.message);
      skippedCount++;
    }

    // Gentle delay to respect Bling API rate limit (3 req/sec)
    await new Promise(r => setTimeout(r, 350));
  }

  console.log(`\n=== ALL DONE ===`);
  console.log(`Fixed: ${fixedCount} | Skipped/No Bling Image: ${skippedCount}`);
}

main();
