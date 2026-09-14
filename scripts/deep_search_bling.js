const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function deepSearchBling() {
  const { data: categorias } = await supabase.from('categorias').select('id, nome, slug');
  const catMap = {};
  categorias.forEach(c => { catMap[c.slug] = c.id; });

  const { data: cfgTokens } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const { data: cfgCreds } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').single();

  const tokenData = cfgTokens?.valor;
  const credsData = cfgCreds?.valor;

  if (!tokenData?.refresh_token || !credsData?.client_id || !credsData?.client_secret) {
    console.error('Credenciais ausentes');
    return;
  }

  const credentials = Buffer.from(`${credsData.client_id}:${credsData.client_secret}`).toString('base64');

  // Atualizar token
  const tokenRes = await fetch('https://api.bling.com.br/Api/v3/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenData.refresh_token,
    }),
  });

  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) {
    console.error('Falha ao renovar token:', tokenJson);
    return;
  }

  const token = tokenJson.access_token;
  await supabase.from('configuracoes').upsert({
    chave: 'bling_tokens',
    valor: tokenJson,
  }, { onConflict: 'chave' });

  console.log('✓ Token Bling renovado com sucesso!');
  console.log('=== Realizando varredura no Bling (páginas 1 a 30) ===');
  
  let importados = 0;

  for (let pag = 1; pag <= 30; pag++) {
    try {
      const res = await fetch(`https://api.bling.com.br/Api/v3/produtos?pagina=${pag}&limite=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      const list = json?.data || [];
      if (list.length === 0) {
        console.log(`Fim dos produtos no Bling na página ${pag}.`);
        break;
      }

      console.log(`Página ${pag}: ${list.length} produtos recebidos...`);

      for (const p of list) {
        const name = (p.nome || '').toLowerCase();
        let targetSlug = null;

        if (name.includes('mascara') || name.includes('máscara')) {
          targetSlug = 'mascaras';
        } else if (name.includes('bolsa') || name.includes('mochila') || name.includes('necessaire') || name.includes('estojo')) {
          targetSlug = 'bolsas';
        } else if (name.includes('jogo') || name.includes('memoria') || name.includes('memória') || name.includes('tabuleiro') || name.includes('domino') || name.includes('dominó')) {
          targetSlug = 'jogos';
        } else if (name.includes('didatico') || name.includes('didático') || name.includes('pedagogico') || name.includes('pedagógico') || name.includes('educativo') || name.includes('alfabeto') || name.includes('numero') || name.includes('número')) {
          targetSlug = 'didatico';
        } else if (name.includes('quebra-cabeça') || name.includes('quebra cabeça') || name.includes('quebra cabeca') || name.includes('quebracabeca') || name.includes('puzzle') || name.includes('montar')) {
          targetSlug = 'quebra-cabeca';
        } else if (name.includes('faixa') || name.includes('cenario') || name.includes('cenário')) {
          targetSlug = 'faixas-decorativas';
        } else if (name.includes('tiara')) {
          targetSlug = 'tiaras';
        } else if (name.includes('quadro') && name.includes('mdf')) {
          targetSlug = 'quadros-mdf';
        } else if (name.includes('quadro') || name.includes('placa')) {
          targetSlug = 'quadros-impressos';
        } else if (name.includes('decor') || name.includes('ambiente') || name.includes('enfeite') || name.includes('luminaria') || name.includes('luminária')) {
          targetSlug = 'decor-ambientes';
        }

        if (targetSlug && catMap[targetSlug]) {
          try {
            const detRes = await fetch(`https://api.bling.com.br/Api/v3/produtos/${p.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const detJson = await detRes.json();
            const prodCompleto = detJson?.data || p;

            const ext = prodCompleto.midia?.imagens?.externas?.map(i => i.link) || [];
            const int = prodCompleto.midia?.imagens?.internas?.map(i => i.link) || [];
            const imagens = [...ext, ...int].filter(Boolean);

            let estoque = 0;
            try {
              const estRes = await fetch(`https://api.bling.com.br/Api/v3/estoques/saldos?idsProdutos[]=${p.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const estJson = await estRes.json();
              estoque = estJson?.data?.[0]?.saldoFisicoTotal || 0;
            } catch {}

            const baseSlug = slugify(p.nome || `produto-${p.id}`);
            const slugFinal = `${baseSlug}-${p.codigo || p.id}`.toLowerCase();

            await supabase.from('produtos').upsert({
              bling_id: String(p.id),
              nome: p.nome,
              slug: slugFinal,
              descricao: prodCompleto.descricaoCurta || prodCompleto.descricao || p.nome,
              descricao_curta: prodCompleto.descricaoCurta || '',
              preco: Number(p.preco || 0),
              preco_promocional: p.precoPromocional ? Number(p.precoPromocional) : null,
              codigo_barras: p.gtin || '',
              categoria_id: catMap[targetSlug],
              imagens: imagens,
              estoque: estoque,
              ativo: true,
            }, { onConflict: 'bling_id' });

            importados++;
            console.log(`✓ [${targetSlug}] ${p.nome} (${imagens.length} fotos)`);
          } catch (e) {
            console.error(`Erro ao importar ${p.id}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.error(`Erro na página ${pag}:`, e.message);
      break;
    }
  }

  console.log(`\n======================================================`);
  console.log(`✓ Varredura concluída: ${importados} produtos importados/atualizados no Supabase!`);
  console.log(`======================================================`);
}

deepSearchBling().catch(console.error);
