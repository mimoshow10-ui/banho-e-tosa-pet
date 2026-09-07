'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Pencil,
  Trash2,
  Plus,
  Edit3,
  X,
  LayoutList,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Columns,
  Table as TableIcon,
  Tag,
  CheckCircle2,
  Sparkles,
  LayoutGrid,
  Eye,
  EyeOff,
  MoveRight,
  ChevronRight,
  RotateCcw,
  Check,
  Zap,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Cupom } from '@/lib/types/coupon';

interface Props {
  cupons: Cupom[];
  posicaoHomeAtual: string;
  salvarCupomAction: (formData: FormData) => Promise<void>;
  excluirCupomAction: (formData: FormData) => Promise<void>;
  salvarPosicaoAction: (formDataOrPosicao: FormData | string) => Promise<void>;
  salvarListaAction: (cuponsNovos: Cupom[]) => Promise<void>;
}

export default function CuponsClient({
  cupons: initialCupons,
  posicaoHomeAtual: initialPosicaoHome,
  salvarCupomAction,
  excluirCupomAction,
  salvarPosicaoAction,
  salvarListaAction,
}: Props) {
  const [cupons, setCupons] = useState<Cupom[]>(initialCupons);
  const [posicaoHome, setPosicaoHome] = useState<string>(initialPosicaoHome || 'topo');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [cupomEditando, setCupomEditando] = useState<Cupom | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [draggedCupomId, setDraggedCupomId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCupons(initialCupons);
  }, [initialCupons]);

  useEffect(() => {
    setPosicaoHome(initialPosicaoHome || 'topo');
  }, [initialPosicaoHome]);

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

  function notify(msg: string) {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3000);
  }

  // Altera a posição da faixa na Home via Kanban de Layout
  async function handleMudarPosicao(novaPosicao: string) {
    setPosicaoHome(novaPosicao);
    notify(`Posição da Faixa atualizada na Home!`);
    await salvarPosicaoAction(novaPosicao);
  }

  // Alterna o status do cupom via Kanban
  async function alternarStatusCupom(id: string, novoAtivo: boolean) {
    const novos = cupons.map(c => c.id === id ? { ...c, ativo: novoAtivo } : c);
    setCupons(novos);
    notify(novoAtivo ? 'Cupom ativado com sucesso!' : 'Cupom pausado/desativado!');
    await salvarListaAction(novos);
  }

  // Reordena o cupom subindo ou descendo na lista
  async function moverOrdem(indexIndex: number, direcao: 'up' | 'down') {
    const targetIndex = direcao === 'up' ? indexIndex - 1 : indexIndex + 1;
    if (targetIndex < 0 || targetIndex >= cupons.length) return;

    const novos = [...cupons];
    const [removido] = novos.splice(indexIndex, 1);
    novos.splice(targetIndex, 0, removido);

    setCupons(novos);
    notify('Ordem de prioridade dos cupons atualizada!');
    await salvarListaAction(novos);
  }

  // Manipuladores de Drag & Drop HTML5 para Cupons
  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedCupomId(id);
    e.dataTransfer.setData('text/plain', id);
  }

  function handleDragOver(e: React.DragEvent, colKey: string) {
    e.preventDefault();
    setDragOverColumn(colKey);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  async function handleDropOnColumn(e: React.DragEvent, targetCol: 'home' | 'checkout' | 'inativo') {
    e.preventDefault();
    setDragOverColumn(null);
    const cupomId = e.dataTransfer.getData('text/plain') || draggedCupomId;
    if (!cupomId) return;

    const novos = [...cupons];
    const targetIdx = novos.findIndex(c => c.id === cupomId);
    if (targetIdx < 0) return;

    const c = novos[targetIdx];
    if (targetCol === 'home') {
      c.ativo = true;
      // Move para o topo da lista para destacar na home
      novos.splice(targetIdx, 1);
      novos.unshift(c);
    } else if (targetCol === 'checkout') {
      c.ativo = true;
    } else if (targetCol === 'inativo') {
      c.ativo = false;
    }

    setCupons(novos);
    setDraggedCupomId(null);
    notify(`Cupom "${c.codigo}" movido no Kanban!`);
    await salvarListaAction(novos);
  }

  // Lista de seções para o Kanban de layout da Home
  const posicoesKanbanHome = [
    { key: 'topo', label: '📌 No Topo', subtitle: 'Acima do Banner Principal', icon: '1' },
    { key: 'abaixo_banner', label: '🖼️ Logo Abaixo Banner', subtitle: 'Entre o Banner e Benefícios', icon: '2' },
    { key: 'abaixo_beneficios', label: '🚚 Abaixo Benefícios', subtitle: 'Após a barra de frete', icon: '3' },
    { key: 'acima_ofertas', label: '🔥 Acima das Ofertas', subtitle: 'Antes da vitrine principal', icon: '4' },
    { key: 'oculto', label: '👁️‍🗨️ Ocultar Banner', subtitle: 'Não exibir na Home', icon: '5' },
  ];

  // Grupos do Kanban de Cupons
  const cuponsHome = cupons.filter(c => c.ativo);
  const cuponsInativos = cupons.filter(c => !c.ativo);

  return (
    <div className="space-y-8 font-sans">
      {/* Toast de Notificação */}
      {savedMessage && (
        <div className="fixed top-5 right-5 z-50 bg-secondary text-white px-5 py-3 rounded-2xl shadow-xl border border-orange-500 flex items-center gap-3 animate-bounce">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <span className="font-bold text-xs md:text-sm">{savedMessage}</span>
        </div>
      )}

      {/* 📊 QUADRO KANBAN DE POSIÇÃO DA FAIXA DE CUPONS NA HOME */}
      <div className="bg-gradient-to-br from-slate-900 via-secondary to-slate-800 text-white p-6 rounded-3xl shadow-lg border border-slate-700 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-primary text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                Layout Kanban
              </span>
              <h2 className="text-xl font-bold font-heading flex items-center gap-2 text-white">
                <Columns size={22} className="text-primary" />
                Posição da Faixa de Cupons na Home
              </h2>
            </div>
            <p className="text-xs text-gray-300 mt-1">
              Arraste ou clique sobre as colunas para definir em qual posição da página inicial a faixa promocional será exibida.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
            <span className="text-xs text-gray-300 font-bold px-2">Posição Ativa:</span>
            <span className="bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-xl shadow-xs uppercase">
              {posicaoHome.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Grade Visual de Colunas Kanban para a Home */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {posicoesKanbanHome.map((col) => {
            const isSelected = posicaoHome === col.key;

            return (
              <div
                key={col.key}
                onClick={() => handleMudarPosicao(col.key)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleMudarPosicao(col.key)}
                className={`rounded-2xl p-4 transition-all duration-200 border cursor-pointer relative flex flex-col justify-between min-h-[140px] ${
                  isSelected
                    ? 'bg-gradient-to-b from-orange-600/90 to-primary text-white border-white/60 shadow-xl ring-2 ring-orange-400 scale-[1.02]'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-gray-300 border-slate-700/80 hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                        isSelected ? 'bg-white text-primary' : 'bg-slate-700 text-gray-300'
                      }`}
                    >
                      {col.icon}
                    </span>

                    {isSelected && (
                      <span className="bg-emerald-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <Check size={10} /> ATIVO
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-white line-clamp-1">{col.label}</h3>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? 'text-orange-100' : 'text-gray-400'}`}>
                    {col.subtitle}
                  </p>
                </div>

                {/* Card de Previsualização da Faixa dentro da Coluna Selecionada */}
                {isSelected && (
                  <div className="mt-3 bg-white/10 backdrop-blur-xs rounded-xl p-2 border border-white/20 animate-fade-in flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Sparkles size={12} className="text-yellow-300 flex-shrink-0 animate-pulse" />
                      <span className="text-[10px] font-black text-white truncate">Faixa de Cupons em Destaque</span>
                    </div>
                    <GripVertical size={14} className="text-white/70" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🏷️ QUADRO KANBAN DE GESTÃO DE CUPONS DE DESCONTO */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-gray-200 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
              <LayoutGrid size={22} className="text-primary" />
              Gestão de Cupons Promocionais
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Organize, ative, pause e reordene seus cupons diretamente no Quadro Kanban ou Tabela.
            </p>
          </div>

          {/* Seletor de Modo: Kanban vs Tabela */}
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Columns size={15} />
              <span>Quadro Kanban</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <TableIcon size={15} />
              <span>Visão Tabela</span>
            </button>
          </div>
        </div>

        {/* 📊 VISÃO QUADRO KANBAN */}
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 📍 COLUNA 1: ATIVOS NA HOME (BANNER) */}
            <div
              onDragOver={(e) => handleDragOver(e, 'home')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropOnColumn(e, 'home')}
              className={`rounded-2xl p-4 border transition-all duration-200 space-y-3 min-h-[380px] flex flex-col ${
                dragOverColumn === 'home'
                  ? 'bg-orange-100/70 border-primary ring-2 ring-primary ring-dashed'
                  : 'bg-orange-50/40 border-orange-200/80'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-orange-200/60">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    📌 Em Destaque na Home
                  </h3>
                </div>
                <span className="bg-orange-200 text-orange-900 text-xs font-black px-2 py-0.5 rounded-full">
                  {cuponsHome.length}
                </span>
              </div>

              <p className="text-[11px] text-gray-500">
                Cupons ativos que aparecem no carrossel/faixa de destaque na loja.
              </p>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {cuponsHome.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-orange-200 rounded-xl p-4 text-xs text-gray-400">
                    Nenhum cupom ativo na Home. Arraste cupons para cá!
                  </div>
                ) : (
                  cuponsHome.map((c, idx) => {
                    const globalIdx = cupons.findIndex((item) => item.id === c.id);
                    const badgeTexto =
                      c.tipo_desconto === 'percentual'
                        ? `${c.valor_desconto}% OFF`
                        : c.tipo_desconto === 'fixo'
                        ? `R$ ${c.valor_desconto} OFF`
                        : 'FRETE GRÁTIS';

                    return (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, c.id)}
                        className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-orange-200 transition-all group relative space-y-2 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-red-600 text-white font-black text-xs px-2 py-0.5 rounded-md uppercase">
                              {badgeTexto}
                            </span>
                            <span className="font-mono font-black text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md border border-gray-200">
                              {c.codigo}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Botões para Reordenar */}
                            <button
                              type="button"
                              onClick={() => moverOrdem(globalIdx, 'up')}
                              disabled={globalIdx === 0}
                              className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 rounded hover:bg-gray-100 cursor-pointer"
                              title="Subir prioridade"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moverOrdem(globalIdx, 'down')}
                              disabled={globalIdx === cupons.length - 1}
                              className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 rounded hover:bg-gray-100 cursor-pointer"
                              title="Descer prioridade"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="font-bold text-xs text-gray-900 line-clamp-1">{c.nome_interno}</p>
                          <div className="text-[11px] text-gray-500 mt-1 flex flex-wrap gap-x-2">
                            {c.compra_minima_reais && <span>Min: R$ {c.compra_minima_reais.toFixed(2)}</span>}
                            {c.desconto_maximo_reais && <span>Teto: R$ {c.desconto_maximo_reais.toFixed(2)}</span>}
                            <span>Usos: {c.usos_realizados || 0}/{c.limite_usos_total || '∞'}</span>
                          </div>
                        </div>

                        {/* Ações do Card */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => alternarStatusCupom(c.id, false)}
                            className="text-[11px] font-bold text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <EyeOff size={12} /> Pausar
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => iniciarEdicao(c)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Editar"
                            >
                              <Pencil size={15} />
                            </button>
                            <form action={excluirCupomAction}>
                              <input type="hidden" name="id" value={c.id} />
                              <button
                                type="submit"
                                onClick={(e) => {
                                  if (!confirm(`Deseja excluir o cupom "${c.codigo}"?`)) e.preventDefault();
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 size={15} />
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 🟢 COLUNA 2: ATIVOS APENAS NO CHECKOUT */}
            <div
              onDragOver={(e) => handleDragOver(e, 'checkout')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropOnColumn(e, 'checkout')}
              className={`rounded-2xl p-4 border transition-all duration-200 space-y-3 min-h-[380px] flex flex-col ${
                dragOverColumn === 'checkout'
                  ? 'bg-emerald-100/70 border-emerald-500 ring-2 ring-emerald-500 ring-dashed'
                  : 'bg-emerald-50/40 border-emerald-200/80'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    🟢 Ativos no Checkout
                  </h3>
                </div>
                <span className="bg-emerald-200 text-emerald-900 text-xs font-black px-2 py-0.5 rounded-full">
                  {cuponsHome.length}
                </span>
              </div>

              <p className="text-[11px] text-gray-500">
                Cupons ativos e válidos para digitação durante a compra.
              </p>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {cuponsHome.map((c) => {
                  const badgeTexto =
                    c.tipo_desconto === 'percentual'
                      ? `${c.valor_desconto}% OFF`
                      : c.tipo_desconto === 'fixo'
                      ? `R$ ${c.valor_desconto} OFF`
                      : 'FRETE GRÁTIS';

                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      className="bg-white rounded-2xl p-3.5 shadow-xs hover:shadow-sm border border-emerald-200 transition space-y-2 cursor-grab"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-black text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          {c.codigo}
                        </span>
                        <span className="text-xs font-bold text-gray-700">{badgeTexto}</span>
                      </div>

                      <p className="text-xs font-bold text-gray-800 line-clamp-1">{c.nome_interno}</p>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => alternarStatusCupom(c.id, false)}
                          className="text-[11px] font-bold text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-2 py-1 rounded-lg transition cursor-pointer"
                        >
                          Pausar
                        </button>
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(c)}
                          className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🔴 COLUNA 3: INATIVOS / PAUSADOS */}
            <div
              onDragOver={(e) => handleDragOver(e, 'inativo')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropOnColumn(e, 'inativo')}
              className={`rounded-2xl p-4 border transition-all duration-200 space-y-3 min-h-[380px] flex flex-col ${
                dragOverColumn === 'inativo'
                  ? 'bg-gray-200 border-gray-400 ring-2 ring-gray-400 ring-dashed'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-400" />
                  <h3 className="font-bold text-sm text-gray-700 flex items-center gap-1.5">
                    🔴 Pausados / Inativos
                  </h3>
                </div>
                <span className="bg-gray-200 text-gray-700 text-xs font-black px-2 py-0.5 rounded-full">
                  {cuponsInativos.length}
                </span>
              </div>

              <p className="text-[11px] text-gray-500">
                Cupons desativados que não podem ser aplicados pelos clientes.
              </p>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {cuponsInativos.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl p-4 text-xs text-gray-400">
                    Nenhum cupom pausado.
                  </div>
                ) : (
                  cuponsInativos.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      className="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-200 opacity-75 hover:opacity-100 transition space-y-2 cursor-grab"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs bg-gray-100 text-gray-500 line-through px-2 py-0.5 rounded-md">
                          {c.codigo}
                        </span>
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                          INATIVO
                        </span>
                      </div>

                      <p className="text-xs font-medium text-gray-600 line-clamp-1">{c.nome_interno}</p>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => alternarStatusCupom(c.id, true)}
                          className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={12} /> Ativar Cupom
                        </button>
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(c)}
                          className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* 📋 VISÃO EM TABELA TRADICIONAL */
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-[11px] tracking-wider border-b border-gray-200 font-bold">
                  <th className="p-3.5">Código</th>
                  <th className="p-3.5">Nome Interno</th>
                  <th className="p-3.5">Tipo & Desconto</th>
                  <th className="p-3.5">Regras</th>
                  <th className="p-3.5">Usos</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {cupons.map((c) => {
                  const badgeTexto =
                    c.tipo_desconto === 'percentual'
                      ? `${c.valor_desconto}% OFF`
                      : c.tipo_desconto === 'fixo'
                      ? `R$ ${c.valor_desconto} OFF`
                      : 'FRETE GRÁTIS';

                  return (
                    <tr key={c.id} className="hover:bg-orange-50/30 transition">
                      <td className="p-3.5">
                        <span className="bg-orange-100 text-orange-900 font-mono font-bold px-2 py-1 rounded-lg border border-orange-200">
                          {c.codigo}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-gray-900">{c.nome_interno}</td>
                      <td className="p-3.5 font-bold text-primary">{badgeTexto}</td>
                      <td className="p-3.5 text-[11px] text-gray-500">
                        {c.compra_minima_reais && <div>Min: R$ {c.compra_minima_reais.toFixed(2)}</div>}
                        {c.desconto_maximo_reais && <div>Teto: R$ {c.desconto_maximo_reais.toFixed(2)}</div>}
                      </td>
                      <td className="p-3.5 font-bold">
                        {c.usos_realizados || 0} / {c.limite_usos_total || '∞'}
                      </td>
                      <td className="p-3.5">
                        {c.ativo ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            ATIVO
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            INATIVO
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => iniciarEdicao(c)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            <Pencil size={16} />
                          </button>
                          <form action={excluirCupomAction}>
                            <input type="hidden" name="id" value={c.id} />
                            <button
                              type="submit"
                              onClick={(e) => {
                                if (!confirm(`Excluir cupom "${c.codigo}"?`)) e.preventDefault();
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 size={16} />
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
        )}
      </div>

      {/* 📝 FORMULÁRIO DE CADASTRO / EDIÇÃO DE CUPOM */}
      <div ref={formRef} className="bg-white p-8 rounded-3xl shadow-xs border border-gray-200 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
            {cupomEditando ? (
              <>
                <Edit3 size={22} className="text-blue-600" />
                <span>
                  Editar Cupom: <strong className="text-primary font-mono">{cupomEditando.codigo}</strong>
                </span>
              </>
            ) : (
              <>
                <Plus size={22} className="text-primary" />
                <span>Cadastrar Novo Cupom de Desconto</span>
              </>
            )}
          </h2>

          {cupomEditando && (
            <button
              type="button"
              onClick={cancelarEdicao}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <X size={15} />
              <span>Cancelar Edição</span>
            </button>
          )}
        </div>

        <form action={salvarCupomAction} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cupomEditando && <input type="hidden" name="id" value={cupomEditando.id} />}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nome Interno do Cupom *</label>
            <input
              name="nome_interno"
              required
              value={nomeInterno}
              onChange={(e) => setNomeInterno(e.target.value)}
              placeholder="Ex: Promoção de Boas-Vindas"
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Código do Cupom (Sem Espaços) *</label>
            <input
              name="codigo"
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex: BEMVINDO10"
              className="w-full border border-gray-300 rounded-xl p-3 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Desconto *</label>
            <select
              name="tipo_desconto"
              value={tipoDesconto}
              onChange={(e) => setTipoDesconto(e.target.value as any)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-white font-bold focus:ring-2 focus:ring-primary focus:outline-none"
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
              className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none"
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
              placeholder="Ex: 50.00"
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
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
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Data / Hora de Início (Opcional)</label>
            <input
              name="data_inicio"
              type="datetime-local"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Data / Hora de Validade / Fim (Opcional)</label>
            <input
              name="data_fim"
              type="datetime-local"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Limite Total de Usos (Opcional)</label>
            <input
              name="limite_usos_total"
              type="number"
              value={limiteUsos}
              onChange={(e) => setLimiteUsos(e.target.value)}
              placeholder="Ex: 100"
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Aplica-se em: *</label>
            <select
              name="tipo_elegibilidade"
              value={tipoElegibilidade}
              onChange={(e) => setTipoElegibilidade(e.target.value as any)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none"
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
            <label htmlFor="ativo" className="text-sm font-bold text-secondary cursor-pointer">
              Cupom Ativo para Utilização
            </label>
          </div>

          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              type="submit"
              className={`flex-1 font-bold py-3.5 rounded-2xl transition shadow-sm cursor-pointer text-white ${
                cupomEditando ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary hover:bg-orange-600'
              }`}
            >
              {cupomEditando ? `Atualizar Cupom "${cupomEditando.codigo}"` : 'Salvar Novo Cupom de Desconto'}
            </button>

            {cupomEditando && (
              <button
                type="button"
                onClick={cancelarEdicao}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-6 py-3.5 rounded-2xl transition cursor-pointer"
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
