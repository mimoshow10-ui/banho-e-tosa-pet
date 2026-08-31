import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Pencil, Trash2, Plus, ExternalLink } from 'lucide-react';

export default async function AdminProdutos({ searchParams }: { searchParams: { msg?: string, erro?: string } }) {

  // Ação de importar produto
  async function importarSKU(formData: FormData) {
    'use server'
    const sku = formData.get('sku') as string;
    if (!sku) return;

    let redirectTo = '';

    try {
      const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
      const token = cfg?.valor?.access_token;
      
      if (!token) {
        redirectTo = `/admin/produtos?erro=Token do Bling não encontrado. Vá nas Configurações e autorize o app.`;
      } else {
        const response = await fetch(`https://www.bling.com.br/Api/v3/produtos?codigo=${sku}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
          redirectTo = `/admin/produtos?erro=Produto SKU ${sku} não encontrado no Bling.`;
        } else {
          const prod = data.data[0];
          const produtoParaInserir = {
            bling_id: String(prod.id),
            codigo_barras: prod.codigo,
            nome: prod.nome,
            preco: prod.preco,
            slug: prod.nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '-' + Date.now(),
            ativo: prod.situacao === 'A'
          };

          const { error } = await supabase.from('produtos').upsert(produtoParaInserir, { onConflict: 'bling_id' });
          
          if (error) {
            redirectTo = `/admin/produtos?erro=A Vercel não conseguiu salvar no Banco de Dados.`;
          } else {
            redirectTo = `/admin/produtos?msg=Sucesso! O produto ${prod.nome} foi importado!`;
          }
        }
      }
    } catch (error) {
      redirectTo = `/admin/produtos?erro=Erro fatal ao comunicar com o Bling.`;
    }

    if (redirectTo) {
      revalidatePath('/admin/produtos');
      redirect(redirectTo);
    }
  }

  const { data: produtos } = await supabase.from('produtos').select('*').order('nome');

  return (
    <div>
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

      {/* Área de Importar via Bling */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
        <h2 className="text-lg font-bold mb-2 text-secondary flex items-center gap-2">Puxar Produto do Bling</h2>
        <form action={importarSKU} className="flex gap-4 items-end">
          <div className="flex-1 max-w-sm">
            <label className="block text-sm font-medium mb-1 text-gray-600">SKU do Produto</label>
            <input name="sku" type="text" required placeholder="Ex: kit29" className="w-full border border-border rounded-lg p-2" />
          </div>
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition h-[42px]">
            Importar
          </button>
        </form>
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
