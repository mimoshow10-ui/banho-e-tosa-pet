const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixProduct(sku) {
  console.log(`\n=== Processing SKU: ${sku} ===`);
  
  // 1. Fetch Bling token
  const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;

  if (!token) {
    console.error('Bling token not found in configuracoes!');
    return;
  }

  // 2. Fetch product from Supabase DB
  const { data: prods } = await supabase.from('produtos').select('*').eq('codigo_barras', sku);
  if (!prods || prods.length === 0) {
    console.error(`Product with SKU ${sku} not found in DB`);
    return;
  }
  const prod = prods[0];
  console.log(`Found DB Product: [${prod.codigo_barras}] ${prod.nome} (ID: ${prod.id})`);

  // 3. Query Bling API for product details
  console.log(`Fetching product details from Bling API for SKU ${sku}...`);
  const searchRes = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(sku)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const searchJson = await searchRes.json();

  if (!searchJson.data || searchJson.data.length === 0) {
    console.error(`Product SKU ${sku} not found in Bling API response`, searchJson);
    return;
  }

  const blingId = searchJson.data[0].id;
  console.log(`Bling Product ID: ${blingId}`);

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

  console.log(`Found ${rawImageUrls.length} fresh image URLs from Bling.`);

  if (rawImageUrls.length === 0) {
    console.warn(`No images found in Bling for SKU ${sku}`);
    return;
  }

  // 4. Download images and upload to Supabase Storage bucket 'produtos-fotos'
  const permanentUrls = [];
  for (let i = 0; i < rawImageUrls.length; i++) {
    const rawUrl = rawImageUrls[i];
    console.log(`Downloading image ${i + 1}/${rawImageUrls.length} from Bling S3...`);
    
    try {
      const imgRes = await fetch(rawUrl);
      if (!imgRes.ok) {
        console.error(`Failed to download image: ${imgRes.status} ${imgRes.statusText}`);
        continue;
      }

      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const ext = rawUrl.includes('.png') ? 'png' : 'jpg';
      const fileName = `${sku}_${Date.now()}_${i + 1}.${ext}`;
      const storagePath = `produtos/${sku}/${fileName}`;

      console.log(`Uploading to Supabase Storage: produtos-fotos/${storagePath} (${buffer.length} bytes)...`);
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('produtos-fotos')
        .upload(storagePath, buffer, {
          contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
          upsert: true
        });

      if (uploadErr) {
        console.error(`Storage upload error:`, uploadErr);
        continue;
      }

      const publicUrl = `https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/${storagePath}`;
      console.log(`✅ Uploaded successfully: ${publicUrl}`);
      permanentUrls.push(publicUrl);
    } catch (err) {
      console.error(`Error processing image ${rawUrl}:`, err);
    }
  }

  if (permanentUrls.length > 0) {
    console.log(`Updating DB for ${prod.id} with ${permanentUrls.length} permanent Supabase URLs...`);
    const { error: updateErr } = await supabase
      .from('produtos')
      .update({ imagens: permanentUrls })
      .eq('id', prod.id);

    if (updateErr) {
      console.error('DB update error:', updateErr);
    } else {
      console.log(`🎉 SUCCESS! MS2986CA fixed with permanent photos!`);
    }
  }
}

fixProduct('MS2986CA');
