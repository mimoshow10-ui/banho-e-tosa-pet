export interface Cupom {
  id: string;
  nome_interno: string;
  codigo: string; // Em caixa alta sem espaços (ex: CRIANCAS10)
  tipo_desconto: 'percentual' | 'fixo' | 'frete_gratis';
  valor_desconto: number; // Ex: 10 (%) ou 20 (R$)
  desconto_maximo_reais?: number | null; // Teto para percentuais
  compra_minima_reais?: number | null; // Pedido mínimo
  data_inicio?: string | null;
  data_fim?: string | null;
  ativo: boolean;
  limite_usos_total?: number | null;
  usos_realizados: number;
  permitir_produtos_promocionais: boolean; // SIM / NÃO
  permitir_acumulo?: boolean; // SIM / NÃO (Permite ser acumulado com outros cupons)
  tipo_elegibilidade: 'todos' | 'grupos' | 'subgrupos' | 'produtos' | 'skus';
  elegiveis_ids?: string[]; // IDs autorizados
  exclusoes_ids?: string[]; // IDs bloqueados
  criado_em: string;
}

export interface ResultadoValidacaoCupom {
  valido: boolean;
  erro?: string;
  cupom?: Cupom;
  descontoAplicado: number;
  subtotalElegivel: number;
  mensagem?: string;
}
