import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import ImageManager from '@/components/ImageManager';
import CategorySelector from '@/components/CategorySelector';

export default async function NovoProduto() {
  const { data: categorias } = await supabase.from('categorias').select('*').order('nome');

  async function salvarProduto(formData: FormData) {
    'use server'
    const nome = formData.get('nome') as string;
    const preco = parseFloat(formData.get('preco') as string);
    const estoque = parseInt(formData.get('estoque') as string);
    const categoria_id = formData.get('categoria_id') as string;
    const slug = nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '-' + Date.now();
    
    const imagensTxt = formData.get('imagens') as string;
    const imagens = imagensTxt ? imagensTxt.split(/[\r\n,]+/).map(s => s.trim()).filter(s => s) : null;
    
    await supabase.from('produtos').insert([{ 
      nome, 
      preco, 
      estoque, 
      categoria_id, 
      slug,
      imagens
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

        <div className="mt-2">
          <CategorySelector categorias={categorias || []} defaultCategoriaId={null} />
        </div>

        {/* SEÇÃO DE VARIAÇÕES (PREÇOS INDIVIDUAIS E SKUS) */}
        <div className="border-t border-border pt-6 mt-2">
          <h2 className="text-lg font-bold mb-2 text-secondary">Variações do Produto (Ex: Pacotes, Tamanhos)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Aqui você cadastra as opções que aparecerão dentro do anúncio. Cada opção terá seu próprio preço, SKU e estoque!
          </p>
          
          <div className="bg-gray-50 border border-border rounded-lg p-4 flex flex-col gap-4">
            
            {/* Variação 1 */}
            <div className="flex gap-4 items-end bg-white p-3 border border-gray-200 rounded shadow-sm">
              <div className="flex-1">
                <label className="block text-xs font-bold mb-1">Nome da Variação (ex: 25 un)</label>
                <input name="var_nome_1" type="text" placeholder="25 unidades" className="w-full border border-border rounded p-2 text-sm" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold mb-1">SKU (Bling)</label>
                <input name="var_sku_1" type="text" placeholder="SKU003" className="w-full border border-border rounded p-2 text-sm" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold mb-1">Preço (R$)</label>
                <input name="var_preco_1" type="number" placeholder="10.00" className="w-full border border-border rounded p-2 text-sm" />
              </div>
              <div className="w-24">
                <label className="block text-xs font-bold mb-1">Estoque</label>
                <input name="var_estoque_1" type="number" placeholder="100" className="w-full border border-border rounded p-2 text-sm" />
              </div>
            </div>

            {/* Variação 2 */}
            <div className="flex gap-4 items-end bg-white p-3 border border-gray-200 rounded shadow-sm">
              <div className="flex-1">
                <label className="block text-xs font-bold mb-1">Nome da Variação (ex: 50 un)</label>
                <input name="var_nome_2" type="text" placeholder="50 unidades" className="w-full border border-border rounded p-2 text-sm" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold mb-1">SKU (Bling)</label>
                <input name="var_sku_2" type="text" placeholder="SKU001" className="w-full border border-border rounded p-2 text-sm" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold mb-1">Preço (R$)</label>
                <input name="var_preco_2" type="number" placeholder="18.00" className="w-full border border-border rounded p-2 text-sm" />
              </div>
              <div className="w-24">
                <label className="block text-xs font-bold mb-1">Estoque</label>
                <input name="var_estoque_2" type="number" placeholder="250" className="w-full border border-border rounded p-2 text-sm" />
              </div>
            </div>

            <button type="button" className="text-sm font-bold text-blue-600 hover:underline w-fit">
              + Adicionar mais uma variação (SKU)
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <label className="block text-sm font-medium mb-3">Imagens do Anúncio Principal</label>
          <ImageManager initialImages={[]} />
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
