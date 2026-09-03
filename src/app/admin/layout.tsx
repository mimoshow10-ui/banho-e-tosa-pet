import Link from 'next/link';
import { Package, Tags, ShoppingCart, Settings, Home, LogOut, Bot, Truck, Users } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-gray-100 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Sidebar / Menu Lateral — fixo na tela */}
      <aside className="w-full md:w-64 bg-secondary text-white flex flex-col flex-shrink-0 md:h-screen md:sticky md:top-0">
        <div className="p-6 border-b border-blue-800">
          <h2 className="font-heading font-bold text-xl text-accent">Painel Admin</h2>
          <p className="text-xs text-blue-200 mt-1">Banho e Tosa Pet</p>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          <Link href="/admin" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition bg-blue-900">
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/produtos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition">
            <Package size={20} />
            <span>Produtos</span>
          </Link>
          <Link href="/admin/categorias" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition">
            <Tags size={20} />
            <span>Categorias</span>
          </Link>
          <Link href="/admin/pedidos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition">
            <ShoppingCart size={20} />
            <span>Pedidos</span>
          </Link>
          <Link href="/admin/transportadoras" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition">
            <Truck size={20} />
            <span>Transportadoras (Fretes)</span>
          </Link>
          <Link href="/admin/clientes" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition">
            <Users size={20} />
            <span>Clientes</span>
          </Link>
          <Link href="/admin/marketing" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition">
            <Settings size={20} />
            <span>Marketing (Banners)</span>
          </Link>
          <Link href="/admin/configuracoes" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition">
            <Settings size={20} />
            <span>Configurações</span>
          </Link>
          <Link href="/admin/treinamento-ia" className="flex items-center gap-3 p-3 rounded-lg bg-purple-900/60 hover:bg-purple-800 transition border border-purple-500/30 text-purple-200">
            <Bot size={20} className="text-purple-300" />
            <span>Treinar IA (Robô)</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-blue-800 flex flex-col gap-2 flex-shrink-0">
          <Link href="/" target="_blank" className="flex items-center gap-3 p-3 bg-accent text-secondary font-bold rounded-lg hover:bg-yellow-400 transition">
            <Home size={20} />
            <span>Visualizar Loja</span>
          </Link>
          <Link href="/" className="flex items-center gap-3 p-3 text-red-300 hover:text-red-100 transition">
            <LogOut size={20} />
            <span>Sair do Painel</span>
          </Link>
        </div>
      </aside>

      {/* Área Principal de Conteúdo — rola independente */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}
