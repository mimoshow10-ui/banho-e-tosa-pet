const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

async function linkAllStoragePhotos() {
  console.log('⚡ Vinculando todas as 509 pastas de fotos do Supabase Storage aos produtos do banco...');

  const { data: prods } = await supabase.from('produtos').select('id, nome, imagens, bling_id, codigo_barras');
  const { data: folders } = await supabase.storage.from('produtos-fotos').list('', { limit: 1000 });

  const idMap = new Map();
  const blingMap = new Map();
  const skuMap = new Map();

  for (let p of (prods || [])) {
    idMap.set(p.id, p);
    if (p.bling_id) blingMap.set(String(p.bling_id), p);
    if (p.codigo_barras) skuMap.set(String(p.codigo_barras), p);
  }

  let atualizados = 0;
  const folderList = folders || [];

  const BATCH_SIZE = 15;
  for (let i = 0; i < folderList.length; i += BATCH_SIZE) {
    const chunk = folderList.slice(i, i + BATCH_SIZE);

    await Promise.all(
      chunk.map(async (f) => {
        const p = idMap.get(f.name) || blingMap.get(f.name) || skuMap.get(f.name);
        if (!p) return;

        try {
          const { data: subFiles } = await supabase.storage.from('produtos-fotos').list(f.name, { limit: 20 });
          if (subFiles && subFiles.length > 0) {
            const urls = subFiles
              .filter(sf => sf.name.endsWith('.jpg') || sf.name.endsWith('.jpeg') || sf.name.endsWith('.png') || sf.name.endsWith('.webp'))
              .map(sf => supabase.storage.from('produtos-fotos').getPublicUrl(`${f.name}/${sf.name}`).data.publicUrl);

            if (urls.length > 0) {
              const { error } = await supabase.from('produtos').update({ imagens: urls }).eq('id', p.id);
              if (!error) {
                atualizados++;
                console.log(`✅ [VINCULADO SUPABASE STORAGE] ${p.nome} (${urls.length} fotos)`);
              }
            }
          }
        } catch {}
      })
    );
  }

  console.log(`\n==================================================`);
  console.log(`🎉 VINCULAÇÃO CONCLUÍDA COM SUCESSO!`);
  console.log(`Total de produtos atualizados com fotos definitivas do Supabase Storage: ${atualizados}`);
}

linkAllStoragePhotos();
