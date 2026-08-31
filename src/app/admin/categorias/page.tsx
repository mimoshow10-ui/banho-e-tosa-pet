import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCategorias() {
  // Busca categorias
  const { data: categorias } = await supabase.from('categorias').select('*').order('nome');

  // Server Action para adicionar categoria
  async function addCategoria(formData: FormData) {
    'use server'
    const nome = formData.get('nome') as string;
    const slug = nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const parent_id = formData.get('parent_id') as string;
    
    await supabase.from('categorias').insert([{ 
      nome, 
      slug,
      parent_id: parent_id ? parent_id : null
    }]);
    
    revalidatePath('/admin/categorias');
    redirect('/admin/categorias');
  }

  // Filtrar apenas categorias principais (que não têm pai) para o dropdown
  const categoriasPrincipais = categorias?.filter(c => !c.parent_id) || [];

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">Categorias e Subcategorias</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Formulário */}
        <div className="w-full md:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-border h-fit">
          <h2 className="font-bold text-lg mb-4">Nova Categoria</h2>
          <form action={addCategoria} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nome da Categoria</label>
              <input name="nome" type="text" required className="w-full border border-border rounded-lg p-2" placeholder="Ex: Premium" />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">É uma Subcategoria de qual?</label>
              <select name="parent_id" className="w-full border border-border rounded-lg p-2 bg-white">
                <option value="">Nenhuma (É uma Categoria Principal)</option>
                {categoriasPrincipais.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Ex: Selecione "Coleiras" para criar "Coleiras {'>'} Premium"</p>
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
              {categorias?.map((cat) => {
                const parent = cat.parent_id ? categorias.find(c => c.id === cat.parent_id) : null;
                return (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">
                      {parent ? (
                        <span className="text-gray-400 font-normal">{parent.nome} &gt; </span>
                      ) : null}
                      {cat.nome}
                    </td>
                    <td className="p-4 text-gray-500">{cat.slug}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
