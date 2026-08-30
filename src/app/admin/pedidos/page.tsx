export default function AdminPedidos() {
  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">Pedidos (Mercado Livre)</h1>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border bg-gray-50 flex justify-between">
          <p className="text-gray-600 text-sm">Esta tela sincronizará automaticamente com o Mercado Pago quando o site estiver no ar recebendo pagamentos reais.</p>
          <button className="text-sm font-bold text-blue-600 hover:underline">Sincronizar Agora</button>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm border-b border-border">
            <tr>
              <th className="p-4 font-medium">Nº Pedido</th>
              <th className="p-4 font-medium">Cliente</th>
              <th className="p-4 font-medium">Data</th>
              <th className="p-4 font-medium">Total</th>
              <th className="p-4 font-medium">Status (ML)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            <tr className="hover:bg-gray-50">
              <td className="p-4 font-medium text-gray-800">#10294</td>
              <td className="p-4 text-gray-600">João Silva</td>
              <td className="p-4 text-gray-500">Hoje, 10:45</td>
              <td className="p-4 font-bold text-gray-800">R$ 159,80</td>
              <td className="p-4">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Pago</span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="p-4 font-medium text-gray-800">#10293</td>
              <td className="p-4 text-gray-600">Maria Oliveira</td>
              <td className="p-4 text-gray-500">Ontem, 18:20</td>
              <td className="p-4 font-bold text-gray-800">R$ 49,90</td>
              <td className="p-4">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">Aguardando Pagamento</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
