import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  parent_id: string | null;
}

const EMOJIS: Record<string, string> = {
  'adesivos': '🎨',
  'bandanas': '🩲',
  'cartelas-sticker': '🐶',
  'colarinhos': '🐾',
  'faixas-decorativas': '🐶',
  'gargantilhas': '📿',
  'gravatinhas': '👔',
  'lacinhos': '🎀',
  'outubro-rosa': '🐶',
  'quadros': '🐶',
};

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
    <nav className="w-full bg-white border-t border-gray-100 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
        {/* Linha Única sem quebrar para baixo (flex-nowrap) */}
        <div className="flex items-center justify-start md:justify-center gap-2.5 md:gap-3 whitespace-nowrap min-w-max">
          {pais.map((cat) => {
            const subs = getSubcategorias(cat.id);
            const temSub = subs.length > 0;
            const emoji = EMOJIS[cat.slug] || '🐶';

            return (
              <div key={cat.id} className="relative group flex-shrink-0">
                <Link
                  href={`/categoria/${cat.slug}`}
                  className="flex items-center gap-2 bg-white border border-gray-300 rounded-full px-4 py-2 text-xs md:text-sm font-bold text-secondary hover:border-primary hover:text-primary transition shadow-2xs hover:shadow-sm"
                >
                  <span className="text-sm md:text-base leading-none">{emoji}</span>
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

          {/* Botão Laranja Ver Tudo Na MESMA Linha dos Grupos */}
          <Link
            href="/categoria/todas"
            className="flex-shrink-0 flex items-center gap-2 bg-primary text-white border border-primary rounded-full px-5 py-2 text-xs md:text-sm font-bold hover:bg-orange-600 transition shadow-sm"
          >
            <span className="text-sm md:text-base leading-none">🛍️</span>
            <span>Ver Tudo</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
