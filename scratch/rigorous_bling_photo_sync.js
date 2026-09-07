const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('====================================================');
  console.log('   RIGOROUS BLING PHOTO SWEEP & SUPABASE STORAGE    ');
  console.log('====================================================');

  // 1. Fetch Bling API Access Token
  const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;
  if (!token) {
    console.error('CRITICAL: Bling token not found in configuracoes!');
    return;
  }
  console.log('✅ Bling API token retrieved successfully.');

  // 2. Fetch all products from DB in pages
  let allProds = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, codigo_barras, nome, imagens, parent_id')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error || !data || data.length === 0) break;
    allProds.push(...data);
    if (data.length < pageSize) break;
    page++;
  }
  console.log(`📦 Total products in Supabase DB: ${allProds.length}`);

  // 3. Identify products that need photo check/recovery:
  // A product needs recovery if:
  // - It has no images (null or empty array)
  // - Or any image URL contains 'amazonaws.com'
  // - Or any image URL is broken/not hosted on Supabase Storage ('supabase.co')
  const toCheck = allProds.filter(p => {
    if (!p.imagens || p.imagens.length === 0) return true;
    return p.imagens.some(img => typeof img === 'string' && (!img.includes('supabase.co') || img.includes('amazonaws.com')));
  });

  console.log(`🔍 Found ${toCheck.length} products to evaluate for Bling photo recovery.`);

  let recoveredCount = 0;
  let trulyNoPhotoInBling = 0;
  let alreadyHasValidPhoto = allProds.length - toCheck.length;

  for (let idx = 0; idx < toCheck.length; idx++) {
    const prod = toCheck[idx];
    const rawSku = prod.codigo_barras || '';
    const cleanSku = rawSku.trim();
    
    // Progress log every 10 items or when recovered
    if (idx % 20 === 0) {
      console.log(`\n--- Progress: [${idx + 1}/${toCheck.length}] (Recovered so far: ${recoveredCount}) ---`);
    }

    if (!cleanSku) {
      trulyNoPhotoInBling++;
      continue;
    }

    try {
      let rawImageUrls = [];

      // A. Query Bling API by SKU
      let searchRes = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(cleanSku)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let searchJson = await searchRes.json();

      let blingId = searchJson.data?.[0]?.id;

      // B. If not found by exact SKU and SKU has variation prefix (e.g. MS3400BD10G -> MS3400BD), try base SKU
      if (!blingId && cleanSku.includes('-')) {
        const baseSku = cleanSku.split('-')[0];
        searchRes = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(baseSku)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        searchJson = await searchRes.json();
        blingId = searchJson.data?.[0]?.id;
      }

      if (blingId) {
        const detailRes = await fetch(`https://api.bling.com.br/Api/v3/produtos/${blingId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const detailJson = await detailRes.json();
        const blingData = detailJson.data;

        if (blingData?.midia?.imagens?.externas?.length) {
          rawImageUrls.push(...blingData.midia.imagens.externas.map(img => img.link));
        }
        if (blingData?.midia?.imagens?.internas?.length) {
          rawImageUrls.push(...blingData.midia.imagens.internas.map(img => img.link));
        }
        if (blingData?.midia?.imagens?.anexos?.length) {
          rawImageUrls.push(...blingData.midia.imagens.anexos.map(img => img.link));
        }

        // If child variation in Bling has no images, check if parent in Bling has images
        if (rawImageUrls.length === 0 && blingData?.pai?.id) {
          const parentDetailRes = await fetch(`https://api.bling.com.br/Api/v3/produtos/${blingData.pai.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const parentDetailJson = await parentDetailRes.json();
          const parentData = parentDetailJson.data;

          if (parentData?.midia?.imagens?.externas?.length) {
            rawImageUrls.push(...parentData.midia.imagens.externas.map(img => img.link));
          }
          if (parentData?.midia?.imagens?.internas?.length) {
            rawImageUrls.push(...parentData.midia.imagens.internas.map(img => img.link));
          }
          if (parentData?.midia?.imagens?.anexos?.length) {
            rawImageUrls.push(...parentData.midia.imagens.anexos.map(img => img.link));
          }
        }
      }

      if (rawImageUrls.length === 0) {
        trulyNoPhotoInBling++;
        continue;
      }

      // C. Download images from Bling S3 and upload to permanent Supabase Storage
      const permanentUrls = [];
      const safeFolder = cleanSku.replace(/[^a-zA-Z0-9_-]/g, '_');

      for (let i = 0; i < rawImageUrls.length; i++) {
        const rawUrl = rawImageUrls[i];
        try {
          const imgRes = await fetch(rawUrl);
          if (!imgRes.ok) continue;

          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const ext = rawUrl.includes('.png') ? 'png' : 'jpg';
          const fileName = `${safeFolder}_${Date.now()}_${i + 1}.${ext}`;
          const storagePath = `produtos/${safeFolder}/${fileName}`;

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
          // ignore individual image failure
        }
      }

      if (permanentUrls.length > 0) {
        await supabase
          .from('produtos')
          .update({ imagens: permanentUrls })
          .eq('id', prod.id);

        recoveredCount++;
        console.log(`  ✅ RECOVERED SKU [${cleanSku}] ${prod.nome}: ${permanentUrls.length} permanent photos saved to Supabase Storage.`);
      } else {
        trulyNoPhotoInBling++;
      }

    } catch (err) {
      trulyNoPhotoInBling++;
    }

    // Rate limit delay (250ms = 4 requests/sec max for Bling API)
    await new Promise(r => setTimeout(r, 250));
  }

  console.log('\n====================================================');
  console.log('              SWEEP COMPLETED                       ');
  console.log('====================================================');
  console.log(`- Already had valid Supabase photos: ${alreadyHasValidPhoto}`);
  console.log(`- RECOVERED & Uploaded from Bling:  ${recoveredCount}`);
  console.log(`- Truly NO photo in Bling:          ${trulyNoPhotoInBling}`);
  console.log('====================================================');
}

main();
