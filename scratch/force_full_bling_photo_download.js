const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getValidToken() {
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  let token = cfg?.valor?.access_token;

  try {
    let testRes = await fetch('https://api.bling.com.br/Api/v3/produtos?limite=1', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!testRes.ok) {
      console.log('🔄 Token expirado. Solicitando novo Token com Refresh Token...');
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
          console.log('✅ Novo Token obtido e salvo no banco com sucesso!');
        }
      }
    }
  } catch (err) {
    console.error('Erro na validação do token:', err.message);
  }
  return token;
}

async function forcePhotoImport() {
  console.log('🚀 FORÇANDO IMPORTAÇÃO E DOWNLOAD DE 100% DAS FOTOS DIRETO DO BLING...');

  const token = await getValidToken();
  if (!token) {
    console.error('❌ Não foi possível obter token válido do Bling!');
    return;
  }

  // Puxar todos os produtos do Supabase
  let allProds = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, bling_id, codigo_barras, nome, imagens')
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (error || !data || data.length === 0) break;
    allProds.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  console.log(`📦 Total de produtos no banco Supabase: ${allProds.length}`);

  // Filtrar produtos que precisam de importação/recuperação de imagem
  const alvos = allProds.filter(p => {
    if (!p.imagens || p.imagens.length === 0) return true;
    return p.imagens.some(img => typeof img === 'string' && (!img.includes('supabase.co') || img.includes('amazonaws.com')));
  });

  console.log(`🎯 Encontrados ${alvos.length} produtos para sincronizar fotos diretamente com o Bling.`);

  let recuperados = 0;

  for (let idx = 0; idx < alvos.length; idx++) {
    const prod = alvos[idx];
    const blingId = prod.bling_id;
    const sku = prod.codigo_barras;

    let urlsColetadas = [];

    // 1. Tentar buscar detalhes por Bling ID
    if (blingId) {
      try {
        const res = await fetch(`https://api.bling.com.br/Api/v3/produtos/${blingId}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.status === 429) {
          console.log('⏳ Rate limit (429) atingido. Aguardando 2 segundos...');
          await sleep(2000);
        } else if (res.ok) {
          const json = await res.json();
          const detail = json.data;
          if (detail) {
            if (detail.imagemURL) urlsColetadas.push(detail.imagemURL);
            if (Array.isArray(detail.imagens)) {
              detail.imagens.forEach(imgObj => {
                const u = imgObj.link || imgObj.url || imgObj.caminho;
                if (u && typeof u === 'string') urlsColetadas.push(u);
              });
            }
            if (detail.midia?.imagens?.internas && Array.isArray(detail.midia.imagens.internas)) {
              detail.midia.imagens.internas.forEach(imgObj => {
                const u = imgObj.link || imgObj.url;
                if (u && typeof u === 'string') urlsColetadas.push(u);
              });
            }
          }
        }
      } catch {}
    }

    // 2. Se não achou por ID, tentar buscar produto por SKU/código
    if (urlsColetadas.length === 0 && sku) {
      try {
        const resSearch = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(sku)}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (resSearch.ok) {
          const jsonSearch = await resSearch.json();
          const itemBling = jsonSearch.data?.[0];
          if (itemBling?.id) {
            const resDetail = await fetch(`https://api.bling.com.br/Api/v3/produtos/${itemBling.id}`, {
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (resDetail.ok) {
              const jsonDetail = await resDetail.json();
              const d = jsonDetail.data;
              if (d?.imagemURL) urlsColetadas.push(d.imagemURL);
              if (Array.isArray(d?.imagens)) {
                d.imagens.forEach(imgObj => {
                  const u = imgObj.link || imgObj.url || imgObj.caminho;
                  if (u && typeof u === 'string') urlsColetadas.push(u);
                });
              }
            }
          }
        }
      } catch {}
    }

    // 3. Incluir imagens já existentes que usavam amazonaws se nenhuma nova foi coletada
    if (urlsColetadas.length === 0 && Array.isArray(prod.imagens)) {
      urlsColetadas = prod.imagens.filter(img => typeof img === 'string' && img.startsWith('http'));
    }

    // Limpar duplicatas
    urlsColetadas = Array.from(new Set(urlsColetadas));

    if (urlsColetadas.length > 0) {
      // Atualizar o produto no Supabase com o novo array de fotos
      const { error: updErr } = await supabase
        .from('produtos')
        .update({ imagens: urlsColetadas })
        .eq('id', prod.id);

      if (!updErr) {
        recuperados++;
        if (idx % 10 === 0 || idx === alvos.length - 1) {
          console.log(`  ✅ [${idx + 1}/${alvos.length}] Foto sincronizada para "${prod.nome.slice(0, 35)}..." (${urlsColetadas.length} foto(s))`);
        }
      }
    }

    // Pausa suave para evitar estouro de limite da API Bling
    await sleep(80);
  }

  console.log(`\n🎉 PROCESSO CONCLUÍDO! Fotos sincronizadas com sucesso para ${recuperados} produtos.`);
}

forcePhotoImport();
