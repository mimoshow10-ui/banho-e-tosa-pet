'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, RotateCcw, Image as ImageIcon, Flame, Tag, FolderTree, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

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
  const [classificacao, setClassificacao] = useState(searchParams.get('classificacao') || '');
  const [qtdFotos, setQtdFotos] = useState(searchParams.get('qtd_fotos') || '');

  // Separar Grupos Principais (sem parent_id) e Subgrupos em ordem alfabética (A-Z)
  const gruposPrincipais = categorias
    .filter(c => !c.parent_id)
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));

  const subgruposDisponiveis = (grupoId 
    ? categorias.filter(c => c.parent_id === grupoId)
    : categorias.filter(c => !!c.parent_id))
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));

  function aplicarFiltrosDireto(novosValores?: {
    q?: string;
    grupoId?: string;
    subgrupoId?: string;
    comFoto?: string;
    promocao?: string;
    status?: string;
    classificacao?: string;
    qtdFotos?: string;
  }) {
    const valQ = novosValores?.q !== undefined ? novosValores.q : q;
    const valGrupo = novosValores?.grupoId !== undefined ? novosValores.grupoId : grupoId;
    const valSubgrupo = novosValores?.subgrupoId !== undefined ? novosValores.subgrupoId : subgrupoId;
    const valFoto = novosValores?.comFoto !== undefined ? novosValores.comFoto : comFoto;
    const valPromo = novosValores?.promocao !== undefined ? novosValores.promocao : promocao;
    const valStatus = novosValores?.status !== undefined ? novosValores.status : status;
    const valClass = novosValores?.classificacao !== undefined ? novosValores.classificacao : classificacao;
    const valQtdFotos = novosValores?.qtdFotos !== undefined ? novosValores.qtdFotos : qtdFotos;

    const params = new URLSearchParams();
    if (valQ.trim()) params.set('q', valQ.trim());
    if (valGrupo) params.set('grupo_id', valGrupo);
    if (valSubgrupo) params.set('subgrupo_id', valSubgrupo);
    if (valFoto) params.set('com_foto', valFoto);
    if (valPromo) params.set('promocao', valPromo);
    if (valStatus) params.set('status', valStatus);
    if (valClass) params.set('classificacao', valClass);
    if (valQtdFotos) params.set('qtd_fotos', valQtdFotos);
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
    setClassificacao('');
    setQtdFotos('');
    router.push('/admin/produtos');
  }

  const temFiltroAtivo = !!(q || grupoId || subgrupoId || comFoto || promocao || status || classificacao || qtdFotos);

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4 font-sans">
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

      <form onSubmit={(e) => { e.preventDefault(); aplicarFiltrosDireto(); }} className="space-y-4">
        {/* 1. Busca por Nome ou SKU */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar por Nome do Produto, Código SKU ou Código de Barras..."
              className="w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ('');
                  aplicarFiltrosDireto({ q: '' });
                }}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-red-600 font-black text-xs cursor-pointer p-0.5"
                title="Limpar pesquisa por texto"
              >
                ✕
              </button>
            )}
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
                const val = e.target.value;
                setGrupoId(val);
                setSubgrupoId('');
                aplicarFiltrosDireto({ grupoId: val, subgrupoId: '' });
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
              onChange={(e) => {
                const val = e.target.value;
                setSubgrupoId(val);
                aplicarFiltrosDireto({ subgrupoId: val });
              }}
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

        {/* 3. Caixa de Opções Ticáveis Instantâneas (Checkboxes) */}
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs font-bold text-gray-700">
          
          {/* Opção Foto: Apenas com Foto */}
          <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border transition ${
            comFoto === 'sim' ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-2xs font-black' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
          }`}>
            <input
              type="checkbox"
              checked={comFoto === 'sim'}
              onChange={(e) => {
                const val = e.target.checked ? 'sim' : '';
                setComFoto(val);
                aplicarFiltrosDireto({ comFoto: val });
              }}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <ImageIcon size={14} className="text-blue-600" />
              <span>📷 Com Foto (Publicados)</span>
            </span>
          </label>

          {/* Opção Foto: Apenas Sem Foto */}
          <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border transition ${
            comFoto === 'nao' ? 'bg-amber-200 border-amber-400 text-amber-950 shadow-2xs font-black' : 'bg-amber-50/60 hover:bg-amber-100/60 border-amber-200'
          }`}>
            <input
              type="checkbox"
              checked={comFoto === 'nao'}
              onChange={(e) => {
                const val = e.target.checked ? 'nao' : '';
                setComFoto(val);
                aplicarFiltrosDireto({ comFoto: val });
              }}
              className="accent-amber-600 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-amber-800">
              <span>🟡 Sem Foto (Não Publicados)</span>
            </span>
          </label>

          {/* 🟢 Filtro de Classificação: Grupo & Subgrupo OK */}
          <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border transition ${
            classificacao === 'ok' ? 'bg-emerald-200 border-emerald-500 text-emerald-950 shadow-2xs font-black' : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
          }`}>
            <input
              type="checkbox"
              checked={classificacao === 'ok'}
              onChange={(e) => {
                const val = e.target.checked ? 'ok' : '';
                setClassificacao(val);
                aplicarFiltrosDireto({ classificacao: val });
              }}
              className="accent-emerald-600 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-emerald-900">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>🟢 Grupo & Subgrupo OK</span>
            </span>
          </label>

          {/* 🟠 Filtro de Classificação: Apenas Grupo (Falta Subgrupo) */}
          <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border transition ${
            classificacao === 'apenas_grupo' ? 'bg-orange-200 border-orange-400 text-orange-950 shadow-2xs font-black' : 'bg-orange-50 hover:bg-orange-100 border-orange-200'
          }`}>
            <input
              type="checkbox"
              checked={classificacao === 'apenas_grupo'}
              onChange={(e) => {
                const val = e.target.checked ? 'apenas_grupo' : '';
                setClassificacao(val);
                aplicarFiltrosDireto({ classificacao: val });
              }}
              className="accent-orange-600 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-orange-900">
              <AlertTriangle size={14} className="text-orange-600" />
              <span>🟠 Apenas Grupo (Falta Subgrupo)</span>
            </span>
          </label>

          {/* 🔴 Filtro de Classificação: Sem Categoria */}
          <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border transition ${
            classificacao === 'sem_categoria' ? 'bg-red-200 border-red-400 text-red-950 shadow-2xs font-black' : 'bg-red-50 hover:bg-red-100 border-red-200'
          }`}>
            <input
              type="checkbox"
              checked={classificacao === 'sem_categoria'}
              onChange={(e) => {
                const val = e.target.checked ? 'sem_categoria' : '';
                setClassificacao(val);
                aplicarFiltrosDireto({ classificacao: val });
              }}
              className="accent-red-600 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-red-900">
              <XCircle size={14} className="text-red-600" />
              <span>🔴 Sem Categoria</span>
            </span>
          </label>

          {/* Opção Promoção */}
          <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border transition ${
            promocao === 'sim' ? 'bg-rose-200 border-rose-400 text-rose-950 shadow-2xs font-black' : 'bg-rose-50/60 hover:bg-rose-100/60 border-rose-200'
          }`}>
            <input
              type="checkbox"
              checked={promocao === 'sim'}
              onChange={(e) => {
                const val = e.target.checked ? 'sim' : '';
                setPromocao(val);
                setQ('');
                aplicarFiltrosDireto({ promocao: val, q: '' });
              }}
              className="accent-rose-600 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-rose-800">
              <Flame size={14} className="text-rose-600" />
              <span>🔥 Vitrine Promoção</span>
            </span>
          </label>

          {/* Opção Status: Ativo */}
          <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border transition ${
            status === 'ativo' ? 'bg-green-200 border-green-400 text-green-950 shadow-2xs font-black' : 'bg-green-50 hover:bg-green-100 border-green-200'
          }`}>
            <input
              type="checkbox"
              checked={status === 'ativo'}
              onChange={(e) => {
                const val = e.target.checked ? 'ativo' : '';
                setStatus(val);
                aplicarFiltrosDireto({ status: val });
              }}
              className="accent-green-600 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-green-800">
              <span>🟢 Apenas Ativos</span>
            </span>
          </label>

          {/* Opção Status: Inativo */}
          <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border transition ${
            status === 'inativo' ? 'bg-gray-300 border-gray-400 text-gray-950 shadow-2xs font-black' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
          }`}>
            <input
              type="checkbox"
              checked={status === 'inativo'}
              onChange={(e) => {
                const val = e.target.checked ? 'inativo' : '';
                setStatus(val);
                aplicarFiltrosDireto({ status: val });
              }}
              className="accent-gray-600 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-gray-700">
              <span>🔴 Apenas Inativos</span>
            </span>
          </label>
        </div>

        {/* 4. Filtro por Quantidade Exata de Fotos (1 a 10) */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1 mr-1">
            <ImageIcon size={15} className="text-blue-600" />
            <span>Qtd. de Fotos:</span>
          </span>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const isSelected = qtdFotos === String(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => {
                  const val = isSelected ? '' : String(n);
                  setQtdFotos(val);
                  aplicarFiltrosDireto({ qtdFotos: val });
                }}
                className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-black ring-2 ring-blue-300'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                }`}
                title={n === 10 ? '10 ou mais fotos' : `${n} foto(s)`}
              >
                {n === 10 ? '10+' : `${n}`}
              </button>
            );
          })}
          {qtdFotos && (
            <button
              type="button"
              onClick={() => {
                setQtdFotos('');
                aplicarFiltrosDireto({ qtdFotos: '' });
              }}
              className="text-[11px] text-gray-400 hover:text-red-600 font-bold ml-1 hover:underline cursor-pointer"
            >
              (Limpar Qtd)
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
