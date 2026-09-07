const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

async function removeNonPetProducts() {
  console.log('🚀 Buscando e removendo produtos não-pet do banco de dados...');

  const nonPetKeywords = [
    'folha', 'folhas', 
    'vaso', 'vasos', 
    'quadro', 'quadros', 
    'placa', 'placas', 
    'relogio', 'relógio', 
    'espelho', 'maternidade', 
    'cachaça', 'cerveja', 'churrasco', 
    'artesanato', 'escolar'
  ];

  const { data: prods } = await supabase.from('produtos').select('id, nome, parent_id');
  
  const toDelete = (prods || []).filter(p => {
    const nomeLower = (p.nome || '').toLowerCase();
    return nonPetKeywords.some(kw => nomeLower.includes(kw));
  });

  console.log(`❌ Encontrados ${toDelete.length} produtos não-pet para remoção.`);

  if (toDelete.length > 0) {
    for (const p of toDelete) {
      console.log(`  🗑️ Removendo: ${p.nome} (ID: ${p.id})`);
    }

    const idsToDelete = toDelete.map(p => p.id);

    // Deletar da tabela produtos
    const { error } = await supabase.from('produtos').delete().in('id', idsToDelete);

    if (error) {
      console.error('Erro ao deletar produtos:', error.message);
    } else {
      console.log(`✅ ${idsToDelete.length} produtos não-pet removidos com sucesso do banco de dados!`);
    }

    // Limpar IDs das Novidades/Destaques em configuracoes caso estivessem lá
    const { data: vitrineCfg } = await supabase.from('configuracoes').select('*').eq('chave', 'vitrine_destaques').single();
    if (vitrineCfg?.valor?.novidades) {
      const novidadesFiltradas = vitrineCfg.valor.novidades.filter((id) => !idsToDelete.includes(id));
      const maisVendidosFiltrados = (vitrineCfg.valor.mais_vendidos || []).filter((id) => !idsToDelete.includes(id));
      await supabase.from('configuracoes').update({
        valor: { novidades: novidadesFiltradas, mais_vendidos: maisVendidosFiltrados }
      }).eq('chave', 'vitrine_destaques');
      console.log('✅ Vitrines atualizadas sem os IDs removidos.');
    }
  } else {
    console.log('✨ Nenhum produto não-pet encontrado no banco de dados.');
  }

  const { count } = await supabase.from('produtos').select('*', { count: 'exact', head: true });
  console.log(`📊 TOTAL DE PRODUTOS RESTANTES NO BANCO DE DADOS DA LOJA: ${count}`);
}

removeNonPetProducts();
