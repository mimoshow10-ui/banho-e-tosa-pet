import { Search, ShoppingCart, User, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      {/* Top Banner */}
      <div className="w-full bg-primary text-white text-center py-2 text-sm font-semibold">
        Frete grátis acima de R$50
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Search */}
        <div className="flex items-center justify-between py-2">
          <Link href="/">
            <div className="relative w-64 h-24 cursor-pointer z-50">
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
          <div className="flex items-center space-x-6">
            <Link href="/favoritos" className="text-text hover:text-primary transition">
              <Heart size={24} />
            </Link>
            <Link href="/login" className="text-secondary hover:text-primary transition cursor-pointer">
              <User size={24} />
            </Link>
            <Link href="/carrinho" className="text-text hover:text-primary transition">
              <div className="relative">
                <ShoppingCart size={24} />
                <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Categorias (Desktop) */}
        <nav className="hidden md:flex justify-center gap-8 py-4 bg-white border-t border-border shadow-sm text-sm font-bold text-gray-700">
          <Link href="/categoria/adesivos" className="hover:text-primary transition">Adesivos</Link>
          <Link href="/categoria/gravatinhas" className="hover:text-primary transition">Gravatinhas</Link>
          <Link href="/categoria/lacinhos" className="hover:text-primary transition">Lacinhos</Link>
          <Link href="/categoria/bandanas" className="hover:text-primary transition">Bandanas</Link>
          <Link href="/categoria/gargantilhas" className="hover:text-primary transition">Gargantilhas</Link>
          <Link href="/categoria/colarinhos" className="hover:text-primary transition">Colarinhos</Link>
        </nav>
      </div>
    </header>
  );
}
