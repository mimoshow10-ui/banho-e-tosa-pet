const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

// Subgrupos a criar dentro de cada grupo principal
const subgrupos = [
  { nome: 'Adesivo Impresso', slug: 'adesivo-impresso', keywords: ['adesivo impresso', 'adesivos impressos', 'sublimado', 'sublimada', 'sticker impresso'] },
  { nome: 'Adesivo EVA', slug: 'adesivo-eva', keywords: ['adesivo eva', 'adesivos eva', 'eva adesivo'] },
  { nome: 'Adesivo Olografico', slug: 'adesivo-olografico', keywords: ['olografico', 'olográfico', 'holografico', 'holográfico', 'olográfric', 'olografic', 'hologr'] },
  { nome: 'Bandana', slug: 'bandana', keywords: ['bandana', 'bandanas'] },
  { nome: 'Cartela Sticker', slug: 'cartela-sticker', keywords: ['cartela sticker', 'cartela adesivo', 'sticker', 'cartela tic tac', 'tic tac', 'cartela'] },
  { nome: 'Cartela Adesivo Olografico', slug: 'cartela-adesivo-olografico', keywords: ['cartela olografico', 'cartela olográfico', 'cartela hologr'] },
  { nome: 'Gravata', slug: 'gravata', keywords: ['gravata', 'gravatinha', 'gravatinhas', 'gravatas'] },
  { nome: 'Gargantilha', slug: 'gargantilha', keywords: ['gargantilha', 'gargantilhas', 'medalhão', 'medalhao', 'medalha'] },
  { nome: 'Colarinho', slug: 'colarinho', keywords: ['colarinho', 'colarinhos', 'colar pet'] },
  { nome: 'Lacinho', slug: 'lacinho', keywords: ['lacinho', 'lacinhos', 'laco', 'laço', 'laços', 'lacos'] }
];

async function criarSubgrupos() {
  // Buscar todos os grupos principais
  const { data: grupos } = await supabase.from('categorias').select('*').is('parent_id', null);
  console.log('Grupos principais encontrados: ' + grupos.length);

  // Buscar todos os produtos
  const { data: todosProdutos } = await supabase.from('produtos').select('id, nome, categoria_id');
  console.log('Total produtos: ' + todosProdutos.length);

  let totalSubsCriadas = 0;
  let totalVinculos = 0;

  for (const grupo of grupos) {
    console.log('\n📂 Processando grupo: ' + grupo.nome + ' (' + grupo.slug + ')');

    // Pegar os produtos deste grupo
    const prodsDoGrupo = todosProdutos.filter(p => p.categoria_id === grupo.id);
    console.log('   Produtos neste grupo: ' + prodsDoGrupo.length);

    if (prodsDoGrupo.length === 0) continue;

    for (const sub of subgrupos) {
      const subSlug = grupo.slug + '-' + sub.slug;

      // Encontrar produtos deste grupo que correspondem ao subgrupo
      const prodsDoSub = prodsDoGrupo.filter(p => {
        const lower = (p.nome || '').toLowerCase();
        return sub.keywords.some(kw => lower.includes(kw));
      });

      if (prodsDoSub.length === 0) continue;

      // Verificar se o subgrupo já existe
      const { data: subExistente } = await supabase
        .from('categorias').select('*').eq('slug', subSlug).maybeSingle();

      let subId = subExistente ? subExistente.id : null;

      if (!subExistente) {
        const { data: novoSub, error } = await supabase.from('categorias').insert({
          nome: sub.nome,
          slug: subSlug,
          parent_id: grupo.id
        }).select().single();

        if (error) {
          console.error('   ❌ Erro ao criar subgrupo ' + sub.nome + ': ' + error.message);
          continue;
        }
        subId = novoSub.id;
        totalSubsCriadas++;
      }

      // Vincular produtos ao subgrupo
      const ids = prodsDoSub.map(p => p.id);
      const { error: updErr } = await supabase
        .from('produtos').update({ categoria_id: subId }).in('id', ids);

      if (!updErr) {
        totalVinculos += ids.length;
        console.log('   ✅ [' + sub.nome + ']: ' + ids.length + ' produtos');
      }
    }
  }

  // Resultado final
  const { data: catsFinais } = await supabase.from('categorias').select('id, nome, slug, parent_id').order('criado_em');
  const gruposFinais = catsFinais.filter(c => !c.parent_id);
  const subFinais = catsFinais.filter(c => c.parent_id);

  console.log('\n=================================================');
  console.log('🎉 CONCLUÍDO! ' + totalSubsCriadas + ' subgrupos criados, ' + totalVinculos + ' produtos organizados.');
  console.log('📊 Total grupos principais: ' + gruposFinais.length);
  console.log('📊 Total subgrupos criados: ' + subFinais.length);
  console.log('=================================================');
}

criarSubgrupos();
