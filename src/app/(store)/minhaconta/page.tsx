import Link from 'next/link';
import { User, Package, MapPin, Ticket, ShieldCheck, ArrowRight, Truck, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function MinhaContaPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 font-sans space-y-8">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-secondary flex items-center gap-3">
            <User size={32} className="text-primary" />
            Minha Conta
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gerencie seus pedidos, dados de entrega, rastreamento de encomendas e cupons salvos.
          </p>
        </div>
      </div>

      {/* Banner de Rastreamento Rápido */}
      <Link
        href="/rastreamento"
        className="bg-gradient-to-r from-[#0B2545] via-blue-900 to-[#0B2545] text-white p-6 rounded-3xl shadow-md hover:shadow-lg transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-800 group"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400 group-hover:scale-110 transition flex-shrink-0">
            <Truck size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-blue-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                Consulta Rápida
              </span>
              <h3 className="font-bold text-lg text-white">Rastrear Meu Pedido</h3>
            </div>
            <p className="text-xs text-blue-200 mt-1">
              Digite seu <strong>Número do Pedido</strong> ou <strong>CPF</strong> para consultar a localização e status da entrega.
            </p>
          </div>
        </div>
        <span className="bg-primary hover:bg-orange-600 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-xs flex items-center gap-1.5 flex-shrink-0">
          <Search size={15} />
          <span>Rastrear Agora</span>
        </span>
      </Link>

      {/* Grid de Cards de Navegação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Rastrear Pedido */}
        <Link
          href="/rastreamento"
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs hover:border-blue-500 hover:shadow-md transition space-y-3 group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition">
            <Truck size={24} />
          </div>
          <h3 className="font-bold text-secondary text-base">Rastrear Pedido</h3>
          <p className="text-xs text-gray-500">Consulte o status do envio nos Correios ou Transportadoras.</p>
        </Link>

        {/* Card 2: Meus Pedidos */}
        <Link
          href="/rastreamento"
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs hover:border-primary hover:shadow-md transition space-y-3 group"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition">
            <Package size={24} />
          </div>
          <h3 className="font-bold text-secondary text-base">Meus Pedidos</h3>
          <p className="text-xs text-gray-500">Acompanhe o status e histórico de suas compras no site.</p>
        </Link>

        {/* Card 3: Endereços de Entrega */}
        <Link
          href="/checkout"
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs hover:border-purple-500 hover:shadow-md transition space-y-3 group"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition">
            <MapPin size={24} />
          </div>
          <h3 className="font-bold text-secondary text-base">Endereços de Entrega</h3>
          <p className="text-xs text-gray-500">Cadastre e atualize seus locais para recebimento das encomendas.</p>
        </Link>

        {/* Card 4: Meus Cupons */}
        <Link
          href="/carrinho"
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs hover:border-green-500 hover:shadow-md transition space-y-3 group"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 group-hover:scale-110 transition">
            <Ticket size={24} />
          </div>
          <h3 className="font-bold text-secondary text-base">Meus Cupons</h3>
          <p className="text-xs text-gray-500">Consulte cupons de desconto disponíveis para uso nas compras.</p>
        </Link>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} className="text-green-600" />
          <p className="text-xs text-gray-600 font-medium">
            Seus dados estão protegidos sob a LGPD com criptografia ponta a ponta.
          </p>
        </div>
        <Link
          href="/"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          Voltar à Loja <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
