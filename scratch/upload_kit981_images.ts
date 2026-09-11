import { supabase } from '../src/lib/supabase';
import { uploadBlingImagesToSupabase } from '../src/lib/upload-images';

async function uploadKit981Images() {
  const { data: prod } = await supabase
    .from('produtos')
    .select('*')
    .ilike('codigo_barras', 'kit981')
    .single();

  if (!prod) {
    console.error("Produto kit981 não encontrado!");
    return;
  }

  console.log("Upload das imagens para o Supabase storage do produto:", prod.nome);
  const novamImagens = await uploadBlingImagesToSupabase(prod.imagens || [], prod.bling_id || '15919622117');
  
  await supabase
    .from('produtos')
    .update({ imagens: novamImagens })
    .eq('id', prod.id);

  console.log("Imagens do kit981 salvas com sucesso no Supabase storage:", novamImagens);
}

uploadKit981Images();
