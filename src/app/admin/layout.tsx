import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Package, Tags, ShoppingCart, Settings, Home, LogOut, Bot, Truck, Users, Ticket, ShieldCheck } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || headerList.get('next-url') || '';

  // Se estiver na rota /admin/login, não aplica o layout de sidebar e não exige login
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session')?.value;

  // Renderizar página de login sem a sidebar do painel
  if (!sessionToken) {
    // Se o usuário está tentando acessar qualquer página admin diferente de login, exibimos a página de login
    return <>{children}</>;
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Sidebar / Menu Lateral — fixo na tela */}
      <aside className="w-full md:w-64 bg-secondary text-white flex flex-col flex-shrink-0 md:h-screen md:sticky md:top-0">
        <div className="p-6 border-b border-blue-800 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-xl text-accent">Painel Admin</h2>
            <p className="text-xs text-blue-200 mt-1">Banho e Tosa Pet</p>
          </div>
          <div title="Segurança Ativa" className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
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
            <span>Grupos e Subgrupos</span>
          </Link>
          <Link href="/admin/pedidos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition">
            <ShoppingCart size={20} />
            <span>Pedidos</span>
          </Link>
          <Link href="/admin/cupons" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition bg-orange-900/40 text-orange-200 border border-orange-500/30">
            <Ticket size={20} className="text-orange-300" />
            <span>Cupons de Desconto</span>
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
          <Link href="/" target="_blank" className="flex items-center gap-3 p-3 bg-accent text-secondary font-bold rounded-lg hover:bg-yellow-400 transition text-xs justify-center">
            <Home size={18} />
            <span>Visualizar Loja</span>
          </Link>
          <form action={async () => {
            'use server'
            const c = await cookies();
            c.delete('admin_session');
            redirect('/admin/login');
          }}>
            <button type="submit" className="w-full flex items-center gap-3 p-3 text-red-300 hover:text-red-100 hover:bg-red-900/30 rounded-lg transition text-xs font-bold justify-center cursor-pointer">
              <LogOut size={18} />
              <span>Sair do Painel</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Área Principal de Conteúdo — rola independente */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}
