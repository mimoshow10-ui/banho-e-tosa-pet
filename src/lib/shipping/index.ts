import { supabase } from '@/lib/supabase';
import { Transportadora, OpcaoFrete, ItemCarrinho } from '@/lib/types/checkout';

export async function getTransportadorasAtivas(): Promise<Transportadora[]> {
  try {
    const { data: config } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'transportadoras')
      .single();

    const lista: Transportadora[] = config?.valor || [];
    return lista.filter(t => t.ativo).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  } catch {
    return [];
  }
}

export async function calcularFretesCarrinho(
  itens: ItemCarrinho[],
  cepDestino: string
): Promise<OpcaoFrete[]> {
  const transportadoras = await getTransportadorasAtivas();
  const cepLimpo = cepDestino.replace(/\D/g, '');

  if (cepLimpo.length !== 8 || itens.length === 0) {
    return [];
  }

  // Peso total consolidado (em kg)
  const pesoTotal = itens.reduce((acc, item) => {
    const p = item.peso_kg || 0.2; // 200g padrão se não cadastrado
    return acc + p * item.quantidade;
  }, 0);

  // Valor total dos produtos no carrinho
  const valorTotalProdutos = itens.reduce((acc, item) => {
    return acc + item.preco_unitario * item.quantidade;
  }, 0);

  const opcoes: OpcaoFrete[] = [];

  for (const trans of transportadoras) {
    try {
      if (trans.tipo_integracao === 'retirada') {
        opcoes.push({
          id: `retirada-${trans.id}`,
          transportadora_id: trans.id,
          nome: trans.nome_exibicao || 'Retirada no Local',
          nome_transportadora: 'Loja Física',
          valor: 0,
          prazo_dias: 0,
          prazo_estimado_texto: 'Pronto para retirada após confirmação',
          descricao: trans.instrucoes_retirada || 'Retire gratuitamente em nosso endereço.',
          is_gratis: true,
        });
      } else if (trans.tipo_integracao === 'jadlog' || trans.tipo_integracao === 'melhorenvio' || trans.tipo_integracao === 'frenet') {
        const uf = await buscarUfPorCep(cepLimpo);
        const eProximo = ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'].includes(uf);
        let valorTrans = (eProximo ? 18.90 : 28.90) + (pesoTotal > 1 ? (pesoTotal - 1) * 5 : 0) + (trans.valor_adicional_reais || 0);
        let prazoTrans = (eProximo ? 3 : 6) + (trans.prazo_adicional_dias || 0);

        if (trans.desconto_percentual) valorTrans *= (1 - trans.desconto_percentual / 100);

        opcoes.push({
          id: `trans-${trans.id}`,
          transportadora_id: trans.id,
          nome: trans.nome_exibicao || `${trans.nome} (Transportadora Privada)`,
          nome_transportadora: trans.nome,
          valor: Math.max(0, valorTrans),
          prazo_dias: prazoTrans,
          prazo_estimado_texto: `Chegará entre ${prazoTrans} e ${prazoTrans + 2} dias úteis`,
          descricao: 'Coleta e entrega expressa via transportadora privada.',
        });
      } else if (trans.tipo_integracao === 'motoboy') {
        // Exemplo: Entrega expressa por motoboy para entregas locais
        const valorBase = 12.00 + (trans.valor_adicional_reais || 0);
        opcoes.push({
          id: `motoboy-${trans.id}`,
          transportadora_id: trans.id,
          nome: trans.nome_exibicao || 'Entrega via Motoboy',
          nome_transportadora: trans.nome || 'Motoboy Express',
          valor: valorBase,
          prazo_dias: 1 + (trans.prazo_adicional_dias || 0),
          prazo_estimado_texto: 'Chega em até 24 horas úteis',
          descricao: 'Entrega rápida e segura direto na sua porta.',
        });
      } else {
        // Integração Padrão (Correios / Transportadoras / Tabela Inteligente)
        const uf = await buscarUfPorCep(cepLimpo);
        const sudesteSul = ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'];
        const eProximo = sudesteSul.includes(uf);

        // PAC / Econômico
        let valorPac = (eProximo ? 14.90 : 24.90) + (pesoTotal > 1 ? (pesoTotal - 1) * 4 : 0);
        let prazoPac = (eProximo ? 4 : 8) + (trans.prazo_adicional_dias || 0);

        // Aplicar acréscimos/descontos configurados no admin
        if (trans.valor_adicional_reais) valorPac += trans.valor_adicional_reais;
        if (trans.desconto_percentual) valorPac *= (1 - trans.desconto_percentual / 100);

        // Regra de Frete Grátis acima de R$ 149
        const isFreteGratis = valorTotalProdutos >= 149;

        opcoes.push({
          id: `economica-${trans.id}`,
          transportadora_id: trans.id,
          nome: trans.nome_exibicao || `${trans.nome} (Econômica)`,
          nome_transportadora: trans.nome,
          valor: isFreteGratis ? 0 : Math.max(0, valorPac),
          prazo_dias: prazoPac,
          prazo_estimado_texto: `Chegará entre ${prazoPac} e ${prazoPac + 2} dias úteis`,
          descricao: isFreteGratis ? 'Promoção de Frete Grátis aplicada!' : 'Entrega garantida pelos Correios/Transportadora',
          is_gratis: isFreteGratis,
        });

        // Sedex / Expressa
        let valorSedex = valorPac + (eProximo ? 10 : 20);
        let prazoSedex = Math.max(1, Math.floor(prazoPac / 2));

        opcoes.push({
          id: `expressa-${trans.id}`,
          transportadora_id: trans.id,
          nome: `${trans.nome_exibicao || trans.nome} (Expressa)`,
          nome_transportadora: trans.nome,
          valor: Math.max(0, valorSedex),
          prazo_dias: prazoSedex,
          prazo_estimado_texto: `Chegará em ${prazoSedex} a ${prazoSedex + 1} dias úteis`,
          descricao: 'Opção mais rápida com rastreamento prioritário.',
        });
      }
    } catch {
      // Trata erro isoladamente por transportadora sem quebrar a consulta inteira
    }
  }

  return opcoes;
}

async function buscarUfPorCep(cep: string): Promise<string> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    return data.uf || 'SP';
  } catch {
    return 'SP';
  }
}
