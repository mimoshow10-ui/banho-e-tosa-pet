const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('⚡ HIGH-SPEED PARALLEL BLING PHOTO SYNC STARTING ⚡');

  const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;
  if (!token) return console.error('No Bling Token!');

  let dbProducts = [];
  let page = 0;
  while (true) {
    const { data } = await supabase.from('produtos').select('id, codigo_barras, nome, imagens').range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    dbProducts.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  const skuMap = new Map();
  dbProducts.forEach(p => {
    if (p.codigo_barras) skuMap.set(p.codigo_barras.trim().toLowerCase(), p);
  });

  let totalUpdated = 0;

  for (let blingPage = 1; blingPage <= 50; blingPage++) {
    console.log(`\n🚀 Fetching Bling Page ${blingPage}...`);
    try {
      const res = await fetch(`https://api.bling.com.br/Api/v3/produtos?limite=100&pagina=${blingPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.data || json.data.length === 0) {
        console.log(`🏁 All Bling pages processed at page ${blingPage}!`);
        break;
      }

      // Process 10 items concurrently
      const items = json.data;
      const concurrency = 10;
      for (let i = 0; i < items.length; i += concurrency) {
        const chunk = items.slice(i, i + concurrency);
        await Promise.all(chunk.map(async (item) => {
          const sku = (item.codigo || '').trim();
          if (!sku) return;
          const dbProd = skuMap.get(sku.toLowerCase());
          if (!dbProd) return;

          // If already has permanent Supabase photos, skip
          if (dbProd.imagens && dbProd.imagens.length > 0 && dbProd.imagens.every(url => typeof url === 'string' && url.includes('supabase.co'))) {
            return;
          }

          try {
            const detailRes = await fetch(`https://api.bling.com.br/Api/v3/produtos/${item.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const detailJson = await detailRes.json();
            const blingData = detailJson.data;

            let rawUrls = [];
            if (blingData?.midia?.imagens?.externas?.length) rawUrls.push(...blingData.midia.imagens.externas.map(m => m.link));
            if (blingData?.midia?.imagens?.internas?.length) rawUrls.push(...blingData.midia.imagens.internas.map(m => m.link));
            if (blingData?.midia?.imagens?.anexos?.length) rawUrls.push(...blingData.midia.imagens.anexos.map(m => m.link));

            if (rawUrls.length === 0) {
              await supabase.from('produtos').update({ imagens: null }).eq('id', dbProd.id);
              return;
            }

            const permanentUrls = [];
            const safeFolder = sku.replace(/[^a-zA-Z0-9_-]/g, '_');

            await Promise.all(rawUrls.map(async (rawUrl, imgIdx) => {
              try {
                const imgRes = await fetch(rawUrl);
                if (!imgRes.ok) return;

                const buffer = Buffer.from(await imgRes.arrayBuffer());
                if (buffer.length < 500) return;

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
            }));

            if (permanentUrls.length > 0) {
              await supabase.from('produtos').update({ imagens: permanentUrls }).eq('id', dbProd.id);
              totalUpdated++;
              console.log(`  ⚡ [SKU: ${sku}] Updated ${permanentUrls.length} permanent photos! (Total updated: ${totalUpdated})`);
            } else {
              await supabase.from('produtos').update({ imagens: null }).eq('id', dbProd.id);
            }
          } catch (e) {}
        }));

        await new Promise(r => setTimeout(r, 250));
      }
    } catch (e) {
      console.error(`Page ${blingPage} error:`, e.message);
    }
  }

  console.log(`\n🎉 HIGH-SPEED SYNC COMPLETE! Total ${totalUpdated} products updated.`);
}

main();
