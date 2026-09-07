const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
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

  for (let i = 0; i < Math.min(blingUrls.length, 10); i++) {
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
    let prodId = itemBling.blingId ? String(itemBling.blingId) : (itemBling.id ? String(itemBling.id) : null);

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
      console.log(`❌ Não foi possível carregar detalhes do produto: ${itemBling.sku || itemBling.nome}`);
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

    const skuCod = prodCompleto.codigo || prodCompleto.gtin || itemBling.sku;
    const { data: prodExistente } = await supabase
      .from('produtos')
      .select('id, imagens, origem')
      .or(`bling_id.eq.${prodCompleto.id}${skuCod ? `,codigo_barras.eq.${skuCod}` : ''}`)
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
      codigo_barras: skuCod || null,
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
      if (error) console.error(`Erro ao atualizar ID ${prodExistente.id}:`, error.message);
      else console.log(`✓ [ATUALIZADO] ${prodCompleto.nome} (SKU: ${skuCod})`);
    } else {
      const { error } = await supabase.from('produtos').insert([payload]);
      if (error) console.error(`Erro ao cadastrar ${prodCompleto.nome}:`, error.message);
      else console.log(`✨ [NOVO ADICIONADO] ${prodCompleto.nome} (SKU: ${skuCod})`);
    }

    return true;
  } catch (err) {
    console.error(`Erro ao importar item ${itemBling.sku || itemBling.nome}:`, err);
    return false;
  }
}

async function runMasterImport() {
  console.log('🚀 Iniciando identificação dos 100 produtos PET mais vendidos no Bling...');
  const token = await getValidToken();
  if (!token) {
    console.error('❌ Token do Bling não disponível.');
    return;
  }

  const d = new Date();
  d.setDate(d.getDate() - 100);
  const dataInicial = d.toISOString().slice(0, 10);
  const dataFinal = new Date().toISOString().slice(0, 10);

  // 1. Obter pedidos dos últimos 100 dias
  console.log(`🔎 Buscando pedidos de vendas (${dataInicial} a ${dataFinal})...`);
  let pedidos = [];
  for (let p = 1; p <= 12; p++) {
    const res = await fetch(`https://api.bling.com.br/Api/v3/pedidos/vendas?dataInicial=${dataInicial}&dataFinal=${dataFinal}&limite=100&pagina=${p}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) break;
    const json = await res.json();
    const data = json.data || [];
    if (data.length === 0) break;
    pedidos.push(...data);
    await sleep(250);
  }

  console.log(`✅ Obteve ${pedidos.length} pedidos de vendas recentes.`);

  // 2. Extrair e ranquear vendas por SKU
  const vendasMap = {};
  const batchSize = 10;
  for (let i = 0; i < pedidos.length; i += batchSize) {
    const slice = pedidos.slice(i, i + batchSize);
    await Promise.all(slice.map(async (ped) => {
      try {
        const res = await fetch(`https://api.bling.com.br/Api/v3/pedidos/vendas/${ped.id}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
          const json = await res.json();
          const itens = json.data?.itens || [];
          for (const item of itens) {
            const sku = (item.codigo || String(item.produto?.id || '')).trim();
            const nome = item.descricao || item.nome || '';
            const qtd = Number(item.quantidade || 0);
            if (!sku) continue;

            if (!vendasMap[sku]) {
              vendasMap[sku] = { sku, blingId: item.produto?.id || null, nome, qtd: 0 };
            }
            vendasMap[sku].qtd += qtd;
          }
        }
      } catch {}
    }));
    await sleep(350);
  }

  const rankingVendas = Object.values(vendasMap).sort((a, b) => b.qtd - a.qtd);

  // Palavras a excluir
  const palavrasExcluir = ['infantil', 'decoração', 'decoracao', 'decorac', 'mdf'];

  // Ranqueados PET
  const petMaisVendidos = rankingVendas.filter(p => {
    const nomeLower = (p.nome || '').toLowerCase();
    return !palavrasExcluir.some(w => nomeLower.includes(w));
  });

  console.log(`📊 Produtos PET encontrados no histórico de vendas: ${petMaisVendidos.length}`);

  // Se precisar de mais produtos para completar 100, buscar da API de produtos ativos
  let listaFinal = [...petMaisVendidos];

  if (listaFinal.length < 100) {
    console.log(`ℹ️ Buscando produtos ativos no Bling para completar 100 itens PET...`);
    let pag = 1;
    while (listaFinal.length < 100 && pag <= 10) {
      const res = await fetch(`https://api.bling.com.br/Api/v3/produtos?limite=100&pagina=${pag}&situacao=A`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) break;
      const json = await res.json();
      const prods = json.data || [];
      if (prods.length === 0) break;

      for (const p of prods) {
        const nomeLower = (p.nome || '').toLowerCase();
        const ehExcluido = palavrasExcluir.some(w => nomeLower.includes(w));
        if (!ehExcluido) {
          const jaExiste = listaFinal.some(item => (item.sku && p.codigo && item.sku.toLowerCase() === p.codigo.toLowerCase()) || String(item.blingId) === String(p.id));
          if (!jaExiste) {
            listaFinal.push({
              sku: p.codigo,
              blingId: p.id,
              nome: p.nome,
              qtd: 0
            });
            if (listaFinal.length >= 100) break;
          }
        }
      }
      pag++;
      await sleep(250);
    }
  }

  const top100Final = listaFinal.slice(0, 100);
  console.log(`\n📦 INICIANDO CONEXÃO E IMPORTAÇÃO DOS 100 PRODUTOS PET SELECIONADOS (${top100Final.length} itens):\n`);

  let concluidos = 0;
  for (let i = 0; i < top100Final.length; i++) {
    const item = top100Final[i];
    console.log(`[${i + 1}/${top100Final.length}] Processando: ${item.nome} (SKU: ${item.sku || 'N/A'}, Vendas: ${item.qtd})`);
    
    const ok = await importarProdutoCompleto(token, item);
    if (ok) concluidos++;
    await sleep(400);
  }

  console.log(`\n==================================================`);
  console.log(`🎉 IMPORTAÇÃO DOS 100 PRODUTOS PET MAIS VENDIDOS FINALIZADA!`);
  console.log(`Total de produtos sincronizados com sucesso: ${concluidos}/${top100Final.length}`);
}

runMasterImport();
