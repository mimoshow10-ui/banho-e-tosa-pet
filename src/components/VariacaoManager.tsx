'use client'

import { useState } from 'react';
import Image from 'next/image';
import { Star, X, Link2, Search } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  codigo_barras: string;
  imagens: string[];
  preco: number;
}

interface Props {
  produtoId: string;
  variacoes: Produto[];
  todosProdutos: Produto[];
}

export default function VariacaoManager({ produtoId, variacoes, todosProdutos }: Props) {
  const [grupo, setGrupo] = useState<Produto[]>(variacoes);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const disponiveis = todosProdutos.filter(p =>
    p.id !== produtoId &&
    !grupo.find(g => g.id === p.id) &&
    (p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.codigo_barras || '').toLowerCase().includes(busca.toLowerCase()))
  );

  async function vincular(filho: Produto) {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/variacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paiId: produtoId, filhoId: filho.id })
      });
      if (res.ok) {
        setGrupo(prev => [...prev, filho]);
        setBusca('');
        setMsg('Variação vinculada!');
      } else {
        const j = await res.json();
        setMsg('Erro: ' + j.error);
      }
    } catch (e) {
      setMsg('Erro de conexão');
    }
    setLoading(false);
  }

  async function desvincular(filho: Produto) {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/variacoes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filhoId: filho.id })
      });
      if (res.ok) {
        setGrupo(prev => prev.filter(g => g.id !== filho.id));
        setMsg('Variação removida!');
      } else {
        const j = await res.json();
        setMsg('Erro: ' + j.error);
      }
    } catch (e) {
      setMsg('Erro de conexão');
    }
    setLoading(false);
  }

  return (
    <div className="border border-yellow-300 bg-yellow-50 rounded-xl p-4">
      <h3 className="font-bold text-secondary mb-1 flex items-center gap-2">
        <Star size={16} className="text-yellow-500 fill-yellow-500" />
        Variações / Grupo (AliExpress)
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Produtos vinculados aqui aparecerão como opções clicáveis na tela de vendas.
      </p>

      {/* Variações já no grupo */}
      {grupo.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {grupo.map(v => (
            <div key={v.id} className="flex items-center gap-2 bg-white border border-yellow-300 rounded-lg px-3 py-2 text-sm shadow-sm">
              {v.imagens?.[0] && (
                <div className="w-8 h-8 relative rounded overflow-hidden flex-shrink-0">
                  <Image src={v.imagens[0]} alt={v.nome} fill className="object-cover" sizes="32px" />
                </div>
              )}
              <div className="max-w-[150px]">
                <p className="font-bold text-xs truncate">{v.nome}</p>
                <p className="text-gray-400 text-xs">{v.codigo_barras}</p>
              </div>
              <button
                type="button"
                onClick={() => desvincular(v)}
                disabled={loading}
                className="text-red-400 hover:text-red-600 transition ml-1"
                title="Remover do grupo"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic mb-4">Nenhuma variação vinculada ainda.</p>
      )}

      {/* Busca para adicionar */}
      <div className="relative mb-2">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar produto para vincular..."
          className="w-full border border-border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {busca && disponiveis.length > 0 && (
        <div className="border border-border rounded-lg bg-white max-h-48 overflow-y-auto">
          {disponiveis.slice(0, 10).map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => vincular(p)}
              disabled={loading}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-yellow-50 transition text-left text-sm border-b border-gray-100 last:border-0"
            >
              {p.imagens?.[0] && (
                <div className="w-8 h-8 relative rounded overflow-hidden flex-shrink-0">
                  <Image src={p.imagens[0]} alt={p.nome} fill className="object-cover" sizes="32px" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.nome}</p>
                <p className="text-gray-400 text-xs">{p.codigo_barras} · R$ {Number(p.preco).toFixed(2).replace('.', ',')}</p>
              </div>
              <Link2 size={14} className="text-yellow-500 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {busca && disponiveis.length === 0 && (
        <p className="text-xs text-gray-400 italic px-1">Nenhum produto encontrado.</p>
      )}

      {msg && (
        <p className={`text-xs font-bold mt-2 ${msg.startsWith('Erro') ? 'text-red-500' : 'text-green-600'}`}>
          {msg}
        </p>
      )}
    </div>
  );
}
