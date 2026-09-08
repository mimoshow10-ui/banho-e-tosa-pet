import { supabase } from '@/lib/supabase';
import CategoryNavClient from './CategoryNavClient';

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

  if (pais.length === 0) return null;

  return <CategoryNavClient pais={pais} all={all} emojis={EMOJIS} />;
}
