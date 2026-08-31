import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export default async function EditarProduto(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { data: produto } = await supabase.from('produtos').select('*').eq('id', params.id).single();
  const { data: categorias } = await supabase.from('categorias').select('*').order('nome');

  if (!produto) return <div>Produto não encontrado</div>;

  async function atualizarProduto(formData: FormData) {
    'use server'
    const nome = formData.get('nome') as string;
    const preco = parseFloat(formData.get('preco') as string);
    const estoque = parseInt(formData.get('estoque') as string);
    const categoria_id = formData.get('categoria_id') as string;
    
    // Convert imagens textarea content to array
    const imagensTxt = formData.get('imagens') as string;
    const imagensArr = imagensTxt ? imagensTxt.split(',').map(s => s.trim()).filter(s => s) : [];
    
    // Extract related products
    const relacionadosTxt = formData.get('relacionados') as string;
    const relacionadosArr = relacionadosTxt ? relacionadosTxt.split(',').map(s => s.trim()).filter(s => s) : [];

    await supabase.from('produtos').update({ 
      nome, 
      preco, 
      estoque, 
      categoria_id: categoria_id || null, 
      imagens: imagensArr.length > 0 ? imagensArr : null,
      relacionados: relacionadosArr.length > 0 ? relacionadosArr : null
    }).eq('id', params.id);

    revalidatePath('/admin/produtos');
    revalidatePath('/');
    if (categoria_id) {
      const cat = categorias?.find(c => c.id === categoria_id);
      if (cat) revalidatePath(`/categoria/${cat.slug}`);
    }
    
    redirect('/admin/produtos?msg=Produto atualizado com sucesso!');
  }

  return (
    <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-border">
      <h1 className="text-2xl font-bold mb-6 text-secondary">Editar Produto</h1>
      
      <form action={atualizarProduto} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nome do Produto</label>
          <input name="nome" type="text" required defaultValue={produto.nome} className="w-full border border-border rounded-lg p-2" />
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Preço (R$)</label>
            <input name="preco" type="number" step="0.01" required defaultValue={produto.preco} className="w-full border border-border rounded-lg p-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Estoque Físico</label>
            <input name="estoque" type="number" required defaultValue={produto.estoque || 0} className="w-full border border-border rounded-lg p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Categoria (ou Subcategoria)</label>
          <select name="categoria_id" className="w-full border border-border rounded-lg p-2 bg-white" defaultValue={produto.categoria_id || ""}>
            <option value="">Nenhuma Categoria (Fica solto na loja)</option>
            {categorias?.map(c => {
              const isSub = !!c.parent_id;
              const parent = isSub ? categorias.find(p => p.id === c.parent_id) : null;
              const nomeFinal = parent ? `${parent.nome} > ${c.nome}` : c.nome;
              return (
                <option key={c.id} value={c.id}>
                  {nomeFinal}
                </option>
              );
            }).sort((a, b) => {
              const textA = a.props.children as string;
              const textB = b.props.children as string;
              return textA.localeCompare(textB);
            })}
          </select>
        </div>

        <div className="border-t border-border pt-6 mt-4">
          <h2 className="text-lg font-bold mb-4 text-secondary">Dados Importados do Bling</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-border">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">SKU / Código de Barras (GTIN)</label>
              <input name="codigo_barras" type="text" readOnly defaultValue={produto.codigo_barras} className="w-full border border-border rounded p-2 text-sm bg-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Marca</label>
              <input name="marca" type="text" readOnly defaultValue={produto.marca} className="w-full border border-border rounded p-2 text-sm bg-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Peso Líquido</label>
              <input name="peso_liquido" type="text" readOnly defaultValue={produto.peso_liquido} className="w-full border border-border rounded p-2 text-sm bg-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Peso Bruto</label>
              <input name="peso_bruto" type="text" readOnly defaultValue={produto.peso_bruto} className="w-full border border-border rounded p-2 text-sm bg-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Dimensões (L x A x P)</label>
              <input type="text" readOnly defaultValue={`${produto.largura} x ${produto.altura} x ${produto.profundidade}`} className="w-full border border-border rounded p-2 text-sm bg-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">NCM</label>
              <input name="ncm" type="text" readOnly defaultValue={produto.ncm} className="w-full border border-border rounded p-2 text-sm bg-gray-100" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Imagens do Produto (Puxadas do Bling)</label>
          <textarea 
            name="imagens" 
            defaultValue={produto.imagens ? produto.imagens.join(', ') : ''} 
            placeholder="Cole o link da foto aqui..." 
            className="w-full border border-border rounded-lg p-2 h-20"
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">Links separados por vírgula.</p>
        </div>

        <button type="submit" className="bg-primary text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition mt-4">
          Salvar Alterações
        </button>
      </form>
    </div>
  );
}
