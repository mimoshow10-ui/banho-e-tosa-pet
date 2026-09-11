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

const CATEGORY_EMOJIS: Record<string, string> = {
  'tematicos': '⭐',
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

  const paisOrdenados = [...pais].sort((a, b) => {
    // Manter 'tematicos' em posição de destaque ou alfabética
    if (a.slug === 'tematicos') return 1;
    if (b.slug === 'tematicos') return -1;
    return (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
  });

  const getSubcategorias = (paiId: string) => {
    return all
      .filter(c => c.parent_id === paiId)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));
  };

  // Fechar dropdown ao clicar fora no celular
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="w-full bg-white border-t border-gray-100 shadow-2xs z-40 relative" ref={navRef}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        {/* Categorias - Flex wrap responsivo */}
        <div className="flex flex-wrap items-center gap-2">
          {paisOrdenados.map((cat) => {
            const subs = getSubcategorias(cat.id);
            const temSub = subs.length > 0;
            const isTematicos = cat.slug === 'tematicos';
            const isOpen = openDropdownId === cat.id;
            const emoji = CATEGORY_EMOJIS[cat.slug];

            return (
              <div
                key={cat.id}
                className="relative group"
                onMouseEnter={() => setOpenDropdownId(cat.id)}
                onMouseLeave={() => setOpenDropdownId(null)}
              >
                <button
                  type="button"
                  onClick={() => setOpenDropdownId(isOpen ? null : cat.id)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs md:text-sm font-bold transition shadow-2xs hover:shadow-xs cursor-pointer ${
                    isTematicos
                      ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 font-extrabold'
                      : 'bg-white border border-gray-200 text-secondary hover:border-primary hover:text-primary'
                  }`}
                >
                  {isTematicos && <Sparkles size={14} className="text-amber-600 animate-pulse" />}
                  {emoji && !isTematicos && <span className="text-xs">{emoji}</span>}
                  <span>{cat.nome}</span>
                  {temSub && (
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        isTematicos ? 'text-amber-700' : 'text-gray-400 group-hover:text-primary'
                      } ${isOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {/* Dropdown de Subcategorias */}
                {temSub && (
                  <div
                    className={`absolute left-0 top-full mt-1 bg-white border border-gray-100 shadow-xl rounded-2xl py-2 min-w-[200px] max-w-[280px] z-50 animate-in fade-in slide-in-from-top-1 duration-150 ${
                      isOpen ? 'block' : 'hidden'
                    }`}
                  >
                    <div className="px-3 py-1 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-50 mb-1">
                      {isTematicos ? 'Selecione o Tema' : 'Subcategorias'}
                    </div>
                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                      {subs.map((sub) => {
                        const subEmoji = CATEGORY_EMOJIS[sub.slug];
                        return (
                          <Link
                            key={sub.id}
                            href={`/categoria/${sub.slug}`}
                            onClick={() => setOpenDropdownId(null)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-amber-50 hover:text-primary transition rounded-lg mx-1"
                          >
                            {subEmoji && <span className="text-sm">{subEmoji}</span>}
                            <span>{sub.nome}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

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
