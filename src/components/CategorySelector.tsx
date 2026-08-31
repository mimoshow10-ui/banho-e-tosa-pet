'use client';

import { useState } from 'react';

type Categoria = {
  id: string;
  nome: string;
  parent_id: string | null;
};

export default function CategorySelector({
  categorias,
  defaultCategoriaId,
}: {
  categorias: Categoria[];
  defaultCategoriaId: string | null;
}) {
  const categoriasPrincipais = categorias.filter((c) => !c.parent_id);
  const subcategorias = categorias.filter((c) => c.parent_id);

  let initialMainId = '';
  let initialSubId = '';

  if (defaultCategoriaId) {
    const defaultCat = categorias.find((c) => c.id === defaultCategoriaId);
    if (defaultCat) {
      if (defaultCat.parent_id) {
        initialSubId = defaultCat.id;
        initialMainId = defaultCat.parent_id;
      } else {
        initialMainId = defaultCat.id;
      }
    }
  }

  const [mainId, setMainId] = useState(initialMainId);
  const [subId, setSubId] = useState(initialSubId);

  const subcategoriasAtuais = subcategorias.filter((c) => c.parent_id === mainId);

  return (
    <>
      <input type="hidden" name="categoria_id" value={subId || mainId || ''} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Grupo</label>
          <select
            className="w-full border border-border rounded-lg p-2 bg-white"
            value={mainId}
            onChange={(e) => {
              setMainId(e.target.value);
              setSubId(''); 
            }}
          >
            <option value="">Nenhum Grupo</option>
            {categoriasPrincipais.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sub-Grupo</label>
          <select
            className="w-full border border-border rounded-lg p-2 bg-white disabled:opacity-50"
            value={subId}
            onChange={(e) => setSubId(e.target.value)}
            disabled={!mainId || subcategoriasAtuais.length === 0}
          >
            <option value="">
              {!mainId
                ? 'Selecione um Grupo primeiro'
                : subcategoriasAtuais.length === 0
                ? 'Nenhum Sub-Grupo cadastrado'
                : 'Nenhum (Deixar apenas no Grupo)'}
            </option>
            {subcategoriasAtuais.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}