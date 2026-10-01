import { ShoppingCart, User, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import TopBar from './TopBar';
import SearchBar from './SearchBar';
import CategoryNav from './CategoryNav';
import CartCountBadge from './CartCountBadge';


export default async function Header() {
  const { data: configs } = await supabase.from('configuracoes').select('*');
  const topbar = configs?.find(c => c.chave === 'marketing_topbar')?.valor || {
    texto1: '🚚 Frete grátis acima de R$ 99,00',
    texto2: '💳 Parcele em até 6x sem juros no cartão',
    visibilidade: 'todas',
    cor: 'bg-primary'
  };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      <TopBar topbar={topbar} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2 md:py-1 gap-2">
          
          {/* Logo do Site */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/">
              <div className="relative w-44 sm:w-56 md:w-[380px] h-12 sm:h-16 md:h-24 cursor-pointer overflow-visible flex items-center">
                <Image 
                  src="/logo-luxo.png" 
                  alt="Banho e Tosa Pet Logo" 
                  fill 
                  className="object-contain object-left md:scale-[1.5] origin-left" 
                  priority 
                />
              </div>
            </Link>
          </div>

          {/* Barra de Pesquisa Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-6">
            <SearchBar />
          </div>

          {/* Ícones de Conta, Favoritos e Carrinho */}
          <div className="flex items-center gap-4 sm:gap-5 md:gap-6 text-secondary flex-shrink-0">
            <Link href="/minhaconta" className="flex flex-col items-center hover:text-primary transition" title="Minha Conta">
              <User size={22} className="md:w-6 md:h-6" />
              <span className="text-[10px] md:text-xs font-bold mt-0.5 md:mt-1 hidden sm:block">Conta</span>
            </Link>
            <Link href="/favoritos" className="flex flex-col items-center hover:text-primary transition relative" title="Favoritos">
              <Heart size={22} className="md:w-6 md:h-6" />
              <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] md:text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
              <span className="text-[10px] md:text-xs font-bold mt-0.5 md:mt-1 hidden sm:block">Favoritos</span>
            </Link>
            <Link href="/carrinho" className="flex flex-col items-center hover:text-primary transition relative" title="Carrinho de Compras">
              <ShoppingCart size={22} className="md:w-6 md:h-6" />
              <CartCountBadge />
              <span className="text-[10px] md:text-xs font-bold mt-0.5 md:mt-1 hidden sm:block">Carrinho</span>
            </Link>
          </div>

        </div>

        {/* Barra de Pesquisa Mobile (Ocupa 100% da largura logo abaixo do logo e ícones) */}
        <div className="block md:hidden pb-2.5 pt-1">
          <SearchBar />
        </div>
      </div>

      {/* Menu Superior Horizontal de Categorias (Exibido em todas as páginas) */}
      <CategoryNav />
    </header>
  );
}
