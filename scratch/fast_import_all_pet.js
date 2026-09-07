const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

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
  } catch {}
  return token;
}

async function runFastImport() {
  console.log('⚡ Iniciando importação ultra-rápida de todos os produtos PET do Bling...');
  const token = await getValidToken();
  if (!token) {
    console.error('❌ Token do Bling inválido.');
    return;
  }

  const exclude = [
    'infantil', 'decorac', 'decoração', 'decorativo', 'decorativa', 
    'mdf', 'quadro', 'placa', 'relogio', 'relógio', 'espelho', 
    'maternidade', 'cozinha', 'cachaça', 'cerveja', 'churrasco', 'cantinho', 'sala'
  ];

  let page = 1;
  let totalProcessados = 0;
  let totalInseridosOuAtualizados = 0;

  while (true) {
    console.log(`\n📥 Buscando página ${page} do Bling (100 itens)...`);
    const res = await fetch(`https://api.bling.com.br/Api/v3/produtos?limite=100&pagina=${page}&situacao=A`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
      console.log(`Status ${res.status} retornado. Finalizando busca.`);
      break;
    }

    const json = await res.json();
    const items = json.data || [];
    if (items.length === 0) {
      console.log('Nenhum mais produto encontrado nesta página. Finalizado!');
      break;
    }

    totalProcessados += items.length;

    // Filtrar apenas produtos PET
    const petItems = items.filter(item => {
      const nomeLower = (item.nome || '').toLowerCase();
      return !exclude.some(w => nomeLower.includes(w));
    });

    if (petItems.length > 0) {
      // Montar payloads para upsert em lote
      const batchPayloads = petItems.map(item => {
        const baseSlug = (item.nome || 'produto').toLowerCase()
          .replace(/ /g, '-')
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9-]/g, '');
        const slug = `${baseSlug}-${item.id}`;

        const rawEstoque = typeof item.estoque === 'number' 
          ? item.estoque 
          : (item.estoque?.saldoVirtualTotal ?? item.estoque?.saldoFisicoTotal ?? 0);
        const estoqueVal = Math.max(0, Math.round(Number(rawEstoque) || 0));

        return {
          bling_id: String(item.id),
          codigo_barras: item.codigo || null,
          nome: item.nome,
          preco: Number(item.preco || 0),
          estoque: estoqueVal,
          slug: slug,
          ativo: true,
          descricao_curta: item.descricaoCurta || '',
          imagens: item.imagemURL ? [item.imagemURL] : []
        };
      });

      // Upsert em lote no Supabase
      const { data, error } = await supabase.from('produtos').upsert(batchPayloads, { onConflict: 'bling_id' });

      if (error) {
        console.error(`❌ Erro no upsert do lote da página ${page}:`, error.message);
      } else {
        totalInseridosOuAtualizados += batchPayloads.length;
        console.log(`✅ Lote da página ${page}: ${batchPayloads.length} produtos PET sincronizados com sucesso!`);
      }
    } else {
      console.log(`ℹ️ Página ${page}: 0 produtos PET (todos filtrados como não-pet).`);
    }

    if (items.length < 100) break;
    page++;
    await sleep(200);
  }

  // Verificar o total final de produtos na tabela
  const { count } = await supabase.from('produtos').select('*', { count: 'exact', head: true });

  console.log('\n==================================================');
  console.log(`🎉 IMPORTAÇÃO CONCLUÍDA COM SUCESSO!`);
  console.log(`Total de itens analisados no Bling: ${totalProcessados}`);
  console.log(`Total de produtos PET sincronizados neste lote: ${totalInseridosOuAtualizados}`);
  console.log(`📊 TOTAL DE PRODUTOS CADASTRADOS NO BANCO DE DADOS DA LOJA: ${count}`);
}

runFastImport();
