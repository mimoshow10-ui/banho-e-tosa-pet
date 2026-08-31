import Link from 'next/link';
import { Trash2, ShoppingBag } from 'lucide-react';

export default function CarrinhoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold text-secondary mb-8 flex items-center gap-3">
        <ShoppingBag size={32} className="text-primary" />
        Meu Carrinho
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Coluna Esquerda - Produtos */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            
            {/* Cabeçalho da Tabela (Desktop) */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-border font-bold text-sm text-gray-600">
              <div className="col-span-6">Produto</div>
              <div className="col-span-2 text-center">Preço Unit.</div>
              <div className="col-span-2 text-center">Qtd</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            {/* Itens do Carrinho */}
            {[1, 2].map((item) => (
              <div key={item} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b border-border items-center">
                {/* Imagem e Nome */}
                <div className="col-span-1 md:col-span-6 flex gap-4 items-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0"></div>
                  <div>
                    <h3 className="font-bold text-secondary line-clamp-2">Coleira Premium Ajustável - Tamanho M</h3>
                    <button className="text-red-500 text-sm flex items-center gap-1 mt-2 hover:underline">
                      <Trash2 size={14} /> Remover
                    </button>
                  </div>
                </div>

                {/* Preço Unit. */}
                <div className="col-span-1 md:col-span-2 text-left md:text-center">
                  <span className="md:hidden font-bold text-sm text-gray-500 mr-2">Preço:</span>
                  <span className="font-semibold">R$ 29,90</span>
                </div>

                {/* Quantidade */}
                <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center">
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button className="px-3 py-1 hover:bg-gray-100 transition">-</button>
                    <span className="px-3 py-1 font-bold text-sm">1</span>
                    <button className="px-3 py-1 hover:bg-gray-100 transition">+</button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="col-span-1 md:col-span-2 text-left md:text-right">
                  <span className="md:hidden font-bold text-sm text-gray-500 mr-2">Subtotal:</span>
                  <span className="font-bold text-primary">R$ 29,90</span>
                </div>
              </div>
            ))}
          </div>

          <Link href="/" className="inline-block mt-6 text-secondary font-bold hover:underline">
            ← Continuar comprando
          </Link>
        </div>

        {/* Coluna Direita - Resumo */}
        <div className="w-full lg:w-1/3">
          <div className="bg-gray-50 p-6 rounded-xl border border-border sticky top-24">
            <h2 className="font-heading font-bold text-xl text-secondary mb-6 pb-4 border-b border-gray-200">
              Resumo do Pedido
            </h2>
            
            <div className="flex justify-between mb-4 text-gray-600">
              <span>Subtotal (2 itens)</span>
              <span className="font-semibold">R$ 59,80</span>
            </div>

            {/* Calcular Frete & Preferência de Entrega */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">Opções de Entrega</h3>
              
              <div className="grid md:grid-cols-1 gap-4">
                {/* Campo de CEP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="00000-000" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                    <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition">
                      OK
                    </button>
                  </div>
                </div>

                {/* Campo de Preferência de Entrega */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferência de Entrega *</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white">
                    <option value="" disabled selected>Selecione</option>
                    <option value="correios">Correios (PAC/Sedex)</option>
                    <option value="transportadora">Transportadora Privada</option>
                    <option value="retirada">Retirada no Local</option>
                    <option value="qualquer">O mais barato/rápido</option>
                  </select>
                </div>
              </div>

              {/* Resultado Simulado do Frete */}
              <div className="flex justify-between mt-4 text-sm bg-gray-100 p-3 rounded-lg border border-gray-200">
                <span>PAC (7 dias úteis)</span>
                <span className="font-semibold text-primary">R$ 15,00</span>
              </div>
            </div>

            {/* Cupom */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Cupom de Desconto</p>
              <div className="flex gap-2">
                <input type="text" placeholder="Código" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition">
                  Aplicar
                </button>
              </div>
            </div>

            <div className="flex justify-between mb-4 items-end">
              <span className="font-bold text-secondary text-lg">Total no Cartão</span>
              <span className="font-bold text-2xl text-gray-400 line-through">R$ 74,80</span>
            </div>

            <div className="flex justify-between mb-8 items-end bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex flex-col">
                <span className="font-bold text-secondary text-lg">Total no PIX</span>
                <span className="text-xs text-green-600 font-bold">(5% de desconto)</span>
              </div>
              <span className="font-heading font-bold text-3xl text-primary">R$ 71,06</span>
            </div>

            <Link href="/login" className="w-full block text-center bg-accent text-text font-bold text-lg py-4 rounded-xl hover:bg-yellow-400 transition shadow-sm mb-4">
              Pagar com PIX ou Cartão
            </Link>
            <p className="text-xs text-center text-gray-500">
              Pagamento 100% seguro processado pelo Mercado Pago
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
