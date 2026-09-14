const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncCategories() {
  console.log('--- 1. Criando e Sincronizando Categorias no Banco ---');

  // 1. Criar Categorias Principais (Pais): Infantil e Decoração
  const pais = [
    { nome: 'Infantil', slug: 'infantil', parent_id: null },
    { nome: 'Decoração', slug: 'decoracao', parent_id: null }
  ];

  for (const p of pais) {
    const { data: existing } = await supabase.from('categorias').select('id, slug').eq('slug', p.slug).maybeSingle();
    if (!existing) {
      const { data, error } = await supabase.from('categorias').insert(p).select().single();
      if (error) console.error(`Erro ao criar pai ${p.nome}:`, error.message);
      else console.log(`✓ Categoria Pai criada: ${p.nome} (id: ${data.id})`);
    } else {
      console.log(`• Categoria Pai já existe: ${p.nome} (id: ${existing.id})`);
    }
  }

  // Buscar os IDs dos pais
  const { data: catInfantil } = await supabase.from('categorias').select('id').eq('slug', 'infantil').single();
  const { data: catDecor } = await supabase.from('categorias').select('id').eq('slug', 'decoracao').single();

  // 2. Subcategorias Infantil
  const subInfantil = [
    { nome: 'Máscaras', slug: 'mascaras', parent_id: catInfantil?.id },
    { nome: 'Bolsas', slug: 'bolsas', parent_id: catInfantil?.id },
    { nome: 'Tiaras', slug: 'tiaras', parent_id: catInfantil?.id },
    { nome: 'Jogos', slug: 'jogos', parent_id: catInfantil?.id },
    { nome: 'Quebra-Cabeça', slug: 'quebra-cabeca', parent_id: catInfantil?.id },
    { nome: 'Didático', slug: 'didatico', parent_id: catInfantil?.id },
  ];

  for (const s of subInfantil) {
    const { data: existing } = await supabase.from('categorias').select('id, slug').eq('slug', s.slug).maybeSingle();
    if (!existing) {
      const { data, error } = await supabase.from('categorias').insert(s).select().single();
      if (error) console.error(`Erro ao criar sub ${s.nome}:`, error.message);
      else console.log(`✓ Subcategoria Infantil criada: ${s.nome} (id: ${data.id})`);
    } else {
      // Atualizar parent_id se necessário
      await supabase.from('categorias').update({ parent_id: catInfantil?.id, nome: s.nome }).eq('id', existing.id);
      console.log(`• Subcategoria Infantil atualizada: ${s.nome} (id: ${existing.id})`);
    }
  }

  // 3. Subcategorias Decoração
  const subDecor = [
    { nome: 'Quadros MDF', slug: 'quadros-mdf', parent_id: catDecor?.id },
    { nome: 'Quadros Impressos', slug: 'quadros-impressos', parent_id: catDecor?.id },
    { nome: 'Decor Ambientes', slug: 'decor-ambientes', parent_id: catDecor?.id },
    { nome: 'Faixas Decorativas', slug: 'faixas-decorativas', parent_id: catDecor?.id },
  ];

  for (const s of subDecor) {
    const { data: existing } = await supabase.from('categorias').select('id, slug').eq('slug', s.slug).maybeSingle();
    if (!existing) {
      const { data, error } = await supabase.from('categorias').insert(s).select().single();
      if (error) console.error(`Erro ao criar sub ${s.nome}:`, error.message);
      else console.log(`✓ Subcategoria Decoração criada: ${s.nome} (id: ${data.id})`);
    } else {
      await supabase.from('categorias').update({ parent_id: catDecor?.id, nome: s.nome }).eq('id', existing.id);
      console.log(`• Subcategoria Decoração atualizada: ${s.nome} (id: ${existing.id})`);
    }
  }

  console.log('\n--- 2. Verificando Conexão com Bling ---');
  const { data: cfgToken } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfgToken?.valor?.access_token;
  console.log(`Token Bling presente: ${!!token}`);

  if (token) {
    console.log('Buscando produtos no Bling por palavras-chave...');
    const searchTerms = ['mascara', 'bolsa', 'tiara', 'jogo', 'quebra', 'didatico', 'quadro', 'decor', 'faixa'];
    for (const term of searchTerms) {
      try {
        const res = await fetch(`https://api.bling.com.br/Api/v3/produtos?nome=${encodeURIComponent(term)}&limite=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const d = await res.json();
        console.log(`Busca no Bling por "${term}": ${d?.data?.length || 0} produtos retornados.`);
      } catch (e) {
        console.log(`Erro ao buscar "${term}" no Bling:`, e.message);
      }
    }
  }
}

syncCategories().catch(console.error);
