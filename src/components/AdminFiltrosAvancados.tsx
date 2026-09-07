'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, RotateCcw, Image as ImageIcon, Flame, Tag, CheckSquare, Square, FolderTree } from 'lucide-react';

interface Categoria {
  id: string;
  nome: string;
  parent_id: string | null;
}

interface Props {
  categorias: Categoria[];
}

export default function AdminFiltrosAvancados({ categorias }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [grupoId, setGrupoId] = useState(searchParams.get('grupo_id') || '');
  const [subgrupoId, setSubgrupoId] = useState(searchParams.get('subgrupo_id') || '');
  const [comFoto, setComFoto] = useState(searchParams.get('com_foto') || '');
  const [promocao, setPromocao] = useState(searchParams.get('promocao') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');

  // Separar Grupos Principais (sem parent_id) e Subgrupos
  const gruposPrincipais = categorias.filter(c => !c.parent_id);
  const subgruposDisponiveis = grupoId 
    ? categorias.filter(c => c.parent_id === grupoId)
    : categorias.filter(c => !!c.parent_id);

  function aplicarFiltros(e?: React.FormEvent) {
    if (e) e.preventDefault();

    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (grupoId) params.set('grupo_id', grupoId);
    if (subgrupoId) params.set('subgrupo_id', subgrupoId);
    if (comFoto) params.set('com_foto', comFoto);
    if (promocao) params.set('promocao', promocao);
    if (status) params.set('status', status);
    params.set('pagina', '1');

    router.push(`/admin/produtos?${params.toString()}`);
  }

  function limparFiltros() {
    setQ('');
    setGrupoId('');
    setSubgrupoId('');
    setComFoto('');
    setPromocao('');
    setStatus('');
    router.push('/admin/produtos');
  }

  const temFiltroAtivo = !!(q || grupoId || subgrupoId || comFoto || promocao || status);

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-bold text-secondary text-sm flex items-center gap-2">
          <Filter size={16} className="text-primary" />
          <span>Filtros Avançados de Produtos</span>
        </h3>
        {temFiltroAtivo && (
          <button
            type="button"
            onClick={limparFiltros}
            className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Limpar Filtros</span>
          </button>
        )}
      </div>

      <form onSubmit={aplicarFiltros} className="space-y-4">
        {/* 1. Busca por Nome ou SKU */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar por Nome do Produto, Código SKU ou Código de Barras..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="bg-primary hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Filter size={14} />
            <span>Filtrar</span>
          </button>
        </div>

        {/* 2. Seletores de Grupo e Subgrupo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center gap-1">
              <FolderTree size={13} className="text-gray-500" />
              <span>Grupo Principal:</span>
            </label>
            <select
              value={grupoId}
              onChange={(e) => {
                setGrupoId(e.target.value);
                setSubgrupoId('');
              }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary bg-white cursor-pointer"
            >
              <option value="">Todos os Grupos Principais</option>
              {gruposPrincipais.map((g) => (
                <option key={g.id} value={g.id}>
                  📂 {g.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center gap-1">
              <Tag size={13} className="text-gray-500" />
              <span>Subgrupo:</span>
            </label>
            <select
              value={subgrupoId}
              onChange={(e) => setSubgrupoId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary bg-white cursor-pointer"
            >
              <option value="">Todos os Subgrupos</option>
              {subgruposDisponiveis.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  🏷️ {sub.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Caixa de Opções Ticáveis (Checkboxes) */}
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs font-bold text-gray-700">
          
          {/* Opção Foto: Apenas com Foto */}
          <label className="flex items-center gap-2 cursor-pointer select-none bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
            <input
              type="checkbox"
              checked={comFoto === 'sim'}
              onChange={(e) => setComFoto(e.target.checked ? 'sim' : '')}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <ImageIcon size={14} className="text-blue-600" />
              <span>📷 Com Foto (Publicados)</span>
            </span>
          </label>

          {/* Opção Foto: Apenas Sem Foto */}
          <label className="flex items-center gap-2 cursor-pointer select-none bg-amber-50/60 hover:bg-amber-100/60 px-3 py-1.5 rounded-xl border border-amber-200">
            <input
              type="checkbox"
              checked={comFoto === 'nao'}
              onChange={(e) => setComFoto(e.target.checked ? 'nao' : '')}
              className="accent-amber-600 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-amber-800">
              <span>🟡 Sem Foto (Não Publicados)</span>
            </span>
          </label>

          {/* Opção Promoção */}
          <label className="flex items-center gap-2 cursor-pointer select-none bg-red-50/60 hover:bg-red-100/60 px-3 py-1.5 rounded-xl border border-red-200">
            <input
              type="checkbox"
              checked={promocao === 'sim'}
              onChange={(e) => setPromocao(e.target.checked ? 'sim' : '')}
              className="accent-red-600 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-red-700">
              <Flame size={14} className="text-red-600" />
              <span>🔥 Em Promoção</span>
            </span>
          </label>

          {/* Opção Status: Ativo */}
          <label className="flex items-center gap-2 cursor-pointer select-none bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-xl border border-green-200">
            <input
              type="checkbox"
              checked={status === 'ativo'}
              onChange={(e) => setStatus(e.target.checked ? 'ativo' : '')}
              className="accent-green-600 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-green-800">
              <span>🟢 Apenas Ativos</span>
            </span>
          </label>

          {/* Opção Status: Inativo */}
          <label className="flex items-center gap-2 cursor-pointer select-none bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl border border-gray-300">
            <input
              type="checkbox"
              checked={status === 'inativo'}
              onChange={(e) => setStatus(e.target.checked ? 'inativo' : '')}
              className="accent-gray-600 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-gray-700">
              <span>🔴 Apenas Inativos</span>
            </span>
          </label>
        </div>
      </form>
    </div>
  );
}
