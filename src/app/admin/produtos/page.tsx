import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default async function AdminProdutos() {
  // Conectando o Painel com o Supabase de verdade!
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, nome, preco, estoque, categorias(nome)')
    .order('criado_em', { ascending: false });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-800">Gerenciar Produtos</h1>
        <Link href="/admin/produtos/novo" className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition text-sm">
          + Adicionar Novo
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="p-4 font-medium">Nome do Produto</th>
              <th className="p-4 font-medium">Preço</th>
              <th className="p-4 font-medium">Estoque</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {produtos && produtos.length > 0 ? (
              produtos.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{item.nome}</td>
                  <td className="p-4 font-bold text-primary">
                    R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                  </td>
                  <td className="p-4 text-gray-600">{item.estoque}</td>
                  <td className="p-4 text-right">
                    <button className="text-blue-600 hover:underline mr-3">Editar</button>
                    <button className="text-red-600 hover:underline">Ocultar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Nenhum produto cadastrado no banco de dados ainda. 
                  Sincronize com o Bling ou adicione um manualmente!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
