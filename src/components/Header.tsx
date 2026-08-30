import { Search, ShoppingCart, User, Heart } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      {/* Top Banner */}
      <div className="w-full bg-primary text-white text-center py-2 text-sm font-semibold">
        Frete grátis acima de R$50
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-secondary font-heading font-bold text-2xl">
              Mimo Show Pet
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
            <Link href="/conta" className="text-text hover:text-primary transition">
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

        {/* Categories Menu */}
        <nav className="hidden md:flex space-x-8 justify-center pb-4 text-text font-medium">
          <Link href="/categoria/coleiras" className="hover:text-primary transition">Coleiras</Link>
          <Link href="/categoria/gravatas" className="hover:text-primary transition">Gravatas</Link>
          <Link href="/categoria/acessorios" className="hover:text-primary transition">Acessórios</Link>
          <Link href="/categoria/bandanas" className="hover:text-primary transition">Bandanas</Link>
          <Link href="/categoria/roupinhas" className="hover:text-primary transition">Roupinhas</Link>
        </nav>
      </div>
    </header>
  );
}
