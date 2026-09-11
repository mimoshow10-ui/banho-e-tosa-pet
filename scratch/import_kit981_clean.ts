import { supabase } from '../src/lib/supabase';
import { uploadBlingImagesToSupabase } from '../src/lib/upload-images';

async function importKit981Clean() {
  console.log("Importando e sincronizando SKU kit981 do Bling...");

  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;
  if (!token) {
    console.error("Token não encontrado!");
    return;
  }

  // 1. Fetch exact product from Bling API (codigo=kit981)
  const res = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=kit981`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const json = await res.json();
  const prodBase = json.data?.[0];

  if (!prodBase) {
    console.error("Produto não encontrado no Bling por codigo=kit981:", json);
    return;
  }

  const prodId = String(prodBase.id);
  console.log("Produto no Bling:", prodBase.nome, "Bling ID:", prodId, "SKU:", prodBase.codigo);

  // 2. Fetch full details from Bling
  const detRes = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prodId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const detJson = await detRes.json();
  const prodCompleto = detJson.data || prodBase;

  // 3. Extract images
  let imagensBling: string[] = [];
  const externas = prodCompleto.midia?.imagens?.externas?.map((img: any) => img.link) || [];
  const internas = prodCompleto.midia?.imagens?.internas?.map((img: any) => img.link) || [];
  imagensBling = [...externas, ...internas].filter(Boolean);

  if (imagensBling.length === 0 && Array.isArray(prodCompleto.midia)) {
    imagensBling = prodCompleto.midia.map((m: any) => m.url || m.link).filter(Boolean);
  }
  if (imagensBling.length === 0 && prodCompleto.imagemURL) {
    imagensBling = [prodCompleto.imagemURL];
  }

  console.log("Imagens encontradas no Bling:", imagensBling.length, imagensBling);

  // 4. Upload images to Supabase storage
  const imagensPermanentes = await uploadBlingImagesToSupabase(imagensBling, prodId);
  console.log("Imagens salvas no Supabase Storage:", imagensPermanentes);

  // 5. Try auto-assigning category if category_id is null
  // Name: "100 Adesivos Pet Coleção HALLOWEEN glitter Lacinho Pet"
  // Let's find category for Halloween > Adesivo EVA or Adesivos Pet > Adesivo EVA
  let targetCatId: string | null = null;
  
  const { data: halloweenCat } = await supabase.from('categorias').select('id').eq('slug', 'halloween').maybeSingle();
  if (halloweenCat) {
    const { data: sub } = await supabase.from('categorias').select('id').eq('parent_id', halloweenCat.id).ilike('nome', '%eva%').maybeSingle();
    if (sub) targetCatId = sub.id;
  }

  // 6. Update database record for kit981
  const { data: updated, error: err } = await supabase
    .from('produtos')
    .update({
      nome: prodCompleto.nome,
      preco: prodCompleto.preco || 0,
      codigo_barras: 'kit981',
      imagens: imagensPermanentes.length > 0 ? imagensPermanentes : imagensBling,
      categoria_id: targetCatId,
      ativo: true
    })
    .ilike('codigo_barras', 'kit981')
    .select();

  if (err) {
    console.error("Erro ao atualizar produto no banco:", err);
  } else {
    console.log("Produto kit981 atualizado com sucesso no banco de dados!", updated);
  }
}

importKit981Clean().catch(console.error);
