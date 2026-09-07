const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getValidToken() {
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  let token = cfg?.valor?.access_token;

  let testRes = await fetch('https://api.bling.com.br/Api/v3/produtos?limite=1', {
    headers: { 'Authorization': 'Bearer ' + token }
  });

  if (!testRes.ok) {
    const { data: creds } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').single();
    if (creds?.valor && cfg?.valor?.refresh_token) {
      const { client_id, client_secret } = creds.valor;
      const authRes = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
          'Accept': '1.0'
        },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: cfg.valor.refresh_token })
      });
      const authData = await authRes.json();
      if (authData.access_token) {
        token = authData.access_token;
        await supabase.from('configuracoes').upsert({
          chave: 'bling_tokens',
          valor: {
            access_token: authData.access_token,
            refresh_token: authData.refresh_token || cfg.valor.refresh_token
          }
        }, { onConflict: 'chave' });
      }
    }
  }
  return token;
}

async function uploadBlingImagesToSupabase(blingUrls, productId) {
  if (!productId || !Array.isArray(blingUrls) || blingUrls.length === 0) return [];
  const cleanProductId = String(productId).trim();
  const permanentUrls = [];

  for (let i = 0; i < blingUrls.length; i++) {
    const url = blingUrls[i];
    if (!url || typeof url !== 'string') continue;

    if (url.includes('supabase.co/storage/v1/object/public/produtos-fotos')) {
      permanentUrls.push(url);
      continue;
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'image/*'
        }
      });

      if (!response.ok) throw new Error(`Status ${response.status}`);

      const buffer = await response.arrayBuffer();
      const fileName = `prod_${cleanProductId}_${i}_${Date.now()}.jpg`;
      const filePath = `${cleanProductId}/${fileName}`;

      const { error } = await supabase.storage
        .from('produtos-fotos')
        .upload(filePath, buffer, {
          contentType: response.headers.get('content-type') || 'image/jpeg',
          upsert: true
        });

      if (error) {
        permanentUrls.push(url);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('produtos-fotos')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        permanentUrls.push(publicUrlData.publicUrl);
      } else {
        permanentUrls.push(url);
      }
    } catch {
      permanentUrls.push(url);
    }
  }
  return permanentUrls;
}

async function importarProdutoCompleto(token, itemBling) {
  try {
    let prodCompleto = null;
    let prodId = itemBling.blingId ? String(itemBling.blingId) : null;

    if (prodId) {
      const res = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prodId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const json = await res.json();
        prodCompleto = json.data;
      }
    }

    if (!prodCompleto && itemBling.sku) {
      const res = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(itemBling.sku)}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const json = await res.json();
        const base = json.data?.[0];
        if (base) {
          prodId = String(base.id);
          const resDet = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prodId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (resDet.ok) {
            const detJson = await resDet.json();
            prodCompleto = detJson.data || base;
          }
        }
      }
    }

    if (!prodCompleto) {
      console.log(`❌ Não foi possível carregar detalhes do produto SKU: ${itemBling.sku}`);
      return false;
    }

    let estoqueAtual = 0;
    try {
      const estRes = await fetch(`https://api.bling.com.br/Api/v3/estoques/saldos?idsProdutos[]=${prodCompleto.id}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (estRes.ok) {
        const estJson = await estRes.json();
        estoqueAtual = estJson.data?.[0]?.saldoFisicoTotal || 0;
      }
    } catch {}

    let imagensBling = [];
    const externas = prodCompleto.midia?.imagens?.externas?.map(i => i.link) || [];
    const internas = prodCompleto.midia?.imagens?.internas?.map(i => i.link) || [];
    imagensBling = [...externas, ...internas].filter(Boolean);

    if (imagensBling.length === 0 && Array.isArray(prodCompleto.midia)) {
      imagensBling = prodCompleto.midia.map(m => m.url || m.link).filter(Boolean);
    }
    if (imagensBling.length === 0 && prodCompleto.imagemURL) {
      imagensBling = [prodCompleto.imagemURL];
    }

    const { data: prodExistente } = await supabase
      .from('produtos')
      .select('id, imagens, origem')
      .or(`bling_id.eq.${prodCompleto.id},codigo_barras.eq.${prodCompleto.codigo || 'XYZ_NONE'}`)
      .maybeSingle();

    let imagensPermanentes = [];
    if (imagensBling.length > 0) {
      imagensPermanentes = await uploadBlingImagesToSupabase(imagensBling, String(prodCompleto.id));
    }

    let imagensFinais = null;
    if (prodExistente?.origem === 'MANUAL') {
      imagensFinais = prodExistente.imagens;
    } else if (imagensPermanentes.length > 0) {
      imagensFinais = imagensPermanentes;
    } else if (imagensBling.length > 0) {
      imagensFinais = imagensBling;
    }

    const baseSlug = prodCompleto.nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, '');
    const slug = `${baseSlug}-${prodCompleto.id}`;

    const payload = {
      bling_id: String(prodCompleto.id),
      codigo_barras: prodCompleto.codigo || prodCompleto.gtin,
      nome: prodCompleto.nome,
      preco: Number(prodCompleto.preco || 0),
      estoque: Number(estoqueAtual || 0),
      slug: slug,
      ativo: true,
      peso_liquido: Number(prodCompleto.pesoLiquido || 0),
      peso_bruto: Number(prodCompleto.pesoBruto || 0),
      largura: Number(prodCompleto.dimensoes?.largura || 0),
      altura: Number(prodCompleto.dimensoes?.altura || 0),
      profundidade: Number(prodCompleto.dimensoes?.profundidade || 0),
      marca: prodCompleto.marca || '',
      ncm: prodCompleto.tributacao?.ncm || '',
      descricao_curta: prodCompleto.descricaoCurta || '',
      imagens: imagensFinais
    };

    if (prodExistente?.id) {
      const { error } = await supabase.from('produtos').update(payload).eq('id', prodExistente.id);
      if (error) console.error(`Erro ao atualizar produto ID ${prodExistente.id}:`, error);
      else console.log(`✓ Produto ${prodCompleto.nome} (${prodCompleto.codigo}) atualizado! (Estoque: ${estoqueAtual})`);
    } else {
      const { error } = await supabase.from('produtos').insert([payload]);
      if (error) console.error(`Erro ao cadastrar novo produto ${prodCompleto.nome}:`, error);
      else console.log(`✨ NOVO PRODUTO CADASTRADO: ${prodCompleto.nome} (${prodCompleto.codigo}) (Estoque: ${estoqueAtual})`);
    }

    return true;
  } catch (err) {
    console.error(`Erro inesperado ao importar produto ${itemBling.sku}:`, err);
    return false;
  }
}

module.exports = { importarProdutoCompleto };
