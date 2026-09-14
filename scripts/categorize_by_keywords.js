const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function categorizeProducts() {
  console.log('--- Buscando categorias no Supabase ---');
  const { data: categorias } = await supabase.from('categorias').select('id, nome, slug');
  const catMap = {};
  categorias.forEach(c => {
    catMap[c.slug] = c.id;
  });

  console.log('\n--- Buscando todos os produtos do Supabase ---');
  let allProducts = [];
  let page = 0;
  const pageSize = 500;
  
  while (true) {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, categoria_id, descricao')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Erro ao buscar página:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  console.log(`Total de produtos carregados: ${allProducts.length}`);

  const updates = [];

  for (const prod of allProducts) {
    const nameLower = (prod.nome || '').toLowerCase();
    const descLower = (prod.descricao || '').toLowerCase();
    const fullText = `${nameLower} ${descLower}`;

    let targetSlug = null;

    if (fullText.includes('máscara') || fullText.includes('mascara')) {
      targetSlug = 'mascaras';
    } else if (fullText.includes('quebra-cabeça') || fullText.includes('quebra cabeça') || fullText.includes('quebra cabeca') || fullText.includes('quebracabeca') || (fullText.includes('quebra') && fullText.includes('cabe'))) {
      targetSlug = 'quebra-cabeca';
    } else if (fullText.includes('jogo') || fullText.includes('jogos')) {
      targetSlug = 'jogos';
    } else if (fullText.includes('tiara') || fullText.includes('tiaras')) {
      targetSlug = 'tiaras';
    } else if (fullText.includes('bolsa') || fullText.includes('bolsas')) {
      targetSlug = 'bolsas';
    } else if (fullText.includes('didático') || fullText.includes('didatico') || fullText.includes('educativo')) {
      targetSlug = 'didatico';
    } else if (fullText.includes('quadro') && fullText.includes('mdf')) {
      targetSlug = 'quadros-mdf';
    } else if (fullText.includes('quadro')) {
      targetSlug = 'quadros-impressos';
    } else if (fullText.includes('faixa decorativa') || fullText.includes('faixas decorativas')) {
      targetSlug = 'faixas-decorativas';
    }

    if (targetSlug && catMap[targetSlug]) {
      updates.push({
        id: prod.id,
        nome: prod.nome,
        targetSlug,
        targetCatId: catMap[targetSlug],
        currentCatId: prod.categoria_id
      });
    }
  }

  console.log(`\nProdutos identificados para categorização: ${updates.length}`);
  
  const grouped = {};
  updates.forEach(u => {
    grouped[u.targetSlug] = grouped[u.targetSlug] || [];
    grouped[u.targetSlug].push(u);
  });

  for (const [slug, list] of Object.entries(grouped)) {
    console.log(`\n▶ [${slug.toUpperCase()}] (${list.length} produtos):`);
    list.slice(0, 5).forEach(item => console.log(`   - ${item.nome}`));
  }

  // Executar updates no banco
  if (updates.length > 0) {
    console.log('\n--- Atualizando categoria_id no Supabase ---');
    let successCount = 0;
    for (const u of updates) {
      const { error: upErr } = await supabase
        .from('produtos')
        .update({ categoria_id: u.targetCatId })
        .eq('id', u.id);

      if (upErr) {
        console.error(`Erro ao atualizar produto ${u.id}:`, upErr.message);
      } else {
        successCount++;
      }
    }
    console.log(`\n✓ Concluído: ${successCount} produtos vinculados com sucesso às novas categorias!`);
  } else {
    console.log('\nNenhum produto cadastrado atualmente contém as palavras mascara, jogo, quebra-cabeça, etc.');
  }
}

categorizeProducts().catch(console.error);
