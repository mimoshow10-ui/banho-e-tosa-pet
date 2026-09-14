const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

async function auditCollisions() {
  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, bling_id, codigo_barras, nome, imagens, parent_id')
    .order('criado_em', { ascending: false });

  const imageToProducts = new Map();

  for (const p of produtos) {
    if (Array.isArray(p.imagens) && p.imagens.length > 0) {
      const mainImg = p.imagens[0];
      if (!imageToProducts.has(mainImg)) {
        imageToProducts.set(mainImg, []);
      }
      imageToProducts.get(mainImg).push(p);
    }
  }

  console.log(`Total unique main images: ${imageToProducts.size}`);
  let collisionCount = 0;

  for (const [img, list] of imageToProducts.entries()) {
    if (list.length > 1) {
      collisionCount++;
      console.log(`\n--- COLLISION #${collisionCount} ---`);
      console.log(`Image URL: ${img.slice(0, 80)}...`);
      for (const item of list) {
        console.log(`  - ID: ${item.id} | BlingID: ${item.bling_id} | SKU: ${item.codigo_barras} | ParentID: ${item.parent_id} | Name: ${item.nome}`);
      }
    }
  }
}

auditCollisions();
