import { supabase } from '../src/lib/supabase';

async function setupTematicos() {
  console.log("Configurando o grupo principal 'Temáticos' no banco de dados...");

  // 1. Check or insert 'Temáticos'
  let { data: tematicos } = await supabase
    .from('categorias')
    .select('*')
    .eq('slug', 'tematicos')
    .maybeSingle();

  if (!tematicos) {
    const { data: newTem, error: insertErr } = await supabase
      .from('categorias')
      .insert([{
        nome: 'Temáticos',
        slug: 'tematicos',
        parent_id: null
      }])
      .select()
      .single();

    if (insertErr) {
      console.error("Erro ao criar categoria Temáticos:", insertErr);
      return;
    }
    tematicos = newTem;
  } else {
    // Ensure name is 'Temáticos' and parent_id is null
    await supabase.from('categorias').update({ nome: 'Temáticos', parent_id: null }).eq('id', tematicos.id);
  }

  console.log("Categoria 'Temáticos' configurada. ID:", tematicos.id);

  // List of seasonal/thematic categories to move under 'Temáticos'
  const thematicSlugs = [
    { slug: 'dia-dos-pais', nome: 'Dia dos Pais' },
    { slug: 'dia-das-maes', nome: 'Dia das Mães' },
    { slug: 'dia-das-criancas', nome: 'Dia das Crianças' },
    { slug: 'halloween', nome: 'Halloween' },
    { slug: 'carnaval', nome: 'Carnaval' },
    { slug: 'pascoa', nome: 'Páscoa' },
    { slug: 'natal', nome: 'Natal' },
    { slug: 'ano-novo', nome: 'Ano Novo' },
    { slug: 'dia-dos-namorados', nome: 'Dia dos Namorados' },
    { slug: 'outubro-rosa', nome: 'Outubro Rosa' },
    { slug: 'novembro-azul', nome: 'Novembro Azul' },
    { slug: 'festa-junina', nome: 'Festa Junina' }
  ];

  for (const t of thematicSlugs) {
    const { data: existingCat } = await supabase
      .from('categorias')
      .select('*')
      .eq('slug', t.slug)
      .maybeSingle();

    if (existingCat) {
      console.log(`Atualizando parent_id de '${existingCat.nome}' (${t.slug}) para Temáticos...`);
      await supabase.from('categorias').update({
        nome: t.nome,
        parent_id: tematicos.id
      }).eq('id', existingCat.id);
    } else {
      console.log(`Criando categoria temática '${t.nome}' (${t.slug}) sob Temáticos...`);
      await supabase.from('categorias').insert([{
        nome: t.nome,
        slug: t.slug,
        parent_id: tematicos.id
      }]);
    }
  }

  console.log("Configuração do grupo Temáticos concluída com sucesso!");
}

setupTematicos().catch(console.error);
