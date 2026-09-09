import CategoryNavClient from './CategoryNavClient';
import { getCategoriasComProdutosAtivos } from '@/lib/categoria-vincular';

export default async function CategoryNav() {
  const { pais, all } = await getCategoriasComProdutosAtivos();

  if (pais.length === 0) return null;

  return <CategoryNavClient pais={pais} all={all} emojis={{}} />;
}
