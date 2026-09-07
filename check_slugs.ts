import { supabase } from './src/lib/supabase';

async function main() {
  console.log('--- TESTANDO INSERÇÃO DO SUBGRUPO "Pérolas Pingente" ---');

  // Buscar o grupo Gargantilhas / Gargantilhas Pet
  const { data: catData } = await supabase.from('categorias').select('*');
  console.log('Total de categorias no banco:', catData?.length);

  const gargantilhaGroup = (catData || []).find(
    c => c.nome.toLowerCase().includes('gargantilha') && c.parent_id === null
  );

  console.log('Grupo pai encontrado:', gargantilhaGroup);

  if (!gargantilhaGroup) {
    console.error('Grupo "Gargantilhas" não encontrado!');
    return;
  }

  const nome = 'Pérolas Pingente';
  const rawSlug = nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, '');
  console.log('Raw slug gerado:', rawSlug);

  // Tentar inserir e capturar erro real do Supabase
  const { data, error } = await supabase.from('categorias').insert([{
    nome,
    slug: `${gargantilhaGroup.slug}-${rawSlug}`,
    parent_id: gargantilhaGroup.id
  }]).select();

  if (error) {
    console.error('x ERRO AO INSERIR NO SUPABASE:', error);
  } else {
    console.log('✓ INSERIDO COM SUCESSO! Data:', data);
  }
}

main();
