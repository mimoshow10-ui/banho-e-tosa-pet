const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

async function restoreStoragePhotos() {
  console.log('🔍 Iniciando mapeamento e restauração de fotos salvas no Supabase Storage...');

  const { data: prods } = await supabase.from('produtos').select('id, nome, imagens, bling_id');
  const { data: folders } = await supabase.storage.from('produtos-fotos').list('', { limit: 1000 });

  console.log(`📂 Encontradas ${folders?.length || 0} pastas salvas no Supabase Storage.`);

  const prodMap = new Map();
  for (let p of (prods || [])) {
    prodMap.set(p.id, p);
    if (p.bling_id) prodMap.set(String(p.bling_id), p);
  }

  let restaurados = 0;
  const BATCH = 20;
  const folderList = folders || [];

  for (let i = 0; i < folderList.length; i += BATCH) {
    const chunk = folderList.slice(i, i + BATCH);

    await Promise.all(
      chunk.map(async (f) => {
        const p = prodMap.get(f.name);
        if (!p) return;

        try {
          const { data: subFiles } = await supabase.storage.from('produtos-fotos').list(f.name, { limit: 10 });
          if (subFiles && subFiles.length > 0) {
            const urls = subFiles
              .filter(sf => sf.name.endsWith('.jpg') || sf.name.endsWith('.png') || sf.name.endsWith('.webp'))
              .map(sf => supabase.storage.from('produtos-fotos').getPublicUrl(`${f.name}/${sf.name}`).data.publicUrl);

            if (urls.length > 0) {
              const firstCurrent = p.imagens?.[0] || '';
              if (!firstCurrent.includes('supabase.co')) {
                await supabase.from('produtos').update({ imagens: urls }).eq('id', p.id);
                restaurados++;
                console.log(`✨ [FOTO RESTAURADA] ${p.nome} (${urls.length} fotos)`);
              }
            }
          }
        } catch {}
      })
    );
  }

  console.log(`\n🎉 RESTAURAÇÃO CONCLUÍDA! ${restaurados} produtos tiveram suas fotos do Supabase Storage vinculadas ao banco.`);
}

restoreStoragePhotos();
