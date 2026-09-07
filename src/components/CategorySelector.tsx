'use client';

import { useState } from 'react';
import { Layers, Folder, Tag, Check, Search } from 'lucide-react';

type Categoria = {
  id: string;
  nome: string;
  parent_id: string | null;
};

export default function CategorySelector({
  categorias = [],
  defaultCategoriaId,
  defaultCategoriasAdicionais = [],
}: {
  categorias?: Categoria[];
  defaultCategoriaId?: string | null;
  defaultCategoriasAdicionais?: string[];
}) {
  const list = Array.isArray(categorias) ? categorias : [];
  const grupos = list.filter((c) => c && !c.parent_id);
  const subgrupos = list.filter((c) => c && Boolean(c.parent_id));

  // Inicializar IDs selecionados a partir das props
  const initialSet = new Set<string>();
  if (defaultCategoriaId) initialSet.add(defaultCategoriaId);
  if (Array.isArray(defaultCategoriasAdicionais)) {
    defaultCategoriasAdicionais.forEach((id) => {
      if (id) initialSet.add(id);
    });
  }

  const [selectedIds, setSelectedIds] = useState<string[]>(Array.from(initialSet));
  const [busca, setBusca] = useState('');

  // Categoria principal é o primeiro ID selecionado (ou subgrupo se houver)
  const primaryId = selectedIds.length > 0 ? selectedIds[0] : '';
  const adicionaisIds = selectedIds.length > 1 ? selectedIds.slice(1) : [];

  function toggleCategoria(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  function selecionarTudoGrupo(grupoId: string) {
    const subIds = subgrupos.filter((s) => s.parent_id === grupoId).map((s) => s.id);
    const todosDoGrupo = [grupoId, ...subIds];
    const novos = new Set([...selectedIds, ...todosDoGrupo]);
    setSelectedIds(Array.from(novos));
  }

  function desmarcarTudoGrupo(grupoId: string) {
    const subIds = subgrupos.filter((s) => s.parent_id === grupoId).map((s) => s.id);
    const todosDoGrupo = new Set([grupoId, ...subIds]);
    setSelectedIds(selectedIds.filter((id) => !todosDoGrupo.has(id)));
  }

  // Filtragem por busca rápida
  const buscaLower = busca.trim().toLowerCase();
  const gruposFiltrados = grupos.filter((g) => {
    if (!buscaLower) return true;
    if (g.nome.toLowerCase().includes(buscaLower)) return true;
    const subs = subgrupos.filter((s) => s.parent_id === g.id);
    return subs.some((s) => s.nome.toLowerCase().includes(buscaLower));
  });

  return (
    <div className="space-y-4 bg-gray-50 p-6 rounded-3xl border border-gray-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h3 className="text-base font-bold text-secondary flex items-center gap-2">
            <Layers size={20} className="text-primary" />
            Grupos e Subgrupos do Produto
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Marque a caixinha de cada Grupo ou Subgrupo onde este produto deve ser exibido na loja.
          </p>
        </div>

        <div className="bg-white px-3 py-1.5 rounded-2xl border border-gray-300 text-xs font-bold text-gray-700 shadow-2xs flex items-center gap-1.5 self-start sm:self-auto">
          <span>{selectedIds.length} selecionado(s)</span>
          {selectedIds.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>
      </div>

      {/* Campos Ocultos para envio do formulário */}
      <input type="hidden" name="categoria_id" value={primaryId || ''} />
      <input type="hidden" name="categorias_adicionais" value={JSON.stringify(selectedIds)} />

      {/* Barra de Busca Rápida de Grupos */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="🔍 Digite para buscar um Grupo ou Subgrupo..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-primary focus:outline-none shadow-2xs"
        />
      </div>

      {/* ÁRVORE VISUAL COM CHECKBOXES (TICAR) */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {gruposFiltrados.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-gray-300 text-xs text-gray-400 font-bold">
            Nenhum grupo ou subgrupo encontrado com &quot;{busca}&quot;.
          </div>
        ) : (
          gruposFiltrados.map((g) => {
            const isGrupoSelected = selectedIds.includes(g.id);
            const subs = subgrupos.filter((s) => s.parent_id === g.id);
            const subsSelecionados = subs.filter((s) => selectedIds.includes(s.id));
            const todosSubsMarcados = subs.length > 0 && subsSelecionados.length === subs.length;

            return (
              <div
                key={g.id}
                className={`rounded-2xl border transition-all duration-200 p-4 space-y-3 ${
                  isGrupoSelected || subsSelecionados.length > 0
                    ? 'bg-orange-50/60 border-orange-300 shadow-2xs'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Cabeçalho do Grupo Principal */}
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                    <input
                      type="checkbox"
                      checked={isGrupoSelected}
                      onChange={() => toggleCategoria(g.id)}
                      className="w-5 h-5 accent-orange-600 rounded cursor-pointer flex-shrink-0"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Folder size={18} className={isGrupoSelected ? 'text-primary' : 'text-gray-400'} />
                      <span className={`text-sm font-black ${isGrupoSelected ? 'text-primary' : 'text-gray-800'}`}>
                        {g.nome}
                      </span>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                        Grupo Principal
                      </span>
                    </div>
                  </label>

                  {/* Atalho para Marcar/Desmarcar Todos os Subgrupos deste Grupo */}
                  {subs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => (todosSubsMarcados ? desmarcarTudoGrupo(g.id) : selecionarTudoGrupo(g.id))}
                      className="text-[11px] font-bold text-gray-500 hover:text-primary hover:underline cursor-pointer flex-shrink-0"
                    >
                      {todosSubsMarcados ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                  )}
                </div>

                {/* Subgrupos Pertencentes a este Grupo */}
                {subs.length > 0 && (
                  <div className="pl-6 pt-1 border-l-2 border-orange-200/80 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {subs.map((sub) => {
                        const isSubSelected = selectedIds.includes(sub.id);

                        return (
                          <label
                            key={sub.id}
                            className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2.5 cursor-pointer select-none ${
                              isSubSelected
                                ? 'bg-white border-orange-400 text-orange-950 font-black shadow-2xs ring-1 ring-orange-400'
                                : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 font-medium'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSubSelected}
                              onChange={() => toggleCategoria(sub.id)}
                              className="w-4 h-4 accent-orange-600 rounded cursor-pointer flex-shrink-0"
                            />
                            <Tag size={13} className={isSubSelected ? 'text-primary' : 'text-gray-400'} />
                            <span className="text-xs truncate">{sub.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}