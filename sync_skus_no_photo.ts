import { createClient } from '@supabase/supabase-js';
import { uploadBlingImagesToSupabase } from './src/lib/upload-images';

const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

async function getOrRefreshBlingToken() {
  const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_tokens').maybeSingle();
  let token = cfg?.valor?.access_token;
  const refreshToken = cfg?.valor?.refresh_token;

  const { data: creds } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_credentials').maybeSingle();
  const clientId = creds?.valor?.client_id;
  const clientSecret = creds?.valor?.client_secret;

  if (refreshToken && clientId && clientSecret) {
    try {
      console.log('🔄 Renovando Token do Bling via Refresh Token...');
      const res = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
          'Accept': '1.0'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      const data = await res.json();
      if (data.access_token) {
        token = data.access_token;
        await supabase.from('configuracoes').upsert({
          chave: 'bling_tokens',
          valor: {
            access_token: data.access_token,
            refresh_token: data.refresh_token || refreshToken
          }
        }, { onConflict: 'chave' });
        console.log('✅ Token do Bling renovado com sucesso!');
      } else {
        console.log('⚠️ Resposta de erro do refresh:', JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('❌ Erro ao renovar token:', err.message);
    }
  }

  return token;
}

async function syncSkusWithoutPhotoFromBling() {
  console.log('=== INICIANDO ATUALIZAÇÃO FORÇADA DE PRODUTOS SEM FOTO NO BLING ===\n');

  let token = await getOrRefreshBlingToken();

  if (!token) {
    console.error('❌ Token do Bling não disponível. Acesse /admin/configuracoes e clique em "Autorizar no Bling".');
    return;
  }

  // Buscar todos os produtos sem imagem no Supabase
  let page = 0;
  const pageSize = 1000;
  const prodsSemFoto: any[] = [];

  while (true) {
    const { data: chunk, error } = await supabase
      .from('produtos')
      .select('id, nome, codigo_barras, bling_id, imagens')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error || !chunk || chunk.length === 0) break;

    for (const p of chunk) {
      const hasImg = Array.isArray(p.imagens) && p.imagens.length > 0 && typeof p.imagens[0] === 'string' && p.imagens[0].length > 0;
      if (!hasImg) {
        prodsSemFoto.push(p);
      }
    }

    if (chunk.length < pageSize) break;
    page++;
  }

  console.log(`Encontrados ${prodsSemFoto.length} produtos sem foto no banco de dados.\n`);

  if (prodsSemFoto.length === 0) {
    console.log('🎉 Todos os produtos do banco já possuem fotos cadastradas!');
    return;
  }

  let atualizadosCount = 0;
  let semFotoBlingCount = 0;
  let erroCount = 0;

  for (let i = 0; i < prodsSemFoto.length; i++) {
    const prod = prodsSemFoto[i];
    let prodCompleto: any = null;

    try {
      // 1. Tentar busca direta por bling_id se disponível
      if (prod.bling_id && String(prod.bling_id).trim() !== '') {
        const directReq = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prod.bling_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (directReq.status === 401) {
          console.log('🛑 Token expirou. Renovando token...');
          token = await getOrRefreshBlingToken();
          if (!token) break;
          i--; // Tentar novamente esse item
          continue;
        }

        if (directReq.ok) {
          const json = await directReq.json();
          prodCompleto = json.data;
        }
      }

      // 2. Tentar busca por codigo_barras se não achou por bling_id
      if (!prodCompleto && prod.codigo_barras && String(prod.codigo_barras).trim() !== '') {
        const searchRes = await fetch(`https://api.bling.com.br/Api/v3/produtos?pagina=1&limite=5&pesquisa=${encodeURIComponent(prod.codigo_barras)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (searchRes.status === 401) {
          console.log('🛑 Token expirou. Renovando token...');
          token = await getOrRefreshBlingToken();
          if (!token) break;
          i--; // Tentar novamente esse item
          continue;
        }

        if (searchRes.ok) {
          const searchJson = await searchRes.json();
          const itemBling = searchJson.data?.find(
            (p: any) => p.codigo && p.codigo.trim().toLowerCase() === String(prod.codigo_barras).trim().toLowerCase()
          ) || searchJson.data?.[0];

          if (itemBling && itemBling.id) {
            const detalhesReq = await fetch(`https://api.bling.com.br/Api/v3/produtos/${itemBling.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (detalhesReq.ok) {
              const detalhesJson = await detalhesReq.json();
              prodCompleto = detalhesJson.data || itemBling;
            }
          }
        }
      }

      if (!prodCompleto) {
        semFotoBlingCount++;
        continue;
      }

      // Extrair links de imagens da mídia do Bling
      let imagensBling: string[] = [];
      const ext = prodCompleto.midia?.imagens?.externas?.map((img: any) => img.link) || [];
      const int = prodCompleto.midia?.imagens?.internas?.map((img: any) => img.link) || [];
      const urlImgs = prodCompleto.midia?.imagens?.imagensURL || [];
      imagensBling = [...ext, ...int, ...urlImgs].filter(Boolean);

      if (imagensBling.length === 0 && Array.isArray(prodCompleto.midia)) {
        imagensBling = prodCompleto.midia.map((m: any) => m.url || m.link).filter(Boolean);
      }

      if (imagensBling.length === 0 && prodCompleto.imagemURL) {
        imagensBling = [prodCompleto.imagemURL];
      }

      if (imagensBling.length > 0) {
        let imagensPermanentes: string[] = [];
        try {
          imagensPermanentes = await uploadBlingImagesToSupabase(imagensBling, String(prodCompleto.id || prod.id));
        } catch {
          imagensPermanentes = imagensBling;
        }
        const imagensFinais = (imagensPermanentes && imagensPermanentes.length > 0) ? imagensPermanentes : imagensBling;

        await supabase.from('produtos').update({
          imagens: imagensFinais,
          bling_id: String(prodCompleto.id)
        }).eq('id', prod.id);

        atualizadosCount++;
        console.log(`✅ [${atualizadosCount}] (${i + 1}/${prodsSemFoto.length}) Atualizado com ${imagensFinais.length} foto(s): "${prod.nome}"`);
      } else {
        semFotoBlingCount++;
      }

      // Pequena pausa para evitar limites de taxa da API do Bling
      await new Promise(res => setTimeout(res, 100));

    } catch (err: any) {
      erroCount++;
      console.error(`❌ Erro ao processar "${prod.nome}":`, err.message);
    }
  }

  console.log(`\n==================================================`);
  console.log(`🎉 PROCESSO FINALIZADO!`);
  console.log(`📸 Produtos atualizados com fotos: ${atualizadosCount}`);
  console.log(`⚪ Produtos sem foto no Bling: ${semFotoBlingCount}`);
  console.log(`⚠️ Erros/Falhas: ${erroCount}`);
  console.log(`==================================================`);
}

syncSkusWithoutPhotoFromBling();
