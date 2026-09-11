import { supabase } from '../src/lib/supabase';

async function testFilter() {
  console.log("=== Testando abordagens de filtro por quantidade de fotos ===");

  // Attempt 1: Using PostgREST arrow syntax or containment if possible
  // Let's test querying all products and checking how fast JS filtering vs query works
  const { data: prods } = await supabase
    .from('produtos')
    .select('id, nome, imagens')
    .not('imagens', 'is', null);

  const countMap: Record<number, number> = {};
  prods?.forEach(p => {
    const len = Array.isArray(p.imagens) ? p.imagens.length : 0;
    countMap[len] = (countMap[len] || 0) + 1;
  });

  console.log("Distribuição de quantidade de fotos nos produtos:", countMap);

  // Attempt 2: Can we filter by jsonb array length using filter or rpc?
  // Let's test if filter('imagens->1', 'is', 'null') works for exactly 1 photo (has index 0, but no index 1)
  const { data: onePhoto, error: err1 } = await supabase
    .from('produtos')
    .select('id, nome, imagens')
    .not('imagens->0', 'is', null)
    .is('imagens->1', null);

  console.log("Produtos com exatamente 1 foto (imagens->0 not null AND imagens->1 is null):", onePhoto?.length, err1);

  // Let's test for N photos:
  // Exactly N photos:
  // imagens->(N-1) IS NOT NULL AND imagens->N IS NULL!
  // Example for 3 photos: imagens->2 is not null AND imagens->3 is null!
  // Example for 5 photos: imagens->4 is not null AND imagens->5 is null!
  // Example for 10 photos: imagens->9 is not null AND (imagens->10 is null OR N>=10)!
  
  for (let n = 1; n <= 10; n++) {
    let q = supabase.from('produtos').select('id, nome, imagens');
    if (n === 1) {
      q = q.not('imagens->0', 'is', null).is('imagens->1', null);
    } else {
      q = q.not(`imagens->${n - 1}`, 'is', null).is(`imagens->${n}`, null);
    }
    const { data: result, error } = await q;
    console.log(`Produtos com exatamente ${n} foto(s):`, result?.length, error ? error.message : '');
  }
}

testFilter();
