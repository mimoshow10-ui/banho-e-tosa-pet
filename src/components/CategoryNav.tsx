import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  parent_id: string | null;
}

export default async function CategoryNav() {
  const { data: categoriasAll } = await supabase
    .from('categorias')
    .select('id, nome, slug, parent_id')
    .order('nome');

  const all = (categoriasAll || []) as Categoria[];
  const pais = all.filter(c => c.parent_id === null);

  const getSubcategorias = (paiId: string) => {
    return all.filter(c => c.parent_id === paiId);
  };

  if (pais.length === 0) return null;

  return (
    <nav className="w-full bg-white border-t border-gray-100 shadow-sm text-sm">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex items-center justify-start md:justify-center gap-6 md:gap-8 overflow-x-auto py-3 no-scrollbar scroll-smooth font-medium text-gray-700 whitespace-nowrap">
          {pais.map((cat) => {
            const subs = getSubcategorias(cat.id);
            const temSub = subs.length > 0;

            return (
              <li key={cat.id} className="relative group">
                <Link
                  href={`/categoria/${cat.slug}`}
                  className="flex items-center gap-1 hover:text-primary transition py-1 text-xs md:text-sm font-semibold tracking-wide text-gray-800"
                >
                  {cat.nome}
                  {temSub && <ChevronDown size={14} className="text-gray-400 group-hover:text-primary transition" />}
                </Link>

                {/* Submenu Dropdown ao passar o mouse */}
                {temSub && (
                  <div className="absolute left-0 top-full hidden group-hover:block bg-white border border-gray-100 shadow-lg rounded-xl py-2 min-w-[180px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {subs.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/categoria/${sub.slug}`}
                        className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-primary transition"
                      >
                        {sub.nome}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
