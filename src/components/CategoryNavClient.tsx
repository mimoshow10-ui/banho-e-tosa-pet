'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  parent_id: string | null;
}

interface Props {
  pais: Categoria[];
  all: Categoria[];
  emojis: Record<string, string>;
}

export default function CategoryNavClient({ pais, all, emojis }: Props) {
  const getSubcategorias = (paiId: string) => {
    return all.filter(c => c.parent_id === paiId);
  };

  return (
    <nav className="w-full bg-white border-t border-gray-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 py-2">
        {/* Duas fileiras de categorias - flex-wrap */}
        <div className="flex flex-wrap gap-2">
          {pais.map((cat) => {
            const subs = getSubcategorias(cat.id);
            const temSub = subs.length > 0;

            return (
              <div key={cat.id} className="relative group">
                <Link
                  href={`/categoria/${cat.slug}`}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-primary rounded-full px-4 py-1.5 text-xs md:text-sm font-bold text-secondary hover:text-primary transition shadow-2xs hover:shadow-xs"
                >
                  <span>{cat.nome}</span>
                  {temSub && <ChevronDown size={14} className="text-gray-400 group-hover:text-primary transition ml-0.5" />}
                </Link>

                {/* Dropdown de Subcategorias */}
                {temSub && (
                  <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-white border border-gray-100 shadow-xl rounded-2xl py-2 min-w-[180px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {subs.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/categoria/${sub.slug}`}
                        className="block px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-primary transition"
                      >
                        {sub.nome}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Botao Ver Tudo */}
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
