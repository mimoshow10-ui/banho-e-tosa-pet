import { supabase } from '../src/lib/supabase';

async function addEvaToPais() {
  console.log("Verificando/adicionando subgrupo 'Adesivo EVA' no grupo 'Dia dos Pais'...");

  // 1. Find Dia dos Pais category
  const { data: paisCat } = await supabase
    .from('categorias')
    .select('*')
    .eq('slug', 'dia-dos-pais')
    .maybeSingle();

  if (!paisCat) {
    console.error("Categoria 'Dia dos Pais' não encontrada!");
    return;
  }

  console.log("Grupo Dia dos Pais ID:", paisCat.id);

  // 2. Check existing subcategories under Dia dos Pais
  const { data: existingSubs } = await supabase
    .from('categorias')
    .select('*')
    .eq('parent_id', paisCat.id);

  const evaSub = existingSubs?.find(s => s.nome.toLowerCase() === 'adesivo eva' || s.slug === 'dia-dos-pais-adesivo-eva');

  if (evaSub) {
    console.log("O subgrupo 'Adesivo EVA' já existe no grupo Dia dos Pais:", evaSub);
  } else {
    console.log("Criando subgrupo 'Adesivo EVA' no grupo Dia dos Pais...");
    const { data: inserted, error } = await supabase
      .from('categorias')
      .insert([{
        nome: 'Adesivo EVA',
        slug: 'dia-dos-pais-adesivo-eva',
        parent_id: paisCat.id
      }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar subgrupo:", error);
    } else {
      console.log("Subgrupo 'Adesivo EVA' criado com sucesso sob Dia dos Pais!", inserted);
    }
  }

  // List all subcategories under Dia dos Pais
  const { data: allSubs } = await supabase
    .from('categorias')
    .select('*')
    .eq('parent_id', paisCat.id)
    .order('nome');

  console.log("\nSubgrupos atuais de Dia dos Pais:", allSubs?.map(s => s.nome));
}

addEvaToPais().catch(console.error);
