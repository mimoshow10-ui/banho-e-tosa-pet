import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Pencil, Trash2, Plus, ExternalLink } from 'lucide-react';
import ImportBlingForm from '@/components/ImportBlingForm';
import DeleteProductButton from './DeleteProductButton';

import { importarSKU } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminProdutos(props: { searchParams: Promise<{ msg?: string, erro?: string, q?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams.q || '';

  let query = supabase.from('produtos').select('*, categorias(nome)').order('nome');
  if (q) {
    query = query.or(`nome.ilike.%${q}%,codigo_barras.ilike.%${q}%`);
  }
  const { data: produtos, error } = await query;

  // Descobrir quais produtos são PAI (têm filhos)
  const { data: filhos } = await supabase.from('produtos').select('parent_id').not('parent_id', 'is', null);
  const paiIds = new Set((filhos || []).map((f: any) => f.parent_id));

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Erro do Supabase!</strong>
          <span className="block sm:inline"> {error.message} - {error.details} - {error.hint}</span>
        </div>
      )}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-800">Produtos</h1>
        <Link 
          href="/admin/produtos/novo" 
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-hover transition"
        >
          <Plus size={20} />
          Novo Produto
        </Link>
      </div>

      {searchParams.msg && (
        <div className="bg-green-100 text-green-800 p-4 rounded-lg font-bold mb-6">
          ✅ {searchParams.msg}
        </div>
      )}

      {searchParams.erro && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg font-bold mb-6">
          ❌ ERRO: {searchParams.erro}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        
        {/* Bloco de Importação */}
        <div className="p-6 bg-gray-50 border-b border-border flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <h3 className="font-bold text-secondary mb-2">Importar do Bling</h3>
            <p className="text-sm text-gray-600 mb-4">Digite o SKU (Código do Produto) exatamente como está no Bling para importar ou atualizar os dados e fotos.</p>
            <ImportBlingForm />
          </div>
          {searchParams.msg && <div className="text-green-600 font-bold bg-green-100 p-3 rounded-lg flex-1 text-center border border-green-200">{searchParams.msg}</div>}
          {searchParams.erro && <div className="text-red-600 font-bold bg-red-100 p-3 rounded-lg flex-1 text-center border border-red-200">{searchParams.erro}</div>}
        </div>

        {/* Bloco de Busca / Filtro */}
        <div className="p-4 bg-white border-b border-border flex flex-col md:flex-row gap-4 items-center">
          <form action="/admin/produtos" method="GET" className="flex w-full gap-2">
            <input type="text" name="q" defaultValue={q} placeholder="Pesquisar por Nome ou SKU..." className="flex-1 border border-border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <button type="submit" className="bg-gray-100 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-200 transition shadow-sm text-sm border border-gray-300">Filtrar</button>
            {q && (
               <Link href="/admin/produtos" className="bg-red-100 text-red-600 font-bold py-2 px-4 rounded-lg hover:bg-red-200 transition shadow-sm text-sm border border-red-200">Limpar</Link>
            )}
          </form>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="p-4 font-medium w-16">Foto</th>
              <th className="p-4 font-medium w-32">SKU</th>
              <th className="p-4 font-medium">Nome do Produto</th>
              <th className="p-4 font-medium">Categoria</th>
              <th className="p-4 font-medium">Preço Normal</th>
              <th className="p-4 font-medium text-green-600">Promoção</th>
              <th className="p-4 font-medium">Estoque</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {produtos && produtos.length > 0 ? (
              produtos.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    {item.imagens && item.imagens.length > 0 ? (
                      <img src={typeof item.imagens[0] === 'string' ? item.imagens[0].split(/[\r\n]+/)[0] : ''} alt="Miniatura" className="w-12 h-12 object-cover rounded border border-gray-200" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded border border-gray-300 flex items-center justify-center text-[9px] text-gray-400 text-center leading-tight">Sem<br/>Foto</div>
                    )}
                  </td>
                  <td className="p-4 font-bold text-gray-500">{item.codigo_barras || 'Sem SKU'}</td>
                  <td className="p-4 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      {paiIds.has(item.id) && (
                        <span title="Produto Pai (tem variações)" className="text-yellow-400 text-lg leading-none">★</span>
                      )}
                      {item.nome}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{item.categorias?.nome || 'Sem Categoria'}</td>
                  <td className="p-4 font-bold text-gray-600">
                    R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                  </td>
                  <td className="p-4 font-bold text-green-600">
                    {item.preco_promocional ? `R$ ${Number(item.preco_promocional).toFixed(2).replace('.', ',')}` : '-'}
                  </td>
                  <td className="p-4 text-gray-600">{item.estoque}</td>
                  <td className="p-4 text-right flex items-center justify-end">
                    <Link href={`/admin/produtos/${item.id}`} className="text-blue-600 hover:underline font-bold">Editar</Link>
                    <DeleteProductButton id={item.id} nome={item.nome} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
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
