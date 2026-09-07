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

async function main() {
  const token = await getValidToken();
  if (!token) {
    console.error('Token do Bling não encontrado ou inválido');
    return;
  }

  const d = new Date();
  d.setDate(d.getDate() - 100);
  const dataInicial = d.toISOString().slice(0, 10);
  const dataFinal = new Date().toISOString().slice(0, 10);

  console.log(`Buscando pedidos de vendas de ${dataInicial} até ${dataFinal}...`);

  let pagina = 1;
  let todosPedidos = [];

  while (true) {
    console.log(`Buscando pedidos pagina ${pagina}...`);
    const res = await fetch(`https://api.bling.com.br/Api/v3/pedidos/vendas?dataInicial=${dataInicial}&dataFinal=${dataFinal}&limite=100&pagina=${pagina}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
      console.error(`Erro ao buscar pedidos pagina ${pagina}:`, res.status);
      break;
    }

    const json = await res.json();
    const lista = json.data || [];
    if (lista.length === 0) break;

    todosPedidos.push(...lista);
    if (lista.length < 100) break;
    pagina++;
    await sleep(350);
  }

  console.log(`Total de pedidos de vendas encontrados nos últimos 100 dias: ${todosPedidos.length}`);

  // Mapear vendas por produto (SKU ou ID do Bling)
  const vendasPorProduto = {}; // key -> { sku, id, nome, quantidadeVendida, totalValor }

  console.log('Extraindo itens de cada pedido...');
  for (let i = 0; i < todosPedidos.length; i++) {
    const p = todosPedidos[i];
    if (i % 25 === 0) {
      console.log(`Processando pedido ${i + 1}/${todosPedidos.length}...`);
    }

    const resDet = await fetch(`https://api.bling.com.br/Api/v3/pedidos/vendas/${p.id}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (resDet.ok) {
      const detJson = await resDet.json();
      const itens = detJson.data?.itens || [];

      for (const item of itens) {
        const sku = (item.codigo || String(item.produto?.id || item.id || '')).trim();
        const nome = item.descricao || item.nome || 'Produto sem nome';
        const qtd = Number(item.quantidade || 0);

        if (!sku) continue;

        if (!vendasPorProduto[sku]) {
          vendasPorProduto[sku] = {
            sku,
            blingId: item.produto?.id || null,
            nome,
            quantidadeVendida: 0
          };
        }

        vendasPorProduto[sku].quantidadeVendida += qtd;
        if (!vendasPorProduto[sku].nome && nome) {
          vendasPorProduto[sku].nome = nome;
        }
      }
    }
    await sleep(350);
  }

  const produtosOrdenados = Object.values(vendasPorProduto).sort((a, b) => b.quantidadeVendida - a.quantidadeVendida);

  console.log(`\nTotal de SKUs distintos vendidos: ${produtosOrdenados.length}`);

  // Filtros de exclusão: infantil, decoração, mdf
  const palavrasExcluir = ['infantil', 'decoração', 'decoracao', 'decorac', 'mdf'];

  const filtrados = produtosOrdenados.filter(p => {
    const nomeLower = (p.nome || '').toLowerCase();
    return !palavrasExcluir.some(palavra => nomeLower.includes(palavra));
  });

  console.log(`Total de produtos PET após aplicar filtros (excluindo infantil, decoração, mdf): ${filtrados.length}`);

  const top100 = filtrados.slice(0, 100);

  console.log('\nTop 10 mais vendidos (exemplo):');
  top100.slice(0, 10).forEach((p, idx) => {
    console.log(` #${idx + 1} | SKU: ${p.sku} | Qtd Vendida: ${p.quantidadeVendida} | ${p.nome}`);
  });
}

main();
