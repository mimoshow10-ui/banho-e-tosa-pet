import Link from 'next/link';
import { User, Package, MapPin, Ticket, ShieldCheck, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function MinhaContaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 font-sans space-y-8">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-secondary flex items-center gap-3">
            <User size={32} className="text-primary" />
            Minha Conta
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gerencie seus pedidos, dados de entrega e cupons salvos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/carrinho"
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs hover:border-primary transition space-y-3 group"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition">
            <Package size={24} />
          </div>
          <h3 className="font-bold text-secondary text-base">Meus Pedidos</h3>
          <p className="text-xs text-gray-500">Acompanhe o status e histórico de suas compras no site.</p>
        </Link>

        <Link
          href="/checkout"
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs hover:border-primary transition space-y-3 group"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition">
            <MapPin size={24} />
          </div>
          <h3 className="font-bold text-secondary text-base">Endereços de Entrega</h3>
          <p className="text-xs text-gray-500">Cadastre e atualize seus locais para recebimento das encomendas.</p>
        </Link>

        <Link
          href="/carrinho"
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs hover:border-primary transition space-y-3 group"
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
