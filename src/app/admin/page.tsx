export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">Dashboard Geral</h1>
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
          <h3 className="text-gray-500 font-medium mb-2">Total de Produtos</h3>
          <p className="text-4xl font-bold text-secondary">5.240</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
          <h3 className="text-gray-500 font-medium mb-2">Pedidos Hoje</h3>
          <p className="text-4xl font-bold text-secondary">12</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
          <h3 className="text-gray-500 font-medium mb-2">Faturamento Mês</h3>
          <p className="text-4xl font-bold text-primary">R$ 4.320,00</p>
        </div>
      </div>

      {/* Tabela de Últimos Produtos Adicionados */}
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="font-bold text-lg text-gray-800">Últimos Produtos (Supabase)</h2>
          <button className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition text-sm">
            + Adicionar Produto
          </button>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="p-4 font-medium">Nome do Produto</th>
              <th className="p-4 font-medium">Categoria</th>
              <th className="p-4 font-medium">Estoque</th>
              <th className="p-4 font-medium">Preço</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {[1, 2, 3, 4, 5].map((item) => (
              <tr key={item} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">Coleira Premium Ajustável {item}</td>
                <td className="p-4 text-gray-600">Coleiras</td>
                <td className="p-4 text-gray-600">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">15 unid.</span>
                </td>
                <td className="p-4 font-bold text-primary">R$ 29,90</td>
                <td className="p-4 text-right">
                  <button className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button className="text-red-600 hover:underline">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
