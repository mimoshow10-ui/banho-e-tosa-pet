import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export default async function NovoProduto() {
  const { data: categorias } = await supabase.from('categorias').select('*').order('nome');

  async function salvarProduto(formData: FormData) {
    'use server'
    const nome = formData.get('nome') as string;
    const preco = parseFloat(formData.get('preco') as string);
    const estoque = parseInt(formData.get('estoque') as string);
    const categoria_id = formData.get('categoria_id') as string;
    const slug = nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '-' + Date.now();
    
    await supabase.from('produtos').insert([{ 
      nome, 
      preco, 
      estoque, 
      categoria_id, 
      slug 
    }]);

    revalidatePath('/admin/produtos');
    redirect('/admin/produtos');
  }

  return (
    <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-border">
      <h1 className="text-2xl font-bold mb-6 text-secondary">Cadastrar Novo Produto</h1>
      
      <form action={salvarProduto} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nome do Produto</label>
          <input name="nome" type="text" required className="w-full border border-border rounded-lg p-2" />
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Preço (R$)</label>
            <input name="preco" type="number" step="0.01" required className="w-full border border-border rounded-lg p-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Estoque Inicial</label>
            <input name="estoque" type="number" required defaultValue="0" className="w-full border border-border rounded-lg p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Categoria</label>
          <select name="categoria_id" required className="w-full border border-border rounded-lg p-2 bg-white">
            <option value="">Selecione uma categoria...</option>
            {categorias?.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Tamanhos Disponíveis</label>
            <input name="tamanhos" type="text" placeholder="Ex: P, M, G" className="w-full border border-border rounded-lg p-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Cores</label>
            <input name="cores" type="text" placeholder="Ex: Azul, Vermelho" className="w-full border border-border rounded-lg p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Imagens (Até 10 URLs separadas por vírgula)</label>
          <input name="imagens" type="text" placeholder="https://..., https://..." className="w-full border border-border rounded-lg p-2" />
          <p className="text-xs text-gray-500 mt-1">Essas fotos virão automaticamente do Bling na exportação.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Produtos Relacionados (Mais Opções de Compra)</label>
          <input name="relacionados" type="text" placeholder="IDs dos produtos separados por vírgula" className="w-full border border-border rounded-lg p-2" />
          <p className="text-xs text-gray-500 mt-1">Produtos que aparecerão na seção "Compre Junto".</p>
        </div>

        <button type="submit" className="bg-primary text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition mt-4">
          Salvar Produto
        </button>
      </form>
    </div>
  );
}
