import { supabase } from '../src/lib/supabase';

async function main() {
  const { data: categorias } = await supabase.from('categorias').select('*');
  
  const grupoAdesivos = (categorias || []).find(c => !c.parent_id && c.nome.toLowerCase().includes('adesivo'));
  if (!grupoAdesivos) {
    console.error('Grupo Adesivos não encontrado!');
    return;
  }

  console.log(`Grupo encontrado: "${grupoAdesivos.nome}" (id: ${grupoAdesivos.id})`);

  const subs = (categorias || []).filter(c => c.parent_id === grupoAdesivos.id);
  const subImpressoSemEva = subs.find(s => s.nome.toLowerCase().includes('impresso sem eva'));

  if (!subImpressoSemEva) {
    const { data: inserted, error } = await supabase
      .from('categorias')
      .insert([{
        nome: 'Impresso sem EVA',
        slug: `${grupoAdesivos.slug}-impresso-sem-eva`,
        parent_id: grupoAdesivos.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar subgrupo Impresso sem EVA:', error);
    } else {
      console.log(`[SUBGRUPO CRIADO] Subgrupo "Impresso sem EVA" adicionado com sucesso ao grupo "${grupoAdesivos.nome}"!`, inserted);
    }
  } else {
    console.log(`Subgrupo "Impresso sem EVA" já existe no grupo "${grupoAdesivos.nome}".`);
  }
}

main();
