import { Search, ShoppingCart, User, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import TopBar from './TopBar';

export default async function Header() {
  const { data: configs } = await supabase.from('configuracoes').select('*');
  const topbar = configs?.find(c => c.chave === 'marketing_topbar')?.valor || { texto: 'Frete grátis acima de R', visibilidade: 'todas', cor: 'bg-primary' };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      <TopBar topbar={topbar} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2">
          {/* Logo and Search */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="relative w-48 h-16 cursor-pointer z-50">
              <Image 
                src="/logo-luxo.jpg" 
                alt="Banho e Tosa Pet Logo" 
                fill 
                className="object-contain" 
                priority 
              />
            </div>
          </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar acessórios para seu pet"
                className="w-full bg-gray-100 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>

          {/* Icons */}
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
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
              <span className="text-xs font-bold mt-1">Carrinho</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
