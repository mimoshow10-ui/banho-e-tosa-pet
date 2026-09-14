export interface Transportadora {
  id: string;
  nome: string;
  nome_exibicao: string;
  tipo_integracao: 'correios' | 'melhorenvio' | 'frenet' | 'jadlog' | 'motoboy' | 'retirada' | 'custom';
  ativo: boolean;
  cep_origem: string;
  api_url?: string;
  api_key?: string;
  client_id?: string;
  client_secret?: string;
  token?: string;
  prazo_adicional_dias: number;
  valor_adicional_reais: number;
  desconto_percentual: number;
  ordem: number;
  instrucoes_retirada?: string;
}

export interface Endereco {
  id: string;
  label?: string; // Ex: Casa, Trabalho
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  referencia?: string;
  destinatario?: string;
  telefone?: string;
  is_principal?: boolean;
}

export interface Cliente {
  id: string;
  tipo: 'PF' | 'PJ';
  nome_completo: string; // ou Razão Social
  nome_fantasia?: string;
  cpf_cnpj: string;
  inscricao_estadual?: string;
  email: string;
  telefone: string;
  data_nascimento?: string;
  enderecos: Endereco[];
  criado_em: string;
}

export interface OpcaoFrete {
  id: string; // ex: 'correios-pac', 'retirada-local'
  transportadora_id: string;
  nome: string; // Ex: Entrega Expressa, Retirada na Loja
  nome_transportadora: string; // Ex: Correios, Jadlog, Loja Física
  valor: number;
  prazo_dias: number;
  prazo_estimado_texto: string;
  descricao?: string;
  is_gratis?: boolean;
}

export interface ItemCarrinho {
  id: string; // ID do produto
  variant_id?: string;
  sku?: string;
  nome: string;
  slug: string;
  imagem: string;
  preco_unitario: number;
  quantidade: number;
  peso_kg: number;
  largura_cm: number;
  altura_cm: number;
  comprimento_cm: number;
}

export interface PedidoSnapshot {
  id: string;
  numero_pedido: string;
  cliente: Cliente;
  endereco_entrega: Endereco;
  frete_selecionado: OpcaoFrete;
  itens: ItemCarrinho[];
  subtotal: number;
  valor_frete: number;
  desconto: number;
  total: number;
  status: 'CARRINHO' | 'AGUARDANDO_PAGAMENTO' | 'PAGAMENTO_APROVADO' | 'EM_SEPARACAO' | 'ENVIADO' | 'ENTREGUE' | 'CANCELADO';
  criado_em: string;
}
