const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getValidBlingToken() {
  const { data: cfgTokens } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const { data: cfgCreds } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').single();

  const tokenInfo = cfgTokens?.valor;
  const creds = cfgCreds?.valor;

  if (!tokenInfo?.access_token) return null;

  // Test token validity
  const testReq = await fetch('https://api.bling.com.br/Api/v3/produtos?pagina=1&limite=1', {
    headers: { 'Authorization': `Bearer ${tokenInfo.access_token}` }
  });

  if (testReq.status !== 401) {
    return tokenInfo.access_token;
  }

  console.log('[REPARO ESTRITO] Access Token expirou. Renovando via Refresh Token...');

  try {
    const authResponse = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(creds.client_id + ':' + creds.client_secret).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenInfo.refresh_token,
      })
    });

    const authData = await authResponse.json();

    if (authData.access_token) {
      console.log('✅ Token do Bling RENOVADO COM SUCESSO!');
      await supabase.from('configuracoes').upsert({
        chave: 'bling_tokens',
        valor: {
          access_token: authData.access_token,
          refresh_token: authData.refresh_token || tokenInfo.refresh_token,
        }
      }, { onConflict: 'chave' });

      return authData.access_token;
    }
  } catch (e) {
    console.error('Erro na renovação do token:', e.message);
  }

  return null;
}

async function repararFotosEstrito() {
  const token = await getValidBlingToken();
  if (!token) {
    console.error('[ERRO] Não foi possível autenticar com a API do Bling.');
    return;
  }

  console.log('\n====================================================');
  console.log('🛡️ INICIANDO AUDITORIA E REPARAÇÃO ESTRITA DE IMAGENS');
  console.log('====================================================\n');

  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, bling_id, codigo_barras, nome, imagens, parent_id');

  if (error || !produtos) {
    console.error('Erro ao listar produtos do banco:', error);
    return;
  }

  const estatisticas = {
    totalProdutos: produtos.length,
    totalComImagem: 0,
    totalSemImagem: 0,
    totalCorrigidos: 0,
    totalPreservadosManuais: 0,
    totalSemFotosNoBling: 0,
    mapeamentosDuvidosos: 0,
  };

  for (const prod of produtos) {
    // 1. Preservar produtos manuais (sem Bling ID)
    if (!prod.bling_id) {
      console.log(`[PRESERVADO MANUAL] ${prod.nome} (SKU: ${prod.codigo_barras || 'Sem SKU'})`);
      estatisticas.totalPreservadosManuais++;
      if (Array.isArray(prod.imagens) && prod.imagens.length > 0) {
        estatisticas.totalComImagem++;
      } else {
        estatisticas.totalSemImagem++;
      }
      continue;
    }

    const cleanBlingId = String(prod.bling_id).trim();

    try {
      // 2. Consulta direta e individual por Bling Product ID
      const res = await fetch(`https://api.bling.com.br/Api/v3/produtos/${cleanBlingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        console.warn(`[IMAGE_MAPPING_UNRESOLVED] Bling Product ID ${cleanBlingId} retornou status ${res.status}`);
        estatisticas.mapeamentosDuvidosos++;
        continue;
      }

      const json = await res.json();
      const prodBling = json.data;

      // 3. Validação estrita de identidade
      if (!prodBling || String(prodBling.id) !== cleanBlingId) {
        console.error(`[INVARIANTE VIOLADO] Esperado BlingId ${cleanBlingId}, recebido ${prodBling?.id}`);
        estatisticas.mapeamentosDuvidosos++;
        continue;
      }

      // 4. Extrair fotos que pertencem ESTRITAMENTE a este produto no Bling
      let fotosProprias = [];
      const ext = prodBling.midia?.imagens?.externas?.map(i => i.link) || [];
      const int = prodBling.midia?.imagens?.internas?.map(i => i.link) || [];
      fotosProprias = [...ext, ...int].filter(Boolean);

      if (fotosProprias.length === 0 && Array.isArray(prodBling.midia)) {
        fotosProprias = prodBling.midia.map(m => m.url || m.link).filter(Boolean);
      }
      if (fotosProprias.length === 0 && prodBling.imagemURL) {
        fotosProprias = [prodBling.imagemURL];
      }

      // 5. Atualizar registro no banco com base na identidade validada
      if (fotosProprias.length > 0) {
        await supabase
          .from('produtos')
          .update({ imagens: fotosProprias })
          .eq('id', prod.id);

        console.log(`[ASSOCIATED] SKU ${prod.codigo_barras || 'N/A'} (BlingID: ${cleanBlingId}) -> ${fotosProprias.length} fotos vinculadas.`);
        estatisticas.totalComImagem++;
        estatisticas.totalCorrigidos++;
      } else {
        // Se no Bling o produto NÃO possui foto própria, removemos fotos indevidas herdadas de outro SKU
        await supabase
          .from('produtos')
          .update({ imagens: null })
          .eq('id', prod.id);

        console.log(`[SKIPPED_NO_IMAGE] SKU ${prod.codigo_barras || 'N/A'} (BlingID: ${cleanBlingId}) -> Bling sem fotos. Foto limpa.`);
        estatisticas.totalSemImagem++;
        estatisticas.totalSemFotosNoBling++;
      }
    } catch (err) {
      console.error(`[ERRO REPARO] SKU ${prod.codigo_barras}:`, err.message);
      estatisticas.mapeamentosDuvidosos++;
    }
  }

  console.log('\n====================================================');
  console.log('📊 RELATÓRIO FINAL DA AUDITORIA E REPARAÇÃO ESTRITA:');
  console.log('====================================================');
  console.log(`TOTAL DE PRODUTOS ANALISADOS: ${estatisticas.totalProdutos}`);
  console.log(`TOTAL COM FOTO PRÓPRIA VERIFICADA: ${estatisticas.totalComImagem}`);
  console.log(`TOTAL SEM FOTO (PLACEHOLDER): ${estatisticas.totalSemImagem}`);
  console.log(`TOTAL DE REPARAÇÕES REALIZADAS: ${estatisticas.totalCorrigidos}`);
  console.log(`TOTAL DE PRODUTOS MANUAIS PRESERVADOS: ${estatisticas.totalPreservadosManuais}`);
  console.log(`TOTAL PRODUTOS SEM FOTOS NO BLING: ${estatisticas.totalSemFotosNoBling}`);
  console.log(`TOTAL MAPEAMENTOS DUVIDOSOS / REVISAR: ${estatisticas.mapeamentosDuvidosos}`);
  console.log('====================================================\n');
}

repararFotosEstrito();
