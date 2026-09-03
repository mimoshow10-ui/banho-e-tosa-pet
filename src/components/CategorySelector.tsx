'use client';

import { useState } from 'react';

type Categoria = {
  id: string;
  nome: string;
  parent_id: string | null;
};

export default function CategorySelector({
  categorias = [],
  defaultCategoriaId,
}: {
  categorias?: Categoria[];
  defaultCategoriaId?: string | null;
}) {
  const list = Array.isArray(categorias) ? categorias : [];
  const grupos = list.filter((c) => c && !c.parent_id);
  const subgrupos = list.filter((c) => c && Boolean(c.parent_id));

  let initialGrupoId = '';
  let initialSubgrupoId = '';

  if (defaultCategoriaId && list.length > 0) {
    const defaultCat = list.find((c) => c && c.id === defaultCategoriaId);
    if (defaultCat) {
      if (defaultCat.parent_id) {
        initialSubgrupoId = defaultCat.id;
        initialGrupoId = defaultCat.parent_id;
      } else {
        initialGrupoId = defaultCat.id;
      }
    }
  }

  const [grupoId, setGrupoId] = useState(initialGrupoId);
  const [subgrupoId, setSubgrupoId] = useState(initialSubgrupoId);

  // Filtra APENAS os subgrupos que pertencem ao grupo selecionado
  const subgruposFiltrados = subgrupos.filter((c) => c && c.parent_id === grupoId);

  return (
    <div className="space-y-4">
      {/* Campo oculto que envia o ID final para o backend */}
      <input type="hidden" name="categoria_id" value={subgrupoId || grupoId || ''} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Grupo do Produto *
          </label>
          <select
            className="w-full border border-gray-300 rounded-xl p-3 bg-white text-sm font-bold text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            value={grupoId}
            onChange={(e) => {
              setGrupoId(e.target.value);
              setSubgrupoId(''); // Reseta o subgrupo ao trocar de grupo
            }}
            required
          >
            <option value="">Selecione o Grupo do produto...</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Subgrupo (Opcional)
          </label>
          <select
            className="w-full border border-gray-300 rounded-xl p-3 bg-white text-sm font-medium text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:bg-gray-50"
            value={subgrupoId}
            onChange={(e) => setSubgrupoId(e.target.value)}
            disabled={!grupoId || subgruposFiltrados.length === 0}
          >
            <option value="">
              {!grupoId
                ? '← Escolha o Grupo primeiro'
                : subgruposFiltrados.length === 0
                ? 'Nenhum Subgrupo neste Grupo'
                : 'Nenhum Subgrupo (Vincular apenas ao Grupo)'}
            </option>
            {subgruposFiltrados.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
          {grupoId && subgruposFiltrados.length > 0 && (
            <p className="text-[11px] text-purple-700 font-medium mt-1">
              ✓ {subgruposFiltrados.length} subgrupo(s) disponível(is) para este Grupo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}