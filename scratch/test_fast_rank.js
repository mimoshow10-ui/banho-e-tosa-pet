const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function testFastSalesRank() {
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;

  const d = new Date();
  d.setDate(d.getDate() - 100);
  const dataInicial = d.toISOString().slice(0, 10);
  const dataFinal = new Date().toISOString().slice(0, 10);

  console.log(`Buscando últimos 1000 pedidos dos últimos 100 dias (${dataInicial} a ${dataFinal})...`);
  let pedidos = [];
  for (let p = 1; p <= 10; p++) {
    const res = await fetch(`https://api.bling.com.br/Api/v3/pedidos/vendas?dataInicial=${dataInicial}&dataFinal=${dataFinal}&limite=100&pagina=${p}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) break;
    const json = await res.json();
    const data = json.data || [];
    if (data.length === 0) break;
    pedidos.push(...data);
    await sleep(200);
  }

  console.log('Total de pedidos obtidos para análise de vendas:', pedidos.length);

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

  const ranking = Object.values(vendasMap).sort((a, b) => b.qtd - a.qtd);

  const palavrasExcluir = ['infantil', 'decoração', 'decoracao', 'decorac', 'mdf'];
  const petRanking = ranking.filter(p => {
    const nomeLower = (p.nome || '').toLowerCase();
    return !palavrasExcluir.some(w => nomeLower.includes(w));
  });

  console.log('Total SKUs PET ranqueados:', petRanking.length);
  console.log('\nTop 15 PET mais vendidos:');
  petRanking.slice(0, 15).forEach((p, idx) => {
    console.log(` #${idx+1} | SKU: ${p.sku} | Qtd: ${p.qtd} | ${p.nome}`);
  });
}

testFastSalesRank();
