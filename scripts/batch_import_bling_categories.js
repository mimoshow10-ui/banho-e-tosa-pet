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

async function importFromBlingInBatch() {
  console.log('=== 1. Obter Categorias do Supabase ===');
  const { data: categorias } = await supabase.from('categorias').select('id, nome, slug');
  const catMap = {};
  categorias.forEach(c => { catMap[c.slug] = c.id; });

  const { data: cfgTokens } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfgTokens?.valor?.access_token;
  if (!token) {
    console.error('Token Bling não encontrado.');
    return;
  }

  console.log('=== 2. Varrer produtos do Bling em Lote ===');
  let pagina = 1;
  const produtosBlingParaImportar = [];

  // Varrer até 10 páginas do Bling (1000 produtos)
  while (pagina <= 10) {
    console.log(`Consultando página ${pagina} do Bling...`);
    try {
      const res = await fetch(`https://api.bling.com.br/Api/v3/produtos?pagina=${pagina}&limite=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      const list = json?.data || [];
      if (list.length === 0) break;

      for (const p of list) {
        const name = (p.nome || '').toLowerCase();
        let targetSlug = null;

        if (name.includes('mascara') || name.includes('máscara')) {
          targetSlug = 'mascaras';
        } else if (name.includes('quebra-cabeça') || name.includes('quebra cabeça') || name.includes('quebra cabeca') || name.includes('montar')) {
          targetSlug = 'quebra-cabeca';
        } else if (name.includes('jogo') || name.includes('jogos')) {
          targetSlug = 'jogos';
        } else if (name.includes('tiara')) {
          targetSlug = 'tiaras';
        } else if (name.includes('bolsa')) {
          targetSlug = 'bolsas';
        } else if (name.includes('didatico') || name.includes('didático') || name.includes('educativo')) {
          targetSlug = 'didatico';
        } else if ((name.includes('quadro') && name.includes('mdf')) || (name.includes('placa') && name.includes('mdf')) || name.includes('dinossauro')) {
          targetSlug = 'quadros-mdf';
        } else if (name.includes('quadro') || name.includes('placa')) {
          targetSlug = 'quadros-impressos';
        } else if (name.includes('decor') || name.includes('ambiente') || name.includes('enfeite')) {
          targetSlug = 'decor-ambientes';
        } else if (name.includes('faixa')) {
          targetSlug = 'faixas-decorativas';
        }

        if (targetSlug && catMap[targetSlug]) {
          produtosBlingParaImportar.push({
            bling: p,
            targetSlug,
            categoria_id: catMap[targetSlug]
          });
        }
      }

      if (list.length < 100) break;
      pagina++;
    } catch (err) {
      console.error(`Erro ao consultar página ${pagina}:`, err.message);
      break;
    }
  }

  console.log(`\n=== Total de produtos Bling identificados para importação: ${produtosBlingParaImportar.length} ===`);
  produtosBlingParaImportar.forEach(item => {
    console.log(`▶ [${item.targetSlug}] SKU: ${item.bling.codigo} - ${item.bling.nome}`);
  });

  if (produtosBlingParaImportar.length === 0) {
    console.log('Nenhum produto adicional identificado nas páginas consultadas.');
    return;
  }

  console.log('\n=== 3. Buscando detalhes, imagens e importando no Supabase ===');
  let importados = 0;

  for (const item of produtosBlingParaImportar) {
    const p = item.bling;
    try {
      // Buscar detalhes do produto no Bling para pegar imagens
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

      const produtoData = {
        bling_id: String(p.id),
        nome: p.nome,
        slug: slugFinal,
        descricao: prodCompleto.descricaoCurta || prodCompleto.descricao || p.nome,
        descricao_curta: prodCompleto.descricaoCurta || '',
        preco: Number(p.preco || 0),
        preco_promocional: p.precoPromocional ? Number(p.precoPromocional) : null,
        codigo_barras: p.gtin || '',
        categoria_id: item.categoria_id,
        imagens: imagens,
        estoque: estoque,
        ativo: true,
      };

      const { data: upsertData, error: upsertErr } = await supabase
        .from('produtos')
        .upsert(produtoData, { onConflict: 'bling_id' })
        .select();

      if (upsertErr) {
        // Tentar upsert por slug se o conflito for slug
        console.error(`Erro ao importar ${p.nome}:`, upsertErr.message);
      } else {
        importados++;
        console.log(`✓ Importado com sucesso: [${item.targetSlug}] ${p.nome} (${imagens.length} fotos)`);
      }
    } catch (e) {
      console.error(`Erro no produto ${p.id}:`, e.message);
    }
  }

  console.log(`\n==============================================`);
  console.log(`✓ SUCESSO: ${importados} produtos importados e categorizados no Supabase!`);
  console.log(`==============================================`);
}

importFromBlingInBatch().catch(console.error);
