import { supabase } from '../src/lib/supabase';

async function inspectSchema() {
  const { data } = await supabase
    .from('produtos')
    .select('id, nome, imagens')
    .not('imagens', 'is', null)
    .limit(10);

  console.log("Exemplo de imagens nos produtos:", data);
  if (data && data.length > 0) {
    console.log("Tipo do campo imagens:", typeof data[0].imagens, "IsArray:", Array.isArray(data[0].imagens));
  }
}

inspectSchema();
