'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, X, Link2, Search } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  codigo_barras?: string | null;
  imagens?: string[] | string | null;
  preco: number;
}

interface Props {
  parentId?: string;
  currentProdutoId?: string;
  produtoId?: string;
  variacoesIniciais?: Produto[];
  variacoes?: Produto[];
  todosProdutos?: Produto[];
}

export default function VariacaoManager({
  parentId,
  currentProdutoId,
  produtoId,
  variacoesIniciais,
  variacoes,
  todosProdutos = [],
}: Props) {
  const initialVars = Array.isArray(variacoesIniciais)
    ? variacoesIniciais
    : Array.isArray(variacoes)
    ? variacoes
    : [];

  const [grupo, setGrupo] = useState<Produto[]>(initialVars);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const targetPaiId = parentId || produtoId || currentProdutoId;
  const selfId = currentProdutoId || produtoId;

  const prods = Array.isArray(todosProdutos) ? todosProdutos : [];

  const disponiveis = prods.filter((p) => {
    if (!p || !p.id) return false;
    if (selfId && p.id === selfId) return false;
    if (Array.isArray(grupo) && grupo.some((g) => g && g.id === p.id)) return false;

    const nomeMatch = (p.nome || '').toLowerCase().includes(busca.toLowerCase());
    const skuMatch = (p.codigo_barras || '').toLowerCase().includes(busca.toLowerCase());
    return nomeMatch || skuMatch;
  });

  async function vincular(filho: Produto) {
    if (!targetPaiId || !filho.id) return;

    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/variacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paiId: targetPaiId, filhoId: filho.id }),
      });
      if (res.ok) {
        setGrupo((prev) => [...(prev || []), filho]);
        setBusca('');
        setMsg('Variação vinculada!');
      } else {
        const j = await res.json();
        setMsg('Erro: ' + (j.error || j.erro || 'Falha ao vincular'));
      }
    } catch {
      setMsg('Erro ao se comunicar com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function desvincular(filhoId: string) {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/variacoes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filhoId }),
      });
      if (res.ok) {
        setGrupo((prev) => (prev || []).filter((item) => item.id !== filhoId));
        setMsg('Variação removida!');
      } else {
        const j = await res.json();
        setMsg('Erro: ' + (j.error || j.erro || 'Falha ao desvincular'));
      }
    } catch {
      setMsg('Erro ao se comunicar com o servidor.');
    } finally {
      setLoading(false);
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
      {msg && (
        <div className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold">
          {msg}
        </div>
      )}

      {/* Lista de Variações Atuais */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Variações Vinculadas ({grupo.length})
        </h4>

        {grupo.length === 0 ? (
          <p className="text-xs text-gray-400 font-medium italic bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
            Nenhuma variação vinculada a este produto. Use a busca abaixo para vincular outros tamanhos ou pacotes.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {grupo.map((item) => {
              const foto = extrairFoto(item.imagens);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {foto ? (
                      <img
                        src={foto}
                        alt={item.nome}
                        className="w-8 h-8 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-[8px] font-bold text-gray-500">
                        Foto
                      </div>
                    )}
                    <div className="truncate">
                      <p className="truncate text-gray-900">{item.nome}</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {item.codigo_barras || 'Sem SKU'} • R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => desvincular(item.id)}
                    disabled={loading}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition cursor-pointer"
                    title="Remover Variação"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Buscar e Vincular Novos Produtos */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <label className="block text-xs font-bold text-gray-700">
          🔍 Adicionar Produto como Variação
        </label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite o nome ou SKU do produto para vincular..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {busca.trim() && (
          <div className="max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg divide-y divide-gray-100 mt-1">
            {disponiveis.length === 0 ? (
              <div className="p-3 text-xs text-gray-400 text-center font-bold">
                Nenhum produto disponível encontrado.
              </div>
            ) : (
              disponiveis.map((prod) => {
                const foto = extrairFoto(prod.imagens);
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => vincular(prod)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-2.5 text-left hover:bg-orange-50 transition cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {foto ? (
                        <img
                          src={foto}
                          alt={prod.nome}
                          className="w-7 h-7 object-cover rounded-md border border-gray-200"
                        />
                      ) : (
                        <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center text-[7px] font-bold text-gray-400">
                          Sem foto
                        </div>
                      )}
                      <div className="truncate">
                        <span className="font-bold text-gray-800">{prod.nome}</span>
                        <span className="text-[10px] text-gray-400 font-mono ml-2">
                          ({prod.codigo_barras || 'Sem SKU'})
                        </span>
                      </div>
                    </div>

                    <span className="bg-primary text-white font-bold text-[10px] px-2 py-1 rounded-md flex items-center gap-1 shadow-2xs">
                      <Link2 size={10} /> Vincular
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
