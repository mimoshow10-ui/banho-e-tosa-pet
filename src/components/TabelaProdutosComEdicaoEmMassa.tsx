'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Trash2, Edit, CheckSquare, Square, Zap, RefreshCw, CheckCircle2, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import DeleteProductButton from '@/app/admin/produtos/DeleteProductButton';

interface Produto {
  id: string;
  nome: string;
  codigo_barras?: string | null;
  preco: number;
  preco_promocional?: number | null;
  estoque: number;
  slug: string;
  ativo: boolean;
  categoria_id?: string | null;
  categoria_nome_exibicao?: string;
  imagens?: string[] | string | null;
  categorias?: { nome: string } | null;
  destaque_super_promocao?: boolean;
}

interface Categoria {
  id: string;
  nome: string;
  isSub?: boolean;
  parent_id?: string | null;
}

interface Props {
  produtos: Produto[];
  categorias: Categoria[];
  paiIds: Set<string>;
}

export default function TabelaProdutosComEdicaoEmMassa({ produtos, categorias, paiIds }: Props) {
  const [selecionados, setSelecionados] = useState<string[]>([]);
  // Inicia em neutro por padrão
  const [acaoMassa, setAcaoMassa] = useState<string>('');

  // Estado para Modal de Foto Ampliada
  const [fotoModal, setFotoModal] = useState<{ url: string; nome: string } | null>(null);
  
  // Estados para Grupo & Subgrupo
  const [grupoIdMassa, setGrupoIdMassa] = useState<string>('');
  const [subgrupoIdMassa, setSubgrupoIdMassa] = useState<string>('');

  // Estados para Reajuste de Preço Normal
  const [modoPrecoMassa, setModoPrecoMassa] = useState<'fixo' | 'aumentar_pct' | 'diminuir_pct'>('fixo');
  const [valorPrecoMassa, setValorPrecoMassa] = useState<string>('');

  // Estados para Preço Promocional
  const [modoPromoMassa, setModoPromoMassa] = useState<'fixo' | 'desconto_pct' | 'remover'>('fixo');
  const [valorPromoMassa, setValorPromoMassa] = useState<string>('');

  // Estados para Destaques & Status
  const [valorDestaqueMassa, setValorDestaqueMassa] = useState<string>('super_promocao');
  const [valorStatusMassa, setValorStatusMassa] = useState<string>('true');

  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Separar Grupos Principais e Subgrupos
  const gruposPrincipais = categorias.filter((c) => !c.parent_id);
  const subgruposDisponiveis = categorias.filter((c) => {
    if (!c.parent_id) return false;
    if (grupoIdMassa) return c.parent_id === grupoIdMassa;
    return true;
  });

  const todosSelecionados = produtos.length > 0 && selecionados.length === produtos.length;

  function toggleSelecionarTodos() {
    if (todosSelecionados) {
      setSelecionados([]);
    } else {
      setSelecionados(produtos.map((p) => p.id));
    }
  }

  function toggleSelecionarItem(id: string) {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter((item) => item !== id));
    } else {
      setSelecionados([...selecionados, id]);
    }
  }

  async function executarEdicaoEmMassa() {
    if (selecionados.length === 0) return;

    if (!acaoMassa) {
      alert('Por favor, selecione uma Ação em Massa no menu antes de aplicar.');
      return;
    }

    if (acaoMassa === 'excluir' && !confirm(`Tem certeza que deseja EXCLUIR DEFINITIVAMENTE ${selecionados.length} produto(s)?`)) {
      return;
    }

    setCarregando(true);
    setMensagem(null);

    try {
      let valorPayload = '';
      let modoPayload = '';
      let catPayload = null;

      if (acaoMassa === 'categoria') {
        catPayload = subgrupoIdMassa || grupoIdMassa || null;
      } else if (acaoMassa === 'preco') {
        modoPayload = modoPrecoMassa;
        valorPayload = valorPrecoMassa;
      } else if (acaoMassa === 'preco_promocional') {
        modoPayload = modoPromoMassa;
        valorPayload = valorPromoMassa;
      } else if (acaoMassa === 'destaque') {
        valorPayload = valorDestaqueMassa;
      } else if (acaoMassa === 'status') {
        valorPayload = valorStatusMassa;
      }

      const res = await fetch('/api/admin/produtos/edicao-em-massa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selecionados,
          acao: acaoMassa,
          modo: modoPayload,
          valor: valorPayload,
          categoria_id: catPayload,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: data.mensagem || 'Edição em massa concluída com sucesso!' });
        setSelecionados([]);
        window.location.reload();
      } else {
        setMensagem({ tipo: 'erro', texto: data.erro || 'Falha ao executar ação em massa.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro de comunicação com o servidor.' });
    } finally {
      setCarregando(false);
    }
  }

  function extrairFoto(img: any): string | null {
    if (!img) return null;
    if (typeof img === 'string') return img.split(/[\r\n,]+/)[0];
    if (Array.isArray(img) && img.length > 0) return extrairFoto(img[0]);
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {mensagem && (
        <div
          className={`p-4 rounded-xl font-bold text-xs flex items-center justify-between shadow-xs ${
            mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{mensagem.texto}</span>
          </div>
          <button type="button" onClick={() => setMensagem(null)} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
      )}

      {/* BARRA FIXA DE EDIÇÃO EM MASSA NO TOPO SUPERIOR DA TELA */}
      {selecionados.length > 0 && (
        <div className="fixed top-4 left-4 right-4 md:left-72 md:right-8 z-50 bg-[#0B2545] text-white p-4 rounded-2xl shadow-2xl border-2 border-blue-600 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-white font-black text-xs px-3 py-1 rounded-full shadow-2xs">
              {selecionados.length} Selecionado(s)
            </span>
            <span className="text-xs font-bold text-gray-200 hidden sm:inline">
              Ação em massa:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* 1. SELETOR PRINCIPAL DE AÇÕES (COMEÇA EM NEUTRO) */}
            <select
              value={acaoMassa}
              onChange={(e) => setAcaoMassa(e.target.value)}
              className="bg-blue-950 text-white border border-blue-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="">⚙️ Escolha a Ação em Massa...</option>
              <option value="categoria">🏷️ Alterar Grupo & Subgrupo</option>
              <option value="preco">💵 Reajustar Preço Normal (R$ / %)</option>
              <option value="preco_promocional">🏷️ Definir Preço Promocional (R$ / %)</option>
              <option value="destaque">🔥 Vitrines & Destaques</option>
              <option value="status">🟢 Ativar / Desativar Produtos</option>
              <option value="excluir">🗑️ Excluir Selecionados</option>
            </select>

            {/* 2. SUB-OPÇÕES: GRUPO & SUBGRUPO */}
            {acaoMassa === 'categoria' && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Seletor Unificado de Categoria ou Grupo */}
                <select
                  value={subgrupoIdMassa || grupoIdMassa}
                  onChange={(e) => {
                    const selectedCatId = e.target.value;
                    const catObj = categorias.find(c => c.id === selectedCatId);
                    if (catObj?.parent_id) {
                      setSubgrupoIdMassa(catObj.id);
                      setGrupoIdMassa(catObj.parent_id);
                    } else {
                      setGrupoIdMassa(selectedCatId);
                      setSubgrupoIdMassa('');
                    }
                  }}
                  className="bg-white text-secondary border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer max-w-[280px]"
                >
                  <option value="">🏷️ [Selecione o Grupo ou Subgrupo Destino]</option>
                  <option value="">🚫 Remover da Categoria Atual (Sem Categoria)</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 3. SUB-OPÇÕES: REAJUSTE DE PREÇO NORMAL */}
            {acaoMassa === 'preco' && (
              <div className="flex items-center gap-2">
                <select
                  value={modoPrecoMassa}
                  onChange={(e) => setModoPrecoMassa(e.target.value as any)}
                  className="bg-white text-secondary border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="fixo">Definir Preço Fixo (R$)</option>
                  <option value="aumentar_pct">Aumentar Preço (+ %)</option>
                  <option value="diminuir_pct">Descontar Preço (- %)</option>
                </select>

                <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-gray-300 shadow-2xs">
                  <span className="text-xs font-bold text-gray-500">
                    {modoPrecoMassa === 'fixo' ? 'R$' : '%'}
                  </span>
                  <input
                    type="text"
                    value={valorPrecoMassa}
                    onChange={(e) => setValorPrecoMassa(e.target.value)}
                    placeholder={modoPrecoMassa === 'fixo' ? 'Ex: 29.90' : 'Ex: 10'}
                    className="bg-transparent text-secondary text-xs font-bold w-20 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 4. SUB-OPÇÕES: PREÇO PROMOCIONAL */}
            {acaoMassa === 'preco_promocional' && (
              <div className="flex items-center gap-2">
                <select
                  value={modoPromoMassa}
                  onChange={(e) => setModoPromoMassa(e.target.value as any)}
                  className="bg-white text-secondary border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="fixo">Preço Promocional Fixo (R$)</option>
                  <option value="desconto_pct">Desconto em Porcentagem (% OFF)</option>
                  <option value="remover">🚫 Remover Promoção (Voltar Normal)</option>
                </select>

                {modoPromoMassa !== 'remover' && (
                  <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-gray-300 shadow-2xs">
                    <span className="text-xs font-bold text-gray-500">
                      {modoPromoMassa === 'fixo' ? 'R$' : '%'}
                    </span>
                    <input
                      type="text"
                      value={valorPromoMassa}
                      onChange={(e) => setValorPromoMassa(e.target.value)}
                      placeholder={modoPromoMassa === 'fixo' ? 'Ex: 19.90' : 'Ex: 15'}
                      className="bg-transparent text-secondary text-xs font-bold w-20 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 5. SUB-OPÇÕES: VITRINES & DESTAQUES */}
            {acaoMassa === 'destaque' && (
              <select
                value={valorDestaqueMassa}
                onChange={(e) => setValorDestaqueMassa(e.target.value)}
                className="bg-white text-secondary border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="super_promocao">🔥 Super Promoção (Banner / Home)</option>
                <option value="mais_vendidos">⭐ Os Mais Vendidos</option>
                <option value="lancamento">🆕 Lançamentos / Novidades</option>
                <option value="nenhum">Nenhum (Produtos Normais)</option>
              </select>
            )}

            {/* 6. SUB-OPÇÕES: STATUS */}
            {acaoMassa === 'status' && (
              <select
                value={valorStatusMassa}
                onChange={(e) => setValorStatusMassa(e.target.value)}
                className="bg-white text-secondary border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="true">🟢 Ativo (Visível na loja)</option>
                <option value="false">🔴 Inativo (Oculto)</option>
              </select>
            )}

            {/* Botão Executar */}
            <button
              type="button"
              onClick={executarEdicaoEmMassa}
              disabled={carregando || !acaoMassa}
              className="bg-primary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {carregando ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Aplicando...</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Aplicar Alterações</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TABELA DE PRODUTOS */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 text-xs font-bold text-gray-500 gap-2">
          <span>TOTAL EXIBIDO: {produtos.length} PRODUTO(S)</span>

          {selecionados.length === 0 ? (
            <span className="text-gray-400 font-medium text-[11px] bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
              💡 <strong>Dica:</strong> Marque a caixinha ao lado de cada produto para abrir a barra de <strong>Edição em Massa (Preços, Grupos, Subgrupos e Promoções)</strong>.
            </span>
          ) : (
            <span className="text-primary font-black bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200">
              {selecionados.length} SELECIONADO(S)
            </span>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider font-bold border-b border-gray-200">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <button
                      type="button"
                      onClick={toggleSelecionarTodos}
                      className="text-gray-500 hover:text-primary transition cursor-pointer"
                      title={todosSelecionados ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    >
                      {todosSelecionados ? (
                        <CheckSquare size={18} className="text-primary" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="p-4 w-28">Foto do Produto</th>
                  <th className="p-4 w-32">SKU</th>
                  <th className="p-4">Nome do Produto</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Preço Normal</th>
                  <th className="p-4 text-green-600">Promoção</th>
                  <th className="p-4">Estoque</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {produtos && produtos.length > 0 ? (
                  produtos.map((item) => {
                    const isChecked = selecionados.includes(item.id);
                    const rawFotoUrl = extrairFoto(item.imagens);
                    const fotoValida = rawFotoUrl && !rawFotoUrl.includes('amazonaws.com') ? rawFotoUrl : null;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50/70 transition ${isChecked ? 'bg-orange-50/30' : ''}`}
                      >
                        {/* Checkbox Individual */}
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelecionarItem(item.id)}
                            className="text-gray-400 hover:text-primary transition cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare size={18} className="text-primary fill-orange-100" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                        </td>

                        {/* Foto - Ampliada e com Clique para Expandir */}
                        <td className="p-4">
                          {fotoValida ? (
                            <button
                              type="button"
                              onClick={() => setFotoModal({ url: fotoValida, nome: item.nome })}
                              className="relative group cursor-zoom-in block"
                              title="Clique para ampliar a foto em alta resolução"
                            >
                              <img
                                src={fotoValida}
                                alt={item.nome}
                                className="w-20 h-20 md:w-24 md:h-24 object-contain bg-white rounded-2xl border-2 border-gray-200 shadow-xs group-hover:border-primary group-hover:scale-105 transition-all p-1"
                              />
                              <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition">
                                🔍 Ampliar
                              </span>
                            </button>
                          ) : (
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-amber-50 rounded-2xl border-2 border-amber-300 flex flex-col items-center justify-center text-[10px] font-black text-amber-700 text-center leading-tight shadow-2xs p-1" title="Produto Sem Foto (Não Publicado)">
                              <span className="text-sm">🟡</span>
                              <span>Sem Foto</span>
                            </div>
                          )}
                        </td>

                        {/* SKU */}
                        <td className="p-4 font-bold text-gray-500 font-mono text-xs">
                          {item.codigo_barras || 'Sem SKU'}
                        </td>

                        {/* Nome */}
                        <td className="p-4 font-bold text-gray-800">
                          <div className="flex items-center gap-2 flex-wrap">
                            {paiIds.has(item.id) && (
                              <span title="Produto Pai (tem variações)" className="text-amber-500 text-base leading-none">
                                ★
                              </span>
                            )}
                            <Link
                              href={`/produto/${item.slug}`}
                              target="_blank"
                              className="hover:text-primary hover:underline transition flex items-center gap-1"
                            >
                              <span>{item.nome}</span>
                              <ExternalLink size={12} className="text-gray-400" />
                            </Link>
                            {!fotoValida && (
                              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                                🟡 Sem Foto (Não Publicado)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Categoria / Subcategoria & Sinalização Visual */}
                        <td className="p-4 text-xs font-semibold">
                          {(() => {
                            const status = (item as any).status_classificacao || (
                              (item as any).categoria_nome_exibicao?.includes('>') ? 'ok' :
                              (item as any).categoria_nome_exibicao && (item as any).categoria_nome_exibicao !== 'Sem Categoria' ? 'apenas_grupo' : 'sem_categoria'
                            );
                            const nomeExibicao = (item as any).categoria_nome_exibicao || item.categorias?.nome || 'Sem Categoria';

                            if (status === 'ok') {
                              return (
                                <div className="space-y-1">
                                  <span className="bg-emerald-100 text-emerald-950 border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                                    <CheckCircle2 size={12} className="text-emerald-600" />
                                    Grupo & Subgrupo OK
                                  </span>
                                  <div className="font-bold text-gray-800 text-xs">
                                    🏷️ {nomeExibicao}
                                  </div>
                                </div>
                              );
                            }

                            if (status === 'apenas_grupo') {
                              return (
                                <div className="space-y-1">
                                  <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                                    <AlertTriangle size={12} className="text-amber-600" />
                                    Apenas Grupo (Falta Subgrupo)
                                  </span>
                                  <div className="font-bold text-amber-900 text-xs">
                                    📂 {nomeExibicao}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-1">
                                <span className="bg-red-100 text-red-900 border border-red-300 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                                  <XCircle size={12} className="text-red-600" />
                                  Sem Categoria (Não Classificado)
                                </span>
                                <div className="font-medium text-gray-400 text-[11px]">
                                  Pendente de Grupo e Subgrupo
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Preço Normal */}
                        <td className="p-4 font-bold text-gray-700">
                          R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                        </td>

                        {/* Preço Promoção */}
                        <td className="p-4 font-bold text-green-600">
                          {item.preco_promocional
                            ? `R$ ${Number(item.preco_promocional).toFixed(2).replace('.', ',')}`
                            : '-'}
                        </td>

                        {/* Estoque */}
                        <td className="p-4 font-bold text-gray-600 text-xs">
                          {item.estoque}
                        </td>

                        {/* Ações */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/produtos/${item.id}`}
                              className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1"
                            >
                              <Edit size={12} />
                              <span>Editar</span>
                            </Link>
                            <DeleteProductButton id={item.id} nome={item.nome} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400 font-bold text-sm">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🔍 MODAL DE FOTO EXPANDIDA EM ALTA RESOLUÇÃO */}
      {fotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setFotoModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-4 text-center border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFotoModal(null)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-xs"
            >
              ✕
            </button>

            <h3 className="text-sm font-bold text-gray-800 pr-8">{fotoModal.nome}</h3>

            <div className="relative w-full max-h-[70vh] flex items-center justify-center bg-gray-50 rounded-2xl overflow-hidden p-2 border border-gray-200">
              <img
                src={fotoModal.url}
                alt={fotoModal.nome}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-md"
              />
            </div>

            <p className="text-xs text-gray-400 font-medium">Clique fora ou no botão ✕ para fechar</p>
          </div>
        </div>
      )}
    </div>
  );
}
