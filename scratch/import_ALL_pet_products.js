const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function getValidToken() {
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  let token = cfg?.valor?.access_token;

  try {
    let testRes = await fetchWithTimeout('https://api.bling.com.br/Api/v3/produtos?limite=1', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!testRes.ok) {
      const { data: creds } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').single();
      if (creds?.valor && cfg?.valor?.refresh_token) {
        const { client_id, client_secret } = creds.valor;
        const authRes = await fetchWithTimeout('https://www.bling.com.br/Api/v3/oauth/token', {
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
  } catch {}
  return token;
}

async function uploadBlingImagesToSupabase(blingUrls, productId) {
  if (!productId || !Array.isArray(blingUrls) || blingUrls.length === 0) return [];
  const cleanProductId = String(productId).trim();
  const permanentUrls = [];

  for (let i = 0; i < Math.min(blingUrls.length, 6); i++) {
    const url = blingUrls[i];
    if (!url || typeof url !== 'string') continue;

    if (url.includes('supabase.co/storage/v1/object/public/produtos-fotos')) {
      permanentUrls.push(url);
      continue;
    }

    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'image/*'
        }
      }, 5000);

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
    let prodId = itemBling.id ? String(itemBling.id) : (itemBling.blingId ? String(itemBling.blingId) : null);

    if (prodId) {
      try {
        const res = await fetchWithTimeout(`https://api.bling.com.br/Api/v3/produtos/${prodId}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
          const json = await res.json();
          prodCompleto = json.data;
        }
      } catch {}
    }

    if (!prodCompleto && itemBling.codigo) {
      try {
        const res = await fetchWithTimeout(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(itemBling.codigo)}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
          const json = await res.json();
          const base = json.data?.[0];
          if (base) {
            prodId = String(base.id);
            const resDet = await fetchWithTimeout(`https://api.bling.com.br/Api/v3/produtos/${prodId}`, {
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (resDet.ok) {
              const detJson = await resDet.json();
              prodCompleto = detJson.data || base;
            }
          }
        }
      } catch {}
    }

    if (!prodCompleto) {
      console.log(`⚠️ Detalhes indisponíveis para o produto: ${itemBling.codigo || itemBling.nome}`);
      return false;
    }

    let estoqueAtual = 0;
    try {
      const estRes = await fetchWithTimeout(`https://api.bling.com.br/Api/v3/estoques/saldos?idsProdutos[]=${prodCompleto.id}`, {
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

    const skuCod = prodCompleto.codigo || prodCompleto.gtin || itemBling.codigo || null;

    let prodExistente = null;
    const { data: dbBling } = await supabase.from('produtos').select('id, imagens, origem').eq('bling_id', String(prodCompleto.id)).maybeSingle();
    prodExistente = dbBling;

    if (!prodExistente && skuCod) {
      const { data: dbSku } = await supabase.from('produtos').select('id, imagens, origem').eq('codigo_barras', skuCod).maybeSingle();
      prodExistente = dbSku;
    }

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
      codigo_barras: skuCod,
      nome: prodCompleto.nome,
      preco: Number(prodCompleto.preco || itemBling.preco || 0),
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
      if (error) console.error(`Erro update ID ${prodExistente.id}:`, error.message);
      else console.log(`✓ [ATUALIZADO] ${prodCompleto.nome} (SKU: ${skuCod || 'N/A'}, Estoque: ${estoqueAtual})`);
    } else {
      const { error } = await supabase.from('produtos').upsert(payload, { onConflict: 'bling_id' });
      if (error) console.error(`Erro upsert ${prodCompleto.nome}:`, error.message);
      else console.log(`✨ [SINCRONIZADO] ${prodCompleto.nome} (SKU: ${skuCod || 'N/A'}, Estoque: ${estoqueAtual})`);
    }

    return true;
  } catch (err) {
    console.error(`Erro ao importar item ${itemBling.codigo || itemBling.nome}:`, err);
    return false;
  }
}

async function runImportAllPet() {
  console.log('🚀 Iniciando busca e importação DE TODOS OS PRODUTOS PET do Bling para a loja...');
  const token = await getValidToken();
  if (!token) {
    console.error('❌ Token do Bling não disponível.');
    return;
  }

  // 1. Obter TODOS os produtos ativos do Bling (varrendo todas as páginas)
  console.log('🔎 Varrendo catálogo do Bling para localizar todos os produtos PET ativos...');
  let pag = 1;
  let todosProds = [];
  const palavrasExcluir = ['infantil', 'decoração', 'decoracao', 'decorac', 'mdf'];

  while (true) {
    try {
      console.log(`  Buscando página ${pag} de produtos do Bling...`);
      const res = await fetchWithTimeout(`https://api.bling.com.br/Api/v3/produtos?limite=100&pagina=${pag}&situacao=A`, {
        headers: { 'Authorization': 'Bearer ' + token }
      }, 8000);
      if (!res.ok) break;
      const json = await res.json();
      const prods = json.data || [];
      if (prods.length === 0) break;

      todosProds.push(...prods);
      if (prods.length < 100) break;
      pag++;
      await sleep(250);
    } catch (err) {
      console.error(`Erro na página ${pag}:`, err.message);
      break;
    }
  }

  console.log(`📦 Total de produtos ativos retornados do Bling: ${todosProds.length}`);

  // Filtrar exclusivamente produtos PET (removendo infantil, decoração, mdf)
  const petProds = todosProds.filter(p => {
    const nomeLower = (p.nome || '').toLowerCase();
    return !palavrasExcluir.some(w => nomeLower.includes(w));
  });

  console.log(`🐾 Total de PRODUTOS PET ELEGÍVEIS para importação total: ${petProds.length}`);
  console.log(`\n📥 INICIANDO SINCRONIZAÇÃO COMPLETA DE TODOS OS ${petProds.length} PRODUTOS PET:\n`);

  let concluidos = 0;
  for (let i = 0; i < petProds.length; i++) {
    const item = petProds[i];
    console.log(`[${i + 1}/${petProds.length}] Sincronizando: ${item.nome} (SKU: ${item.codigo || 'N/A'})`);

    const ok = await importarProdutoCompleto(token, item);
    if (ok) concluidos++;
    await sleep(300);
  }

  console.log(`\n==================================================`);
  console.log(`🎉 IMPORTAÇÃO COMPLETA DE TODOS OS PRODUTOS PET CONCLUÍDA!`);
  console.log(`Total de produtos PET sincronizados no site: ${concluidos}/${petProds.length}`);
}

runImportAllPet();
