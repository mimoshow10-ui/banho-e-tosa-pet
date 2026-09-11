import { supabase } from '../src/lib/supabase';

async function addEvaToPascoa() {
  console.log("Verificando/adicionando subgrupo 'Adesivo EVA' no grupo 'Páscoa'...");

  // 1. Find Páscoa category
  const { data: pascoaCat } = await supabase
    .from('categorias')
    .select('*')
    .eq('slug', 'pascoa')
    .maybeSingle();

  if (!pascoaCat) {
    console.error("Categoria 'Páscoa' não encontrada!");
    return;
  }

  console.log("Grupo Páscoa ID:", pascoaCat.id);

  // 2. Check existing subcategories under Páscoa
  const { data: existingSubs } = await supabase
    .from('categorias')
    .select('*')
    .eq('parent_id', pascoaCat.id);

  const evaSub = existingSubs?.find(s => s.nome.toLowerCase() === 'adesivo eva' || s.slug === 'pascoa-adesivo-eva');

  if (evaSub) {
    console.log("O subgrupo 'Adesivo EVA' já existe no grupo Páscoa:", evaSub);
  } else {
    console.log("Criando subgrupo 'Adesivo EVA' no grupo Páscoa...");
    const { data: inserted, error } = await supabase
      .from('categorias')
      .insert([{
        nome: 'Adesivo EVA',
        slug: 'pascoa-adesivo-eva',
        parent_id: pascoaCat.id
      }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar subgrupo:", error);
    } else {
      console.log("Subgrupo 'Adesivo EVA' criado com sucesso sob Páscoa!", inserted);
    }
  }

  // List all subcategories under Páscoa
  const { data: allSubs } = await supabase
    .from('categorias')
    .select('*')
    .eq('parent_id', pascoaCat.id)
    .order('nome');

  console.log("\nSubgrupos atuais de Páscoa:", allSubs?.map(s => s.nome));
}

addEvaToPascoa().catch(console.error);
