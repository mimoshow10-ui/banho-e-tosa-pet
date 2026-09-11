import { supabase } from '../src/lib/supabase';

async function checkGroups() {
  const { data: grupos, error: gErr } = await supabase.from('grupos').select('*');
  console.log("Grupos count:", grupos?.length, gErr);
  console.log("Grupos sample:", grupos?.slice(0, 20));

  const { data: subgrupos, error: sErr } = await supabase.from('subgrupos').select('*');
  console.log("Subgrupos count:", subgrupos?.length, sErr);
  console.log("Subgrupos sample:", subgrupos?.slice(0, 20));

  const { data: categorias, error: cErr } = await supabase.from('categorias').select('*');
  console.log("Categorias count:", categorias?.length, cErr);
  console.log("Categorias sample:", categorias);
}

checkGroups();
