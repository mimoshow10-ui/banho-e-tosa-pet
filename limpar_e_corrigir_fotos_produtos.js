const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getValidBlingToken() {
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const { data: credsCfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').single();

  const tokenInfo = cfg?.valor;
  const creds = credsCfg?.valor;

  if (!tokenInfo?.access_token) return null;

  const testReq = await fetch('https://api.bling.com.br/Api/v3/produtos?pagina=1&limite=1', {
    headers: { 'Authorization': `Bearer ${tokenInfo.access_token}` }
  });

  if (testReq.status !== 401) {
    return tokenInfo.access_token;
  }

  console.log('Access Token expirou. Renovando via Refresh Token...');

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
      console.log('✅ Token do Bling RENOVADO!');
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
    console.error('Erro na renovação:', e.message);
  }

  return null;
}

async function sincronizarEFaxinarFotos() {
  const token = await getValidBlingToken();
  if (!token) {
    console.error('Token do Bling indisponível.');
    return;
  }

  console.log('🧹 Iniciando faxina e correção estrita de fotos por SKU/Bling ID no banco...');

  const { data: produtos, error } = await supabase.from('produtos').select('id, bling_id, nome, codigo_barras, imagens');

  if (error || !produtos) {
    console.error('Erro ao buscar produtos:', error);
    return;
  }

  console.log(`Total de produtos no banco de dados para analisar: ${produtos.length}`);

  let corrigidos = 0;
  let limposSemFoto = 0;

  for (const prod of produtos) {
    if (!prod.bling_id) continue;

    try {
      const detReq = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prod.bling_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const detJson = await detReq.json();
      const prodBling = detJson.data;

      if (!prodBling) continue;

      let imagensProprias = [];
      const ext = prodBling.midia?.imagens?.externas?.map(i => i.link) || [];
      const int = prodBling.midia?.imagens?.internas?.map(i => i.link) || [];
      imagensProprias = [...ext, ...int];

      if (imagensProprias.length === 0 && Array.isArray(prodBling.midia)) {
        imagensProprias = prodBling.midia.map(m => m.url || m.link).filter(Boolean);
      }
      if (imagensProprias.length === 0 && prodBling.imagemURL) {
        imagensProprias = [prodBling.imagemURL];
      }

      if (imagensProprias.length > 0) {
        // Atualiza com a foto exata e própria do produto
        await supabase.from('produtos').update({ imagens: imagensProprias }).eq('id', prod.id);
        console.log(`✅ Foto própria mantida/atualizada para [${prod.codigo_barras || prod.nome}]: ${imagensProprias[0]}`);
        corrigidos++;
      } else {
        // Se o produto NÃO tem foto própria no Bling, limpa qualquer foto indevidamente herdada!
        await supabase.from('produtos').update({ imagens: null }).eq('id', prod.id);
        console.log(`🧹 Foto indevida removida [${prod.codigo_barras || prod.nome}] -> Produto marcado como Sem Foto.`);
        limposSemFoto++;
      }
    } catch (e) {
      console.error(`Erro ao processar ${prod.nome}:`, e.message);
    }
  }

  console.log('\n====================================================');
  console.log('RELATÓRIO DA FAXINA DE FOTOS:');
  console.log('====================================================');
  console.log(`Fotos exatas próprias atualizadas: ${corrigidos}`);
  console.log(`Produtos com fotos indevidas limpas: ${limposSemFoto}`);
}

sincronizarEFaxinarFotos();
