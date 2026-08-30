import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export default async function AdminCategorias() {
  // Busca categorias
  const { data: categorias } = await supabase.from('categorias').select('*').order('nome');

  // Server Action para adicionar categoria
  async function addCategoria(formData: FormData) {
    'use server'
    const nome = formData.get('nome') as string;
    const slug = nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    await supabase.from('categorias').insert([{ nome, slug }]);
    
    revalidatePath('/admin/categorias');
    redirect('/admin/categorias');
  }

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">Categorias</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Formulário */}
        <div className="w-full md:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-border h-fit">
          <h2 className="font-bold text-lg mb-4">Nova Categoria</h2>
          <form action={addCategoria} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nome da Categoria</label>
              <input name="nome" type="text" required className="w-full border border-border rounded-lg p-2" placeholder="Ex: Coleiras" />
            </div>
            <button type="submit" className="bg-primary text-white py-2 rounded-lg font-bold hover:bg-orange-600">
              Salvar
            </button>
          </form>
        </div>

        {/* Lista */}
        <div className="w-full md:w-2/3 bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="p-4 font-medium">Nome</th>
                <th className="p-4 font-medium">Slug (URL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {categorias?.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{cat.nome}</td>
                  <td className="p-4 text-gray-500">{cat.slug}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
