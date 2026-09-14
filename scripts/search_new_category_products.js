const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function searchKeywords() {
  const terms = [
    'mascara', 'máscara', 'bolsa', 'tiara', 'jogo', 'quebra', 'didatico', 'didático',
    'quadro', 'mdf', 'ambiente', 'faixa', 'decor'
  ];

  console.log('Buscando produtos por palavras-chave nos 2190 produtos...');

  // Puxar todos os produtos
  let allProducts = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase.from('produtos').select('id, nome, sku, categoria_id, descricao').range(from, from + step - 1);
    if (error || !data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    if (data.length < step) break;
    from += step;
  }

  console.log(`Carregados ${allProducts.length} produtos do Supabase.`);

  const matchGroups = {
    'mascaras': [],
    'bolsas': [],
    'tiaras': [],
    'jogos': [],
    'quebra-cabeca': [],
    'didatico': [],
    'quadros-mdf': [],
    'quadros-impressos': [],
    'decor-ambientes': [],
    'faixas-decorativas': [],
  };

  allProducts.forEach(p => {
    const text = `${p.nome} ${p.descricao || ''}`.toLowerCase();
    if (text.includes('mascara') || text.includes('máscara')) matchGroups['mascaras'].push(p);
    if (text.includes('bolsa')) matchGroups['bolsas'].push(p);
    if (text.includes('tiara')) matchGroups['tiaras'].push(p);
    if (text.includes('jogo') && !text.includes('jogo de')) matchGroups['jogos'].push(p);
    if (text.includes('quebra') || text.includes('cabeça') || text.includes('cabeca')) matchGroups['quebra-cabeca'].push(p);
    if (text.includes('didatico') || text.includes('didático') || text.includes('educativo')) matchGroups['didatico'].push(p);
    if ((text.includes('quadro') && text.includes('mdf')) || (text.includes('mdf') && text.includes('decor'))) matchGroups['quadros-mdf'].push(p);
    if (text.includes('quadro') && (text.includes('impresso') || text.includes('impressao') || text.includes('arte'))) matchGroups['quadros-impressos'].push(p);
    if (text.includes('ambiente') || text.includes('decoracao') || text.includes('decoração') || text.includes('enfeite')) matchGroups['decor-ambientes'].push(p);
    if (text.includes('faixa') && (text.includes('decor') || text.includes('parede'))) matchGroups['faixas-decorativas'].push(p);
  });

  console.log('\n--- Resultados Encontrados no Banco ---');
  for (const [key, list] of Object.entries(matchGroups)) {
    console.log(`[${key}]: ${list.length} produtos encontrados`);
    if (list.length > 0) {
      list.slice(0, 3).forEach(item => console.log(`   -> (${item.sku}) ${item.nome}`));
    }
  }
}

searchKeywords().catch(console.error);
