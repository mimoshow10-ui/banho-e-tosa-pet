'use client';

import { useState } from 'react';
import { Layers, Plus, Check, ChevronDown, ChevronUp, Tag } from 'lucide-react';

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
  const [adicionais, setAdicionais] = useState<string[]>(defaultCategoriasAdicionais || []);
  const [mostrarAdicionais, setMostrarAdicionais] = useState<boolean>(defaultCategoriasAdicionais.length > 0);

  // Filtra os subgrupos pertencentes ao grupo primário selecionado
  const subgruposFiltrados = subgrupos.filter((c) => c && c.parent_id === grupoId);

  // Categoria principal selecionada no momento
  const primaryId = subgrupoId || grupoId;

  function toggleAdicional(id: string) {
    if (id === primaryId) return; // Não vincula o principal como adicional
    if (adicionais.includes(id)) {
      setAdicionais(adicionais.filter((item) => item !== id));
    } else {
      setAdicionais([...adicionais, id]);
    }
  }

  return (
    <div className="space-y-4 bg-gray-50/80 p-5 rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h3 className="text-sm font-bold text-secondary flex items-center gap-2">
          <Layers size={18} className="text-primary" />
          Categorias & Grupos do Produto
        </h3>
        <span className="text-xs text-gray-500 font-medium">
          Defina o grupo principal e adicione outros se desejar
        </span>
      </div>

      {/* Campo oculto que envia a Categoria Principal */}
      <input type="hidden" name="categoria_id" value={primaryId || ''} />
      
      {/* Campo oculto em JSON com as Categorias Adicionais */}
      <input type="hidden" name="categorias_adicionais" value={JSON.stringify(adicionais)} />

      {/* SELEÇÃO PRIMÁRIA: GRUPO E SUBGRUPO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Grupo Principal <span className="text-gray-400 font-normal">(Opcional)</span>
          </label>
          <select
            className="w-full border border-gray-300 rounded-xl p-3 bg-white text-sm font-bold text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            value={grupoId}
            onChange={(e) => {
              setGrupoId(e.target.value);
              setSubgrupoId('');
            }}
          >
            <option value="">⚠️ Sem Grupo (Definir Depois)</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Subgrupo Principal <span className="text-gray-400 font-normal">(Opcional)</span>
          </label>
          <select
            className="w-full border border-gray-300 rounded-xl p-3 bg-white text-sm font-medium text-secondary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-gray-100"
            value={subgrupoId}
            onChange={(e) => setSubgrupoId(e.target.value)}
            disabled={!grupoId || subgruposFiltrados.length === 0}
          >
            <option value="">
              {!grupoId
                ? '← Escolha um Grupo primeiro (Opcional)'
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
        </div>
      </div>

      {!grupoId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2">
          <span>⚠️ <strong>Aviso:</strong> Este produto será salvo sem categoria/grupo vinculado. Você pode categorizá-lo a qualquer momento.</span>
        </div>
      )}

      {/* SELEÇÃO MULTI-CATEGORIAS / VINCULAÇÃO ADICIONAL */}
      <div className="pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setMostrarAdicionais(!mostrarAdicionais)}
          className="text-xs font-bold text-primary hover:text-orange-700 flex items-center gap-1.5 cursor-pointer py-1 transition"
        >
          <Tag size={15} />
          <span>
            {mostrarAdicionais ? 'Ocultar Múltiplas Categorias' : '+ Vincular a mais Grupos ou Subgrupos'}
          </span>
          {adicionais.length > 0 && (
            <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
              {adicionais.length} selecionada(s)
            </span>
          )}
          {mostrarAdicionais ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {mostrarAdicionais && (
          <div className="mt-3 bg-white p-4 rounded-xl border border-gray-200 space-y-4 animate-fade-in">
            <p className="text-xs text-gray-600">
              Selecione outros Grupos ou Subgrupos onde este produto também deve aparecer na loja:
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {grupos.map((g) => {
                const subsDoGrupo = subgrupos.filter((s) => s.parent_id === g.id);
                const isGrupoSelected = adicionais.includes(g.id);

                return (
                  <div key={g.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleAdicional(g.id)}
                        disabled={primaryId === g.id}
                        className={`text-xs font-bold flex items-center gap-2 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          primaryId === g.id
                            ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed opacity-60'
                            : isGrupoSelected
                            ? 'bg-primary text-white border-primary shadow-2xs'
                            : 'bg-white text-gray-800 border-gray-300 hover:border-primary'
                        }`}
                      >
                        {isGrupoSelected && <Check size={12} />}
                        <span>Grupo: {g.nome}</span>
                        {primaryId === g.id && <span className="text-[10px] text-gray-500">(Principal)</span>}
                      </button>
                    </div>

                    {subsDoGrupo.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-3 border-l-2 border-orange-200">
                        {subsDoGrupo.map((sub) => {
                          const isSubSelected = adicionais.includes(sub.id);
                          const isPrimarySub = primaryId === sub.id;

                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => toggleAdicional(sub.id)}
                              disabled={isPrimarySub}
                              className={`text-[11px] font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                                isPrimarySub
                                  ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed opacity-60'
                                  : isSubSelected
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-400'
                              }`}
                            >
                              {isSubSelected && <Check size={11} />}
                              <span>{sub.nome}</span>
                              {isPrimarySub && <span className="text-[9px]">(Principal)</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}