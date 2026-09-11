'use client';

import Link from 'next/link';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  parent_id: string | null;
}

interface Props {
  pais: Categoria[];
  all: Categoria[];
  emojis?: Record<string, string>;
}

const THEMATIC_SLUGS = new Set([
  'dia-das-maes',
  'dia-dos-pais',
  'dia-das-criancas',
  'halloween',
  'carnaval',
  'pascoa',
  'natal',
  'ano-novo',
  'dia-dos-namorados',
  'outubro-rosa',
  'novembro-azul',
  'festa-junina'
]);

const CATEGORY_EMOJIS: Record<string, string> = {
  'dia-das-maes': '🌸',
  'dia-dos-pais': '👔',
  'dia-das-criancas': '🎈',
  'halloween': '🎃',
  'carnaval': '🎭',
  'pascoa': '🐰',
  'natal': '🎄',
  'ano-novo': '🎆',
  'dia-dos-namorados': '❤️',
  'outubro-rosa': '🎀',
  'novembro-azul': '💙',
  'festa-junina': '🌽',
  'adesivos': '🏷️',
  'bandanas': '🧣',
  'gargantilhas': '📿',
  'gravatinhas': '👔',
  'lacinhos': '🎀'
};

export default function CategoryNavClient({ pais, all }: Props) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Categorias normais (produtos fixos: Adesivos, Gravatinhas, Lacinhos, etc.)
  const padraoPais = pais
    .filter(c => !THEMATIC_SLUGS.has(c.slug))
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));

  // Categorias de eventos/datas comemorativas para agrupar apenas no visual do topo
  const tematicosCats = pais
    .filter(c => THEMATIC_SLUGS.has(c.slug))
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));

  const getSubcategorias = (paiId: string) => {
    return all
      .filter(c => c.parent_id === paiId)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isTematicosOpen = openDropdownId === 'tematicos-ui-dropdown';

  return (
    <nav className="w-full bg-white border-t border-gray-100 shadow-2xs z-40 relative" ref={navRef}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Grupos de Produtos Padrão */}
          {padraoPais.map((cat) => {
            const subs = getSubcategorias(cat.id);
            const temSub = subs.length > 0;
            const isOpen = openDropdownId === cat.id;
            const emoji = CATEGORY_EMOJIS[cat.slug];

            return (
              <div
                key={cat.id}
                className="relative group"
                onMouseEnter={() => setOpenDropdownId(cat.id)}
                onMouseLeave={() => setOpenDropdownId(null)}
              >
                <Link
                  href={`/categoria/${cat.slug}`}
                  onClick={() => setOpenDropdownId(null)}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 text-secondary hover:border-primary hover:text-primary rounded-full px-4 py-1.5 text-xs md:text-sm font-bold transition shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  {emoji && <span className="text-xs">{emoji}</span>}
                  <span>{cat.nome}</span>
                  {temSub && (
                    <ChevronDown
                      size={14}
                      className={`text-gray-400 group-hover:text-primary transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </Link>

                {/* Subcategorias do grupo padrão */}
                {temSub && (
                  <div
                    className={`absolute left-0 top-full mt-1 bg-white border border-gray-100 shadow-xl rounded-2xl py-2 min-w-[200px] z-50 animate-in fade-in slide-in-from-top-1 duration-150 ${
                      isOpen ? 'block' : 'hidden'
                    }`}
                  >
                    <div className="px-3 py-1 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-50 mb-1">
                      Subcategorias
                    </div>
                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                      {subs.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/categoria/${sub.slug}`}
                          onClick={() => setOpenDropdownId(null)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-primary transition rounded-lg mx-1"
                        >
                          <span>{sub.nome}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* BOTÃO VISUAL FRONT-END "TEMÁTICOS" (Não altera a estrutura do banco) */}
          {tematicosCats.length > 0 && (
            <div
              className="relative group"
              onMouseEnter={() => setOpenDropdownId('tematicos-ui-dropdown')}
              onMouseLeave={() => setOpenDropdownId(null)}
            >
              <button
                type="button"
                onClick={() => setOpenDropdownId(isTematicosOpen ? null : 'tematicos-ui-dropdown')}
                className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 font-extrabold rounded-full px-4 py-1.5 text-xs md:text-sm transition shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <Sparkles size={14} className="text-amber-600 animate-pulse" />
                <span>Temáticos</span>
                <ChevronDown
                  size={14}
                  className={`text-amber-700 transition-transform duration-200 ${
                    isTematicosOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Lista de Categorias Temáticas */}
              <div
                className={`absolute left-0 top-full mt-1 bg-white border border-amber-100 shadow-xl rounded-2xl py-2 min-w-[220px] max-w-[300px] z-50 animate-in fade-in slide-in-from-top-1 duration-150 ${
                  isTematicosOpen ? 'block' : 'hidden'
                }`}
              >
                <div className="px-3 py-1 text-[10px] font-black uppercase text-amber-600 tracking-wider border-b border-amber-50 mb-1 flex items-center justify-between">
                  <span>Datas & Eventos</span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
                    {tematicosCats.length}
                  </span>
                </div>

                <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                  {tematicosCats.map((tCat) => {
                    const tEmoji = CATEGORY_EMOJIS[tCat.slug];
                    const tSubs = getSubcategorias(tCat.id);

                    return (
                      <div key={tCat.id} className="group/sub relative">
                        <Link
                          href={`/categoria/${tCat.slug}`}
                          onClick={() => setOpenDropdownId(null)}
                          className="flex items-center justify-between px-4 py-2 text-xs font-bold text-gray-800 hover:bg-amber-50 hover:text-amber-900 transition rounded-lg mx-1"
                        >
                          <div className="flex items-center gap-2">
                            {tEmoji && <span className="text-sm">{tEmoji}</span>}
                            <span>{tCat.nome}</span>
                          </div>
                          {tSubs.length > 0 && (
                            <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-1.5 py-0.5 rounded-full">
                              {tSubs.length} sub
                            </span>
                          )}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Botão Ver Tudo */}
          <Link
            href="/categoria/todas"
            className="flex items-center gap-1.5 bg-primary text-white border border-primary rounded-full px-5 py-1.5 text-xs md:text-sm font-bold hover:bg-orange-600 transition shadow-2xs"
          >
            <span>Ver Tudo</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
