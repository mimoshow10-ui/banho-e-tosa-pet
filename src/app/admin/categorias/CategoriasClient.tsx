'use client';

import { useState } from 'react';
import {
  Folder,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Layers,
  Sparkles,
  Edit3,
} from 'lucide-react';

type Categoria = {
  id: string;
  nome: string;
  slug: string;
  parent_id: string | null;
  criado_em?: string;
};

interface Props {
  categorias: Categoria[];
  addGrupoAction: (formData: FormData) => Promise<void>;
  addSubgrupoAction: (formData: FormData) => Promise<void>;
  editarCategoriaAction: (formData: FormData) => Promise<void>;
  excluirCategoriaAction: (formData: FormData) => Promise<void>;
}

export default function CategoriasClient({
  categorias,
  addGrupoAction,
  addSubgrupoAction,
  editarCategoriaAction,
  excluirCategoriaAction,
}: Props) {
  const grupos = categorias
    .filter((c) => !c.parent_id)
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));

  const subgrupos = categorias
    .filter((c) => c.parent_id)
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));

  // Estado dos grupos expandidos (Accordion)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    // Por padrão, expande todos os grupos
    const initial: Record<string, boolean> = {};
    grupos.forEach((g) => {
      initial[g.id] = true;
    });
    return initial;
  });

  // Estados dos Modais
  const [novoGrupoOpen, setNovoGrupoOpen] = useState(false);
  const [novoSubgrupoOpen, setNovoSubgrupoOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  // Estado de Edição Inline / Modal
  const [catEditando, setCatEditando] = useState<Categoria | null>(null);
  const [nomeEdit, setNomeEdit] = useState('');
  const [parentEdit, setParentEdit] = useState<string | null>(null);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function abrirNovoSubgrupo(grupoId?: string) {
    if (grupoId) {
      setSelectedParentId(grupoId);
    } else if (grupos.length > 0) {
      setSelectedParentId(grupos[0].id);
    }
    setNovoSubgrupoOpen(true);
  }

  function abrirEdicao(cat: Categoria) {
    setCatEditando(cat);
    setNomeEdit(cat.nome);
    setParentEdit(cat.parent_id || '');
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── BARRA SUPERIOR E BOTÕES DE AÇÃO ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-orange-100 text-primary flex items-center justify-center font-bold">
            <Layers size={22} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-secondary">Árvore de Grupos & Subgrupos</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span className="font-bold text-primary">{grupos.length} Grupos Principais</span>
              <span>•</span>
              <span className="font-bold text-purple-600">{subgrupos.length} Subgrupos</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setNovoGrupoOpen(true)}
            className="flex-1 sm:flex-none bg-primary hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} />
            <span>Novo Grupo Principal</span>
          </button>

          <button
            type="button"
            onClick={() => abrirNovoSubgrupo()}
            className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FolderPlus size={16} />
            <span>Novo Subgrupo</span>
          </button>
        </div>
      </div>

      {/* ── LISTA HIERÁRQUICA DE GRUPOS E SUBGRUPOS (ESTILO LOJA INTEGRADA) ── */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Cabeçalho da Tabela */}
        <div className="bg-gray-50/80 px-6 py-3.5 border-b border-gray-200 flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div className="flex items-center gap-3">
            <span className="w-6"></span>
            <span>Nome da Categoria (Grupo & Subgrupo)</span>
          </div>
          <div className="flex items-center gap-8">
            <span>Status</span>
            <span className="w-24 text-right">Ações</span>
          </div>
        </div>

        {grupos.length === 0 ? (
          <div className="text-center py-16 p-6 text-gray-400 space-y-3">
            <Folder size={40} className="mx-auto text-gray-300" />
            <p className="font-bold text-gray-600 text-sm">Nenhuma categoria cadastrada.</p>
            <p className="text-xs">Clique no botão acima para cadastrar seu primeiro Grupo!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {grupos.map((grupo) => {
              const subsDoGrupo = subgrupos.filter((s) => s.parent_id === grupo.id);
              const isExpanded = !!expandedIds[grupo.id];

              return (
                <div key={grupo.id} className="transition">
                  {/* LINHA DO GRUPO PAI */}
                  <div className="px-5 py-4 flex items-center justify-between bg-white hover:bg-orange-50/30 transition group">
                    <div className="flex items-center gap-3">
                      {/* Ícone de Pegada Drag & Drop */}
                      <GripVertical size={16} className="text-gray-300 group-hover:text-gray-400 cursor-grab" />

                      {/* Accordion Arrow Toggle */}
                      {subsDoGrupo.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(grupo.id)}
                          className="p-1 rounded-lg hover:bg-gray-200 text-gray-600 transition cursor-pointer"
                          title={isExpanded ? 'Recolher Subgrupos' : 'Expandir Subgrupos'}
                        >
                          {isExpanded ? <ChevronDown size={18} className="text-primary" /> : <ChevronRight size={18} />}
                        </button>
                      ) : (
                        <span className="w-6"></span>
                      )}

                      <div className="flex items-center gap-2.5">
                        <Folder size={20} className="text-primary flex-shrink-0" />
                        <div>
                          <span className="font-bold text-sm text-secondary">{grupo.nome}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-400 font-mono">/categoria/{grupo.slug}</span>
                            {subsDoGrupo.length > 0 && (
                              <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.2 rounded-full">
                                {subsDoGrupo.length} subgrupo(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Badge Status Ativo */}
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        ATIVO
                      </span>

                      {/* Ações do Grupo */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => abrirNovoSubgrupo(grupo.id)}
                          className="text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          title="Adicionar Subgrupo a este Grupo"
                        >
                          <Plus size={13} />
                          <span>Subgrupo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirEdicao(grupo)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Editar Nome do Grupo"
                        >
                          <Pencil size={16} />
                        </button>

                        <form action={excluirCategoriaAction}>
                          <input type="hidden" name="id" value={grupo.id} />
                          <button
                            type="submit"
                            onClick={(e) => {
                              if (subsDoGrupo.length > 0) {
                                alert('Não é possível excluir um grupo que possui subgrupos vinculados. Exclua ou mova os subgrupos primeiro.');
                                e.preventDefault();
                              } else if (!confirm(`Excluir o grupo "${grupo.nome}"?`)) {
                                e.preventDefault();
                              }
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Excluir Grupo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* SUBGRUPOS ANINHADOS DEBAIXO DO GRUPO (ESTILO ÁRVORE HIERÁRQUICA) */}
                  {isExpanded && subsDoGrupo.length > 0 && (
                    <div className="bg-slate-50/70 border-t border-b border-gray-100 pl-12 pr-5 py-2 space-y-1">
                      {subsDoGrupo.map((sub) => (
                        <div
                          key={sub.id}
                          className="py-2.5 px-4 bg-white rounded-xl border border-gray-200/80 flex items-center justify-between hover:border-purple-300 transition text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-purple-400 font-mono font-bold text-sm">↳</span>
                            <div>
                              <span className="font-bold text-gray-900">{sub.nome}</span>
                              <span className="text-[10px] text-gray-400 font-mono block">
                                /categoria/{sub.slug}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              ATIVO
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => abrirEdicao(sub)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                                title="Editar Subgrupo"
                              >
                                <Pencil size={14} />
                              </button>

                              <form action={excluirCategoriaAction}>
                                <input type="hidden" name="id" value={sub.id} />
                                <button
                                  type="submit"
                                  onClick={(e) => {
                                    if (!confirm(`Excluir o subgrupo "${sub.nome}"?`)) {
                                      e.preventDefault();
                                    }
                                  }}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded-md transition cursor-pointer"
                                  title="Excluir Subgrupo"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </form>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL 1: CADASTRAR NOVO GRUPO PRINCIPAL ── */}
      {novoGrupoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-lg text-secondary flex items-center gap-2">
                <Folder size={22} className="text-primary" />
                Cadastrar Novo Grupo Principal
              </h3>
              <button
                type="button"
                onClick={() => setNovoGrupoOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await addGrupoAction(formData);
                setNovoGrupoOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Grupo Principal *</label>
                <input
                  name="nome"
                  type="text"
                  required
                  placeholder="Ex: Brinquedos Pet"
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Salvar Grupo Principal
                </button>
                <button
                  type="button"
                  onClick={() => setNovoGrupoOpen(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-3.5 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CADASTRAR NOVO SUBGRUPO ── */}
      {novoSubgrupoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-lg text-secondary flex items-center gap-2">
                <FolderPlus size={22} className="text-purple-600" />
                Cadastrar Novo Subgrupo
              </h3>
              <button
                type="button"
                onClick={() => setNovoSubgrupoOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await addSubgrupoAction(formData);
                setNovoSubgrupoOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Subgrupo *</label>
                <input
                  name="nome"
                  type="text"
                  required
                  placeholder="Ex: Mordedores Holográficos"
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pertence ao Grupo Principal: *</label>
                <select
                  name="group_id"
                  required
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-white font-bold text-secondary focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">Selecione o Grupo Pai...</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Salvar Subgrupo
                </button>
                <button
                  type="button"
                  onClick={() => setNovoSubgrupoOpen(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-3.5 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: EDITAR CATEGORIA (GRUPO OU SUBGRUPO) ── */}
      {catEditando && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-lg text-secondary flex items-center gap-2">
                <Edit3 size={20} className="text-blue-600" />
                Editar {catEditando.parent_id ? 'Subgrupo' : 'Grupo'}: {catEditando.nome}
              </h3>
              <button
                type="button"
                onClick={() => setCatEditando(null)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await editarCategoriaAction(formData);
                setCatEditando(null);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={catEditando.id} />

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome da Categoria *</label>
                <input
                  name="nome"
                  type="text"
                  required
                  value={nomeEdit}
                  onChange={(e) => setNomeEdit(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {catEditando.parent_id !== null && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Grupo Principal Vinculado:</label>
                  <select
                    name="parent_id"
                    value={parentEdit || ''}
                    onChange={(e) => setParentEdit(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-white font-bold text-secondary"
                  >
                    {grupos.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Atualizar Categoria
                </button>
                <button
                  type="button"
                  onClick={() => setCatEditando(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-3.5 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
