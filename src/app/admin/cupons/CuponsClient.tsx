'use client';

import { useState, useRef } from 'react';
import { Pencil, Trash2, Plus, Edit3, X, LayoutList, Save } from 'lucide-react';
import { Cupom } from '@/lib/types/coupon';

interface Props {
  cupons: Cupom[];
  posicaoHomeAtual: string;
  salvarCupomAction: (formData: FormData) => Promise<void>;
  excluirCupomAction: (formData: FormData) => Promise<void>;
  salvarPosicaoAction: (formData: FormData) => Promise<void>;
}

export default function CuponsClient({
  cupons,
  posicaoHomeAtual,
  salvarCupomAction,
  excluirCupomAction,
  salvarPosicaoAction,
}: Props) {
  const [cupomEditando, setCupomEditando] = useState<Cupom | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Estados dos campos do formulário
  const [nomeInterno, setNomeInterno] = useState('');
  const [codigo, setCodigo] = useState('');
  const [tipoDesconto, setTipoDesconto] = useState<Cupom['tipo_desconto']>('percentual');
  const [valorDesconto, setValorDesconto] = useState('');
  const [descontoMaximo, setDescontoMaximo] = useState('');
  const [compraMinima, setCompraMinima] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [limiteUsos, setLimiteUsos] = useState('');
  const [tipoElegibilidade, setTipoElegibilidade] = useState<Cupom['tipo_elegibilidade']>('todos');
  const [permitirPromocionais, setPermitirPromocionais] = useState(true);
  const [permitirAcumulo, setPermitirAcumulo] = useState(false);
  const [ativo, setAtivo] = useState(true);

  function iniciarEdicao(c: Cupom) {
    setCupomEditando(c);
    setNomeInterno(c.nome_interno || '');
    setCodigo(c.codigo || '');
    setTipoDesconto(c.tipo_desconto || 'percentual');
    setValorDesconto(c.valor_desconto ? c.valor_desconto.toString() : '');
    setDescontoMaximo(c.desconto_maximo_reais ? c.desconto_maximo_reais.toString() : '');
    setCompraMinima(c.compra_minima_reais ? c.compra_minima_reais.toString() : '');
    setDataInicio(c.data_inicio || '');
    setDataFim(c.data_fim || '');
    setLimiteUsos(c.limite_usos_total ? c.limite_usos_total.toString() : '');
    setTipoElegibilidade(c.tipo_elegibilidade || 'todos');
    setPermitirPromocionais(c.permitir_produtos_promocionais ?? true);
    setPermitirAcumulo(c.permitir_acumulo ?? false);
    setAtivo(c.ativo ?? true);

    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function cancelarEdicao() {
    setCupomEditando(null);
    setNomeInterno('');
    setCodigo('');
    setTipoDesconto('percentual');
    setValorDesconto('');
    setDescontoMaximo('');
    setCompraMinima('');
    setDataInicio('');
    setDataFim('');
    setLimiteUsos('');
    setTipoElegibilidade('todos');
    setPermitirPromocionais(true);
    setPermitirAcumulo(false);
    setAtivo(true);
  }

  return (
    <div className="space-y-6">
      {/* 🎯 CONFIGURAÇÃO DE POSIÇÃO DOS CUPONS NA HOME */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-2xl border border-orange-200 shadow-xs">
        <form action={salvarPosicaoAction} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-secondary text-base flex items-center gap-2">
              <LayoutList size={20} className="text-primary" />
              Posição dos Cupons na Tela Principal (Home)
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Escolha exatamente em qual posição da página inicial a faixa de cupons em destaque deve aparecer.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              name="posicao_home"
              defaultValue={posicaoHomeAtual || 'topo'}
              className="border border-orange-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-primary focus:outline-none flex-1 md:w-72"
            >
              <option value="topo">📌 No Topo (Acima do Banner Principal)</option>
              <option value="abaixo_banner">🖼️ Logo Abaixo do Banner Principal</option>
              <option value="abaixo_beneficios">🚚 Abaixo da Barra de Benefícios</option>
              <option value="acima_ofertas">🔥 Acima da Vitrine de Ofertas</option>
              <option value="oculto">🚫 Ocultar Faixa de Cupons na Home</option>
            </select>

            <button
              type="submit"
              className="bg-primary hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-2xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Save size={14} />
              <span>Salvar Posição</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Cupons Cadastrados */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-500 font-bold">
          <span>TOTAL DE CUPONS: {cupons.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider font-bold border-b border-gray-200">
              <tr>
                <th className="p-4">Código</th>
                <th className="p-4">Nome Interno</th>
                <th className="p-4">Tipo & Desconto</th>
                <th className="p-4">Regras</th>
                <th className="p-4">Usos</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {cupons.map((c) => {
                const isSelected = cupomEditando?.id === c.id;

                return (
                  <tr
                    key={c.id}
                    className={`transition ${isSelected ? 'bg-amber-50/80 border-l-4 border-l-primary' : 'hover:bg-gray-50/50'}`}
                  >
                    <td className="p-4 font-mono font-black text-secondary text-base">
                      <span className="bg-orange-100 text-primary px-2.5 py-1 rounded-lg border border-orange-200">
                        {c.codigo}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                      {c.nome_interno}
                    </td>
                    <td className="p-4 font-bold text-gray-700">
                      {c.tipo_desconto === 'percentual' && `${c.valor_desconto}% OFF`}
                      {c.tipo_desconto === 'fixo' && `R$ ${Number(c.valor_desconto || 0).toFixed(2)} OFF`}
                      {c.tipo_desconto === 'frete_gratis' && `Frete Grátis`}
                    </td>
                    <td className="p-4 text-xs text-gray-500 space-y-0.5">
                      {c.compra_minima_reais && <p>Min: R$ {Number(c.compra_minima_reais).toFixed(2)}</p>}
                      {c.desconto_maximo_reais && <p>Teto: R$ {Number(c.desconto_maximo_reais).toFixed(2)}</p>}
                    </td>
                    <td className="p-4 text-xs font-bold text-gray-600">
                      {c.usos_realizados || 0} / {c.limite_usos_total || '∞'}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${c.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        {c.ativo ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(c)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Editar Cupom"
                        >
                          <Pencil size={18} />
                        </button>

                        <form action={excluirCupomAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            type="submit"
                            onClick={(e) => {
                              if (!confirm(`Deseja realmente excluir o cupom "${c.codigo}"?`)) {
                                e.preventDefault();
                              }
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Excluir Cupom"
                          >
                            <Trash2 size={18} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulário de Cadastro / Edição */}
      <div ref={formRef} className="bg-white p-8 rounded-2xl shadow-xs border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
            {cupomEditando ? (
              <>
                <Edit3 size={20} className="text-blue-600" />
                <span>Editar Cupom: <strong className="text-primary font-mono">{cupomEditando.codigo}</strong></span>
              </>
            ) : (
              <>
                <Plus size={20} className="text-primary" />
                <span>Cadastrar Novo Cupom</span>
              </>
            )}
          </h2>

          {cupomEditando && (
            <button
              type="button"
              onClick={cancelarEdicao}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <X size={14} />
              <span>Cancelar Edição</span>
            </button>
          )}
        </div>

        <form action={salvarCupomAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cupomEditando && <input type="hidden" name="id" value={cupomEditando.id} />}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nome Interno do Cupom *</label>
            <input
              name="nome_interno"
              required
              value={nomeInterno}
              onChange={(e) => setNomeInterno(e.target.value)}
              placeholder="Ex: Promoção Dia das Crianças"
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Código do Cupom (Sem Espaços) *</label>
            <input
              name="codigo"
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex: CRIANCAS10"
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-mono font-bold uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Desconto *</label>
            <select
              name="tipo_desconto"
              value={tipoDesconto}
              onChange={(e) => setTipoDesconto(e.target.value as any)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white font-bold"
            >
              <option value="percentual">Desconto Percentual (%)</option>
              <option value="fixo">Desconto em Valor Fixo (R$)</option>
              <option value="frete_gratis">Frete Grátis</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Valor do Desconto (% ou R$) *</label>
            <input
              name="valor_desconto"
              type="number"
              step="0.01"
              required
              value={valorDesconto}
              onChange={(e) => setValorDesconto(e.target.value)}
              placeholder="Ex: 10 ou 20.00"
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Desconto Máximo / Teto (R$) (Opcional)</label>
            <input
              name="desconto_maximo_reais"
              type="number"
              step="0.01"
              value={descontoMaximo}
              onChange={(e) => setDescontoMaximo(e.target.value)}
              placeholder="Ex: 50.00 (Teto de 20% OFF)"
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Compra Mínima no Pedido (R$) (Opcional)</label>
            <input
              name="compra_minima_reais"
              type="number"
              step="0.01"
              value={compraMinima}
              onChange={(e) => setCompraMinima(e.target.value)}
              placeholder="Ex: 100.00"
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Data / Hora de Início (Opcional)</label>
            <input
              name="data_inicio"
              type="datetime-local"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Data / Hora de Validade / Fim (Opcional)</label>
            <input
              name="data_fim"
              type="datetime-local"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Limite Total de Usos (Opcional)</label>
            <input
              name="limite_usos_total"
              type="number"
              value={limiteUsos}
              onChange={(e) => setLimiteUsos(e.target.value)}
              placeholder="Ex: 100 (Deixar em branco para ilimitado)"
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Aplica-se em: *</label>
            <select
              name="tipo_elegibilidade"
              value={tipoElegibilidade}
              onChange={(e) => setTipoElegibilidade(e.target.value as any)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white"
            >
              <option value="todos">Todos os Produtos da Loja</option>
              <option value="grupos">Grupos Específicos</option>
              <option value="subgrupos">Subgrupos Específicos</option>
              <option value="produtos">Produtos Específicos</option>
              <option value="skus">SKUs / Variações Específicas</option>
            </select>
          </div>

          <div className="flex items-center gap-2 md:col-span-2 pt-2">
            <input
              id="permitir_produtos_promocionais"
              name="permitir_produtos_promocionais"
              type="checkbox"
              checked={permitirPromocionais}
              onChange={(e) => setPermitirPromocionais(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <label htmlFor="permitir_produtos_promocionais" className="text-xs font-bold text-gray-700 cursor-pointer">
              Permitir aplicação do cupom sobre produtos que JÁ estão em promoção
            </label>
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <input
              id="permitir_acumulo"
              name="permitir_acumulo"
              type="checkbox"
              checked={permitirAcumulo}
              onChange={(e) => setPermitirAcumulo(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <label htmlFor="permitir_acumulo" className="text-xs font-bold text-gray-700 cursor-pointer">
              Permitir somar/acumular este cupom com outros cupons no mesmo pedido
            </label>
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <input
              id="ativo"
              name="ativo"
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <label htmlFor="ativo" className="text-sm font-bold text-secondary cursor-pointer">Cupom Ativo para Utilização</label>
          </div>

          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              type="submit"
              className={`flex-1 font-bold py-3.5 rounded-xl transition shadow-sm cursor-pointer text-white ${
                cupomEditando ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary hover:bg-orange-600'
              }`}
            >
              {cupomEditando ? `Atualizar Cupom "${cupomEditando.codigo}"` : 'Salvar Novo Cupom de Desconto'}
            </button>

            {cupomEditando && (
              <button
                type="button"
                onClick={cancelarEdicao}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-6 py-3.5 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
