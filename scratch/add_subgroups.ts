import { supabase } from '../src/lib/supabase';

async function main() {
  const { data: categorias, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nome');

  if (error) {
    console.error('Error fetching categorias:', error);
    return;
  }

  const grupos = categorias.filter((c: any) => !c.parent_id);
  console.log(`Encontrados ${grupos.length} grupos principais.`);

  const toInsert: any[] = [];

  for (const grupo of grupos) {
    const parentId = grupo.id;
    const parentSlug = grupo.slug;

    // Check if subgroup 'Kits' already exists for this group
    const subKits = categorias.find(
      (c: any) => c.parent_id === parentId && c.nome.toLowerCase() === 'kits'
    );

    if (!subKits) {
      toInsert.push({
        nome: 'Kits',
        slug: `${parentSlug}-kits`,
        parent_id: parentId,
      });
      console.log(`[NOVO SUBGRUPO] Adicionando "Kits" para o Grupo "${grupo.nome}"`);
    }

    // Specially check for 'Halloween' group -> add 'Colarinho'
    if (grupo.nome.toLowerCase().includes('halloween')) {
      const subColarinho = categorias.find(
        (c: any) => c.parent_id === parentId && c.nome.toLowerCase() === 'colarinho'
      );

      if (!subColarinho) {
        toInsert.push({
          nome: 'Colarinho',
          slug: `${parentSlug}-colarinho`,
          parent_id: parentId,
        });
        console.log(`[NOVO SUBGRUPO] Adicionando "Colarinho" para o Grupo "${grupo.nome}"`);
      }
    }
  }

  if (toInsert.length > 0) {
    console.log(`Inserindo ${toInsert.length} novos subgrupos no Supabase...`);
    const { data: inserted, error: insertErr } = await supabase
      .from('categorias')
      .insert(toInsert)
      .select();

    if (insertErr) {
      console.error('Erro ao inserir subgrupos:', insertErr);
    } else {
      console.log('Subgrupos inseridos com sucesso:', inserted?.map((i: any) => `${i.nome} (${i.slug})`));
    }
  } else {
    console.log('Nenhum novo subgrupo precisou ser criado (todos já existiam).');
  }
}

main();
