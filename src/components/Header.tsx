import { ShoppingCart, User, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import TopBar from './TopBar';
import SearchBar from './SearchBar';
import CategoryNav from './CategoryNav';
import CartCountBadge from './CartCountBadge';
import HomeOnlyCategoryNav from './HomeOnlyCategoryNav';

export default async function Header() {
  const { data: configs } = await supabase.from('configuracoes').select('*');
  const topbar = configs?.find(c => c.chave === 'marketing_topbar')?.valor || { texto: 'Frete grátis acima de R$ 99,00', visibilidade: 'todas', cor: 'bg-primary' };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      <TopBar topbar={topbar} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2.5">
          
          {/* Logo do Site (25% Maior) */}
          <div className="flex items-center">
            <Link href="/">
              <div className="relative w-96 md:w-[525px] h-36 md:h-44 cursor-pointer">
                <Image 
                  src="/logo-luxo.jpg" 
                  alt="Banho e Tosa Pet Logo" 
                  fill 
                  className="object-contain object-left" 
                  priority 
                />
              </div>
            </Link>
          </div>

          {/* Barra de Pesquisa */}
          <SearchBar />

          {/* Ícones de Conta, Favoritos e Carrinho */}
          <div className="flex items-center gap-6 text-secondary">
            <Link href="/minhaconta" className="flex flex-col items-center hover:text-primary transition">
              <User size={24} />
              <span className="text-xs font-bold mt-1">Conta</span>
            </Link>
            <Link href="/favoritos" className="flex flex-col items-center hover:text-primary transition relative">
              <Heart size={24} />
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
              <span className="text-xs font-bold mt-1">Favoritos</span>
            </Link>
            <Link href="/carrinho" className="flex flex-col items-center hover:text-primary transition relative">
              <ShoppingCart size={24} />
              <CartCountBadge />
              <span className="text-xs font-bold mt-1">Carrinho</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Menu Superior Horizontal de Categorias (EXIBIDO APENAS NA HOME '/') */}
      <HomeOnlyCategoryNav>
        <CategoryNav />
      </HomeOnlyCategoryNav>
    </header>
  );
}
