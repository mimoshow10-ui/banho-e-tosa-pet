import { supabase } from '../src/lib/supabase';
import { uploadBlingImagesToSupabase } from '../src/lib/upload-images';

async function run() {
  console.log("Iniciando reimportação das fotos do SKU MS4541...");

  // 1. Get Bling Token
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;
  if (!token) {
    console.error("Token não encontrado!");
    return;
  }

  // 2. Fetch MS4541 directly from Bling (ID 16539668550)
  const prodId = '16539668550';
  const res = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prodId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const json = await res.json();
  const prod = json.data;

  if (!prod) {
    console.error("Produto não encontrado no Bling:", json);
    return;
  }

  console.log("Produto no Bling:", prod.nome, "SKU:", prod.codigo);

  // 3. Extract exact images from Bling
  const externas = prod.midia?.imagens?.externas?.map((img: any) => img.link) || [];
  const internas = prod.midia?.imagens?.internas?.map((img: any) => img.link) || [];
  let imagensBling = [...externas, ...internas].filter(Boolean);

  if (imagensBling.length === 0 && prod.imagemURL) {
    imagensBling = [prod.imagemURL];
  }

  console.log("URLs de Imagens no Bling:", imagensBling);

  // 4. Delete old photos in Supabase storage under bucket produtos-fotos/16539668550/
  const { data: existingFiles } = await supabase.storage.from('produtos-fotos').list(prodId);
  if (existingFiles && existingFiles.length > 0) {
    const filesToRemove = existingFiles.map(f => `${prodId}/${f.name}`);
    console.log("Removendo arquivos antigos do storage:", filesToRemove);
    await supabase.storage.from('produtos-fotos').remove(filesToRemove);
  }

  // 5. Upload new valid Bling images to Supabase storage
  const novasImagens = await uploadBlingImagesToSupabase(imagensBling, prodId);
  console.log("Novas Imagens no Supabase Storage:", novasImagens);

  // 6. Update database record for MS4541
  const { data: dbProd, error: dbErr } = await supabase
    .from('produtos')
    .update({
      imagens: novasImagens,
      nome: prod.nome,
      preco: prod.preco,
      descricao_curta: prod.descricaoCurta || ''
    })
    .eq('codigo_barras', 'MS4541')
    .select();

  if (dbErr) {
    console.error("Erro ao atualizar banco:", dbErr);
  } else {
    console.log("Produto atualizado com sucesso no banco de dados!", dbProd);
  }
}

run().catch(console.error);
