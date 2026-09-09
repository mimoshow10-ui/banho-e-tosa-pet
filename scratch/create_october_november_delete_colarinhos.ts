import { supabase } from '../src/lib/supabase';

function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/ /g, '-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '');
}

async function main() {
  // 1. Fetch current categories
  const { data: categorias, error } = await supabase.from('categorias').select('*');
  if (error || !categorias) {
    console.error('Erro ao buscar categorias:', error);
    return;
  }

  // Find Halloween group
  const halloween = categorias.find(c => !c.parent_id && c.nome.toLowerCase().includes('halloween'));
  if (!halloween) {
    console.error('Grupo Halloween não encontrado!');
    return;
  }

  // Get Halloween subgroups
  const halloweenSubs = categorias.filter(c => c.parent_id === halloween.id);
  console.log(`Subgrupos do Halloween (${halloweenSubs.length}):`, halloweenSubs.map(s => s.nome));

  // 2. Create or find "Outubro Rosa" and "Novembro Azul" groups
  const newGroups = ['Outubro Rosa', 'Novembro Azul'];
  for (const groupName of newGroups) {
    let group = categorias.find(c => !c.parent_id && c.nome.toLowerCase() === groupName.toLowerCase());
    if (!group) {
      const gSlug = generateSlug(groupName);
      const { data: insertedGroup, error: insertErr } = await supabase
        .from('categorias')
        .insert([{ nome: groupName, slug: gSlug, parent_id: null }])
        .select()
        .single();

      if (insertErr) {
        console.error(`Erro ao criar grupo ${groupName}:`, insertErr);
        continue;
      }
      group = insertedGroup;
      console.log(`[GRUPO CRIADO] "${group.nome}" (id: ${group.id})`);
    } else {
      console.log(`[GRUPO JÁ EXISTE] "${group.nome}" (id: ${group.id})`);
    }

    // Add sub-groups copied from Halloween
    const toInsertSub: any[] = [];
    for (const sub of halloweenSubs) {
      const subSlug = `${group.slug}-${generateSlug(sub.nome)}`;
      // Check if sub-group already exists under this group
      const existingSub = categorias.find(c => c.parent_id === group.id && c.nome.toLowerCase() === sub.nome.toLowerCase());
      if (!existingSub) {
        toInsertSub.push({
          nome: sub.nome,
          slug: subSlug,
          parent_id: group.id
        });
      }
    }

    if (toInsertSub.length > 0) {
      const { data: insertedSubs, error: subErr } = await supabase
        .from('categorias')
        .insert(toInsertSub)
        .select();

      if (subErr) {
        console.error(`Erro ao criar subgrupos de ${groupName}:`, subErr);
      } else {
        console.log(`[SUBGRUPOS CRIADOS] ${insertedSubs?.length} subgrupos inseridos em "${groupName}".`);
      }
    } else {
      console.log(`Todos os subgrupos de "${groupName}" já existem.`);
    }
  }

  // 3. Delete main group "Colarinhos" / "Colarinho"
  const grupoColarinhos = categorias.find(c => !c.parent_id && (c.nome.toLowerCase() === 'colarinhos' || c.nome.toLowerCase() === 'colarinho'));
  if (grupoColarinhos) {
    console.log(`Excluindo grupo principal "${grupoColarinhos.nome}" (id: ${grupoColarinhos.id})...`);
    
    // First, delete sub-groups linked to this main group
    const subColarinhos = categorias.filter(c => c.parent_id === grupoColarinhos.id);
    if (subColarinhos.length > 0) {
      const subIds = subColarinhos.map(s => s.id);
      await supabase.from('categorias').delete().in('id', subIds);
      console.log(`Removidos ${subColarinhos.length} subgrupos do grupo "${grupoColarinhos.nome}".`);
    }

    // Unlink any products that had this group_id or subgrupo_id
    await supabase.from('produtos').update({ grupo_id: null }).eq('grupo_id', grupoColarinhos.id);

    // Delete the group
    const { error: delErr } = await supabase.from('categorias').delete().eq('id', grupoColarinhos.id);
    if (delErr) {
      console.error('Erro ao deletar grupo Colarinhos:', delErr);
    } else {
      console.log(`[GRUPO REMOVIDO] Grupo principal "${grupoColarinhos.nome}" excluído com sucesso.`);
    }
  } else {
    console.log('Nenhum grupo principal chamado "Colarinhos" foi encontrado para exclusão.');
  }
}

main();
