'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Trash2, Edit, CheckSquare, Square, Zap, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [acaoMassa, setAcaoMassa] = useState<string>('destaque');
  const [valorMassa, setValorMassa] = useState<string>('super_promocao');
  const [precoPromocionalMassa, setPrecoPromocionalMassa] = useState<string>('');
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

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

    if (acaoMassa === 'excluir' && !confirm(`Tem certeza que deseja EXCLUIR DEFINITIVAMENTE ${selecionados.length} produto(s)?`)) {
      return;
    }

    setCarregando(true);
    setMensagem(null);

    try {
      const res = await fetch('/api/admin/produtos/edicao-em-massa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selecionados,
          acao: acaoMassa,
          valor: acaoMassa === 'preco_promocional' ? precoPromocionalMassa : valorMassa,
          preco_promocional: precoPromocionalMassa,
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

      {/* BARRA FLUTUANTE DE EDIÇÃO EM MASSA (Aparece quando 1+ selecionados) */}
      {selecionados.length > 0 && (
        <div className="sticky top-16 z-30 bg-secondary text-white p-4 rounded-2xl shadow-xl border border-blue-900 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-white font-black text-xs px-3 py-1 rounded-full shadow-2xs">
              {selecionados.length} Selecionado(s)
            </span>
            <span className="text-xs font-bold text-gray-200 hidden sm:inline">
              Ação em massa:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Seletor da Ação Principal */}
            <select
              value={acaoMassa}
              onChange={(e) => {
                const val = e.target.value;
                setAcaoMassa(val);
                if (val === 'destaque') setValorMassa('super_promocao');
                else if (val === 'status') setValorMassa('true');
                else if (val === 'categoria') setValorMassa(categorias[0]?.id || '');
              }}
              className="bg-blue-950 text-white border border-blue-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="destaque">🔥 Destaque na Home</option>
              <option value="categoria">🏷️ Alterar Categoria</option>
              <option value="preco_promocional">💰 Definir Preço Promocional (R$)</option>
              <option value="status">🟢 Ativar / Desativar</option>
              <option value="excluir">🗑️ Excluir Selecionados</option>
            </select>

            {/* Sub-valores conforme a ação */}
            {acaoMassa === 'destaque' && (
              <select
                value={valorMassa}
                onChange={(e) => setValorMassa(e.target.value)}
                className="bg-white text-secondary border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="super_promocao">🔥 Super Promoção</option>
                <option value="mais_vendidos">⭐ Os Mais Vendidos</option>
                <option value="lancamento">🆕 Lançamento / Novidades</option>
                <option value="nenhum">Nenhum (Comum)</option>
              </select>
            )}

            {acaoMassa === 'categoria' && (
              <select
                value={valorMassa}
                onChange={(e) => setValorMassa(e.target.value)}
                className="bg-white text-secondary border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="">Sem Categoria</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            )}

            {/* CAMPO DE VALOR PROMOCIONAL (R$) */}
            {(acaoMassa === 'preco_promocional' || (acaoMassa === 'destaque' && valorMassa === 'super_promocao')) && (
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-300 shadow-2xs">
                <span className="text-xs font-bold text-gray-500">Valor Promoção R$:</span>
                <input
                  type="text"
                  value={precoPromocionalMassa}
                  onChange={(e) => setPrecoPromocionalMassa(e.target.value)}
                  placeholder="Ex: 17,90"
                  autoFocus
                  className="bg-transparent text-secondary text-xs font-bold w-24 focus:outline-none"
                />
              </div>
            )}

            {acaoMassa === 'status' && (
              <select
                value={valorMassa}
                onChange={(e) => setValorMassa(e.target.value)}
                className="bg-white text-secondary border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="true">🟢 Ativo (Visível)</option>
                <option value="false">🔴 Inativo (Oculto)</option>
              </select>
            )}

            {/* Botão Executar */}
            <button
              type="button"
              onClick={executarEdicaoEmMassa}
              disabled={carregando}
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
                  <span>Aplicar em Massa</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TABELA DE PRODUTOS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs font-bold text-gray-500">
          <span>TOTAL EXIBIDO: {produtos.length} PRODUTO(S)</span>
          {selecionados.length > 0 && (
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
                  <th className="p-4 w-16">Foto</th>
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
                    const fotoUrl = extrairFoto(item.imagens);

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

                        {/* Foto */}
                        <td className="p-4">
                          <Link href={`/produto/${item.slug}`} target="_blank" title="Abrir página de vendas">
                            {fotoUrl ? (
                              <img
                                src={fotoUrl}
                                alt={item.nome}
                                className="w-12 h-12 object-cover rounded-xl border border-gray-200 hover:opacity-80 transition cursor-pointer shadow-2xs"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-400 text-center leading-tight">
                                Sem<br />Foto
                              </div>
                            )}
                          </Link>
                        </td>

                        {/* SKU */}
                        <td className="p-4 font-bold text-gray-500 font-mono text-xs">
                          {item.codigo_barras || 'Sem SKU'}
                        </td>

                        {/* Nome */}
                        <td className="p-4 font-bold text-gray-800">
                          <div className="flex items-center gap-2">
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
                          </div>
                        </td>

                        {/* Categoria / Subcategoria */}
                        <td className="p-4 text-xs font-semibold text-gray-600">
                          {(item as any).categoria_nome_exibicao || item.categorias?.nome || 'Sem Categoria'}
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
    </div>
  );
}
