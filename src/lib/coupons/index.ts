import { supabase } from '@/lib/supabase';
import { Cupom, ResultadoValidacaoCupom } from '@/lib/types/coupon';
import { ItemCarrinho } from '@/lib/types/checkout';

export async function getCupons(): Promise<Cupom[]> {
  try {
    const { data: config } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'cupons_db')
      .single();

    return config?.valor || [];
  } catch {
    return [];
  }
}

export async function validarCupomNoServidor(
  codigoDigitado: string,
  itens: ItemCarrinho[],
  valorFrete: number = 0
): Promise<ResultadoValidacaoCupom> {
  if (!codigoDigitado || typeof codigoDigitado !== 'string' || !Array.isArray(itens) || itens.length === 0) {
    return { valido: false, erro: 'Cupom ou carrinho inválido.', descontoAplicado: 0, subtotalElegivel: 0 };
  }

  const codigoNormalizado = codigoDigitado.trim().toUpperCase();
  const cupons = await getCupons();
  const cupom = cupons.find(c => c.codigo.toUpperCase() === codigoNormalizado);

  if (!cupom) {
    return { valido: false, erro: 'Cupom de desconto não encontrado.', descontoAplicado: 0, subtotalElegivel: 0 };
  }

  // 1. Status Ativo
  if (!cupom.ativo) {
    return { valido: false, erro: 'Este cupom não está mais ativo.', descontoAplicado: 0, subtotalElegivel: 0 };
  }

  // 2. Data de Validade (Relógio do Servidor)
  const agora = Date.now();
  if (cupom.data_inicio) {
    const inicio = new Date(cupom.data_inicio).getTime();
    if (!isNaN(inicio) && agora < inicio) {
      return { valido: false, erro: 'Este cupom ainda não está válido.', descontoAplicado: 0, subtotalElegivel: 0 };
    }
  }

  if (cupom.data_fim) {
    const fim = new Date(cupom.data_fim).getTime();
    if (!isNaN(fim) && agora > fim) {
      return { valido: false, erro: 'Este cupom já expirou.', descontoAplicado: 0, subtotalElegivel: 0 };
    }
  }

  // 3. Limite de Usos Total
  if (cupom.limite_usos_total && cupom.usos_realizados >= cupom.limite_usos_total) {
    return { valido: false, erro: 'O limite de utilizações deste cupom foi atingido.', descontoAplicado: 0, subtotalElegivel: 0 };
  }

  // 4. Filtrar itens elegíveis no carrinho
  const itensElegiveis = itens.filter((item) => {
    // Se o cupom não permite produtos já promocionais e o item tem desconto
    if (!cupom.permitir_produtos_promocionais) {
      // Consideramos se o item estiver com tag promocional ativa
    }

    // Exclusões
    if (cupom.exclusoes_ids && cupom.exclusoes_ids.includes(item.id)) {
      return false;
    }

    // Elegibilidade por Tipo
    if (cupom.tipo_elegibilidade === 'todos') {
      return true;
    }

    if (cupom.tipo_elegibilidade === 'produtos' && cupom.elegiveis_ids) {
      return cupom.elegiveis_ids.includes(item.id);
    }

    if (cupom.tipo_elegibilidade === 'skus' && cupom.elegiveis_ids && item.sku) {
      return cupom.elegiveis_ids.includes(item.sku);
    }

    return true;
  });

  if (itensElegiveis.length === 0) {
    return {
      valido: false,
      erro: 'Nenhum dos produtos no seu carrinho é elegível para este cupom.',
      descontoAplicado: 0,
      subtotalElegivel: 0,
    };
  }

  // 5. Subtotal elegível
  const subtotalElegivel = itensElegiveis.reduce((sum, i) => sum + i.preco_unitario * i.quantidade, 0);

  // 6. Compra mínima
  if (cupom.compra_minima_reais && subtotalElegivel < cupom.compra_minima_reais) {
    return {
      valido: false,
      erro: `Compra mínima de R$ ${cupom.compra_minima_reais.toFixed(2).replace('.', ',')} para usar este cupom.`,
      descontoAplicado: 0,
      subtotalElegivel,
    };
  }

  // 7. Calcular o desconto
  let desconto = 0;

  if (cupom.tipo_desconto === 'percentual') {
    desconto = (subtotalElegivel * cupom.valor_desconto) / 100;
    if (cupom.desconto_maximo_reais && desconto > cupom.desconto_maximo_reais) {
      desconto = cupom.desconto_maximo_reais;
    }
  } else if (cupom.tipo_desconto === 'fixo') {
    desconto = Math.min(subtotalElegivel, cupom.valor_desconto);
  } else if (cupom.tipo_desconto === 'frete_gratis') {
    desconto = Math.min(valorFrete, cupom.valor_desconto || valorFrete);
  }

  return {
    valido: true,
    cupom,
    descontoAplicado: Math.max(0, desconto),
    subtotalElegivel,
    mensagem: `Cupom ${cupom.codigo} aplicado com sucesso!`,
  };
}
