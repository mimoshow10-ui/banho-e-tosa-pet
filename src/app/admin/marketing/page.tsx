import { HelpCircle } from 'lucide-react';

export default function AdminMarketing() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">Marketing e Promoções</h1>

      <div className="flex flex-col gap-8">
        
        {/* CARROSSEL SUPER PROMOÇÃO (HOME) */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
            <h2 className="font-bold text-lg text-red-600 flex items-center gap-2">🔥 Produtos no Carrossel "Super Promoção" (Home)</h2>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition">Atualizar Produtos</button>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Escolha os produtos que vão aparecer em destaque com o selo de desconto na página inicial (logo abaixo do banner).</p>
            
            <div className="flex gap-4 items-center bg-gray-50 p-4 border border-border rounded-lg">
              <div className="flex-1">
                <label className="block text-xs font-bold mb-1">Códigos SKU dos Produtos</label>
                <input type="text" defaultValue="SKU001, SKU005" placeholder="Ex: SKU001, SKU002, SKU010" className="w-full border border-border rounded p-2 text-sm bg-white" />
              </div>
              <div className="w-48">
                <label className="block text-xs font-bold mb-1">Desconto Automático</label>
                <select className="w-full border border-border rounded p-2 text-sm bg-white">
                  <option>-20% OFF</option>
                  <option>-30% OFF</option>
                  <option>-50% OFF</option>
                  <option>Valor Fixo</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Separe os SKUs por vírgula. Limite recomendado: 5 a 10 produtos.</p>
          </div>
        </div>

        {/* BANNERS PRINCIPAIS */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-8">
          <div className="flex items-center gap-2 mb-6 border-b pb-2">
            <h2 className="text-xl font-bold text-secondary">Banners da Página Inicial</h2>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1 bg-white p-4 border border-dashed border-gray-300 rounded-lg text-center">
                <label className="block text-sm font-bold text-secondary mb-2">Subir Banner Desktop (Computador)</label>
                <p className="text-xs text-gray-500 mb-4">Tamanho ideal: 1920x600px. Máx: 500kb.</p>
                <input type="file" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
              </div>
              <div className="flex-1 bg-white p-4 border border-dashed border-gray-300 rounded-lg text-center">
                <label className="block text-sm font-bold text-secondary mb-2">Subir Banner Mobile (Celular)</label>
                <p className="text-xs text-gray-500 mb-4">Tamanho ideal: 1080x1350px. Máx: 500kb.</p>
                <input type="file" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Link de Destino</label>
              <input type="text" placeholder="Ex: /categoria/coleiras" className="w-full border border-border rounded p-2 text-sm bg-white" />
            </div>

            <div className="flex gap-4 items-end border-t border-gray-200 pt-4">
              <div className="flex-1">
                <label className="block text-sm font-bold mb-1">Onde ele vai aparecer?</label>
                <select className="w-full border border-border rounded p-2 text-sm bg-white">
                  <option>Página Inicial (Topo)</option>
                  <option>Página de Produto (Meio)</option>
                  <option>Página de Checkout/Carrinho</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold mb-1">Público Alvo (Quem vai ver?)</label>
                <select className="w-full border border-border rounded p-2 text-sm bg-white">
                  <option>Todos os visitantes</option>
                  <option>Somente usuários deslogados</option>
                  <option>Apenas clientes antigos</option>
                </select>
              </div>
              <div className="w-48">
                <label className="block text-sm font-bold mb-1">Data de Expiração</label>
                <input type="date" className="w-full border border-border rounded p-2 text-sm bg-white text-gray-700" />
              </div>
            </div>
          </div>
        </div>

        {/* POP UPS */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-8">
          <div className="flex items-center gap-2 mb-6 border-b pb-2">
            <h2 className="text-xl font-bold text-secondary">Pop-up de Entrada (Captura de Leads)</h2>
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary" />
              <span className="font-bold text-gray-700">Ativar Pop-up no site</span>
            </label>

            <div className="flex-1">
              <label className="block text-sm font-bold mb-1">Título do Pop-up</label>
              <input type="text" defaultValue="Ganhe 10% OFF na Primeira Compra!" className="w-full border border-border rounded p-2 bg-white" />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-bold mb-1">Texto de explicação</label>
              <input type="text" defaultValue="Deixe seu melhor e-mail e receba o cupom agora." className="w-full border border-border rounded p-2 bg-white" />
            </div>

            <div className="flex-1 bg-white p-4 border border-dashed border-gray-300 rounded-lg text-center mt-2">
              <label className="block text-sm font-bold text-secondary mb-2">Imagem do Pop-up (Opcional)</label>
              <p className="text-xs text-gray-500 mb-4">Tamanho ideal: 500x500px.</p>
              <input type="file" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
            </div>
          </div>
        </div>

        <button className="bg-primary text-white py-3 px-8 rounded-lg font-bold hover:bg-orange-600 transition w-full md:w-auto self-start">
          Salvar Configurações de Marketing
        </button>
      </div>

      {/* CUPONS DE DESCONTO E PAGAMENTOS */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-8 mt-8">
        <div className="flex items-center gap-2 mb-6 border-b pb-2">
          <h2 className="text-xl font-bold text-secondary">Cupons e Regras de Pagamento</h2>
        </div>

        <div className="flex flex-col gap-8">
          
          {/* Desconto no PIX */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-bold text-green-800 mb-2">Desconto Automático no PIX</h3>
            <p className="text-sm text-green-700 mb-4">Incentive o pagamento à vista (Pix/Boleto) dando um desconto na finalização da compra.</p>
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-green-600" />
                <span className="font-bold text-gray-700">Ativar desconto</span>
              </label>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm font-bold">Porcentagem OFF:</span>
                <input type="number" defaultValue="5" className="w-20 border border-border rounded p-2 text-center font-bold" />
                <span className="font-bold">%</span>
              </div>
            </div>
          </div>

          {/* Gerador de Cupons */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4">Gerenciar Cupons de Desconto</h3>
            
            <div className="flex flex-col gap-4 bg-gray-50 border border-border rounded-lg p-4 mb-4">
              
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-bold mb-1">Código do Cupom</label>
                  <input type="text" placeholder="EX: BEMVINDO10" className="w-full border border-border rounded p-2 text-sm uppercase" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold mb-1">Tipo de Desconto</label>
                  <select className="w-full border border-border rounded p-2 text-sm bg-white">
                    <option>Porcentagem (%)</option>
                    <option>Valor Fixo (R$)</option>
                    <option>Frete Grátis</option>
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-bold mb-1">Valor</label>
                  <input type="number" placeholder="10" className="w-full border border-border rounded p-2 text-sm" />
                </div>
              </div>

              <div className="flex gap-4 items-end border-t border-gray-200 pt-4 mt-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold mb-1">Data de Validade (Até quando?)</label>
                  <input type="date" className="w-full border border-border rounded p-2 text-sm text-gray-700" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold mb-1">Regras de Exclusividade</label>
                  <select className="w-full border border-border rounded p-2 text-sm bg-white">
                    <option>Válido para Todos</option>
                    <option>Apenas 1 uso por cliente</option>
                    <option>Apenas Primeira Compra</option>
                    <option>Somente na Categoria: Coleiras</option>
                  </select>
                </div>
                <div className="w-auto">
                  <button className="bg-secondary text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-900 transition text-sm whitespace-nowrap h-full">
                    Criar Cupom
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-2">
                <label className="block text-sm font-bold text-secondary mb-2">Imagem / Banner do Cupom (Opcional)</label>
                <p className="text-xs text-gray-500 mb-2">Se você quiser que esse cupom apareça como banner.</p>
                <input type="file" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
              </div>

            </div>

            <table className="w-full text-left text-sm border border-border rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3 font-bold">Código</th>
                  <th className="p-3 font-bold">Regra</th>
                  <th className="p-3 font-bold">Validade</th>
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 font-bold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-bold text-primary">MIMOPET5</td>
                  <td className="p-3 text-gray-600">5% OFF (1 uso/cliente)</td>
                  <td className="p-3 text-red-500 font-bold">Até 30/12/26</td>
                  <td className="p-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Ativo</span></td>
                  <td className="p-3 text-right"><button className="text-red-500 hover:underline font-bold">Desativar</button></td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
