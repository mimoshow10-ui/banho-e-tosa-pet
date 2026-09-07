const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Inspecting Root Folders in bucket produtos-fotos ---');
  const { data: rootItems } = await supabase.storage.from('produtos-fotos').list('', { limit: 5000 });
  const folders = (rootItems || []).filter(item => !item.id); // folders have no id in list output
  console.log(`Found ${folders.length} root folders in produtos-fotos.`);

  const { data: allProds } = await supabase.from('produtos').select('id, codigo_barras, nome, imagens');
  const skuMap = new Map();
  allProds.forEach(p => {
    if (p.codigo_barras) {
      skuMap.set(p.codigo_barras.trim().toLowerCase(), p);
    }
  });

  let linkedCount = 0;

  for (let f of folders) {
    const folderName = f.name;
    const folderLower = folderName.trim().toLowerCase();

    if (skuMap.has(folderLower)) {
      const prod = skuMap.get(folderLower);
      
      // List files inside this folder
      const { data: files } = await supabase.storage.from('produtos-fotos').list(folderName, { limit: 100 });
      if (files && files.length > 0) {
        const validFiles = files.filter(file => file.name !== '.emptyFolderPlaceholder' && !file.name.startsWith('.'));
        if (validFiles.length > 0) {
          const publicUrls = validFiles.map(file => 
            `https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/${folderName}/${encodeURIComponent(file.name)}`
          );

          // Check if prod needs image update
          if (!prod.imagens || prod.imagens.length === 0 || prod.imagens.some(i => typeof i === 'string' && i.includes('amazonaws.com'))) {
            await supabase.from('produtos').update({ imagens: publicUrls }).eq('id', prod.id);
            console.log(`✅ Linked existing storage folder [${folderName}] (${validFiles.length} photos) to product ${prod.nome}`);
            linkedCount++;
          }
        }
      }
    }
  }

  console.log(`\n🎉 Linked ${linkedCount} existing storage folders directly to DB products!`);
}

main();
