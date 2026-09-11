import { supabase } from '../src/lib/supabase';

async function undoTematicos() {
  console.log("Desfazendo o agrupamento 'Temáticos' e restaurando categorias como Grupos Principais...");

  const thematicSlugs = [
    'dia-dos-pais',
    'dia-das-maes',
    'dia-das-criancas',
    'halloween',
    'carnaval',
    'pascoa',
    'natal',
    'ano-novo',
    'dia-dos-namorados',
    'outubro-rosa',
    'novembro-azul',
    'festa-junina'
  ];

  for (const slug of thematicSlugs) {
    const { data: cat } = await supabase
      .from('categorias')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (cat) {
      console.log(`Restaurando '${cat.nome}' (${slug}) para Grupo Principal (parent_id: null)...`);
      await supabase.from('categorias').update({ parent_id: null }).eq('id', cat.id);
    }
  }

  // Remove the 'Temáticos' parent category if it exists
  const { data: tematicos } = await supabase
    .from('categorias')
    .select('*')
    .eq('slug', 'tematicos')
    .maybeSingle();

  if (tematicos) {
    console.log("Removendo categoria 'Temáticos'...");
    await supabase.from('categorias').delete().eq('id', tematicos.id);
  }

  console.log("Agrupamento desfeito com sucesso! Todas as categorias temáticas voltaram a ser Grupos Principais.");
}

undoTematicos().catch(console.error);
