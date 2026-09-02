import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import CategorySelector from '@/components/CategorySelector';

async function atualizarProduto(formData: FormData) {
  'use server'
  const id = formData.get('id') as string;
  const nome = formData.get('nome') as string;
  const preco_str = formData.get('preco') as string;
  const preco = parseFloat(preco_str.replace(',', '.'));
  
  const preco_promocional_str = formData.get('preco_promocional') as string;
  const preco_promocional = preco_promocional_str ? parseFloat(preco_promocional_str.replace(',', '.')) : null;
  const estoque = parseInt(formData.get('estoque') as string);
  const categoria_id = formData.get('categoria_id') as string;
  
  // Convert imagens textarea content to array
  const imagensTxt = formData.get('imagens') as string;
  const imagensArr = imagensTxt ? imagensTxt.split(/[\r\n,]+/).map(s => s.trim()).filter(s => s) : [];
  
  // Video URL
  const video_url = formData.get('video_url') as string;

  // Extract related products
  const relacionadosTxt = formData.get('relacionados') as string;
  const relacionadosArr = relacionadosTxt ? relacionadosTxt.split(',').map(s => s.trim()).filter(s => s) : [];

  const codigo_barras = formData.get('codigo_barras') as string;
  const promocao_expira_em = formData.get('promocao_expira_em') as string;

  const payload = { 
    nome, 
    codigo_barras,
    preco, 
    preco_promocional,
    estoque, 
    video_url: video_url || null,
    categoria_id: categoria_id || null, 
    imagens: imagensArr.length > 0 ? imagensArr : null,
    produtos_relacionados: relacionadosArr.length > 0 ? relacionadosArr : null,
    destaque_super_promocao: formData.get('super_promocao') === 'on',
    promocao_expira_em: promocao_expira_em ? new Date(promocao_expira_em).toISOString() : null
  };

  const { error } = await supabase.from('produtos').update(payload).eq('id', id);
  
  if (error) {
    redirect(`/admin/produtos/${id}?erro=Erro ao salvar: ${error.message}`);
  }

  revalidatePath('/admin/produtos');
  revalidatePath('/');
  if (categoria_id) {
    const { data: cat } = await supabase.from('categorias').select('slug').eq('id', categoria_id).single();
    if (cat) revalidatePath(`/categoria/${cat.slug}`);
  }
  
  redirect(`/admin/produtos/${id}?msg=Produto atualizado com sucesso!`);
}

export default async function EditarProduto(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const { data: produto } = await supabase.from('produtos').select('*').eq('id', id).single();
  const { data: categorias } = await supabase.from('categorias').select('*');

  if (!produto) {
    return <div className="p-8 font-bold text-red-600">Produto no encontrado!</div>;
  }

  if (produto && produto.imagens) {
    if (produto.imagens.length === 1 && typeof produto.imagens[0] === 'string' && produto.imagens[0].match(/[\r\n]/)) {
      produto.imagens = produto.imagens[0].split(/[\r\n,]+/).map((s: string) => s.trim()).filter((s: string) => s);
    }
  }
  return (
    <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-border">
      <h1 className="text-2xl font-bold mb-6 text-secondary">Editar Produto</h1>
      
      <form action={atualizarProduto} className="flex flex-col gap-6">
        <input type="hidden" name="id" value={id} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">Nome do Produto</label>
            <input name="nome" type="text" required defaultValue={produto.nome} className="w-full border border-border rounded-lg p-2" />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">SKU</label>
            <input name="codigo_barras" type="text" defaultValue={produto.codigo_barras || ''} className="w-full border border-border rounded-lg p-2" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Preço Normal (R$)</label>
            <input name="preco" type="text" defaultValue={produto.preco} required className="w-full border border-border rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm font-bold text-green-600 mb-1">Preço Promoção (R$)</label>
            <input name="preco_promocional" type="text" defaultValue={produto.preco_promocional || ''} className="w-full border border-green-400 focus:ring-green-500 focus:border-green-500 rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm font-bold text-red-600 mb-1">Validade Promoção</label>
            <input name="promocao_expira_em" type="datetime-local" defaultValue={produto.promocao_expira_em ? new Date(produto.promocao_expira_em).toISOString().slice(0,16) : ''} className="w-full border border-red-300 rounded-lg p-2" />
          </div>
          <div className="col-span-1 flex items-center justify-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer border border-border rounded-lg p-2 bg-gray-50 w-full justify-center">
              <input type="checkbox" name="super_promocao" defaultChecked={produto.destaque_super_promocao} className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-gray-700 leading-tight">Capa Super<br/>Promoção</span>
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Estoque Físico</label>
            <input name="estoque" type="number" defaultValue={produto.estoque} className="w-full border border-border rounded-lg p-2 bg-gray-50" readOnly />
          </div>
        </div>

        <div className="mt-6">
          <CategorySelector categorias={categorias || []} defaultCategoriaId={produto.categoria_id} />
        </div>

        <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-border">
          <h2 className="font-bold text-secondary mb-4">Dados Importados do Bling</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-500 mb-1">Marca</label>
              <input type="text" readOnly value={produto.marca || ''} className="w-full border border-border rounded p-2 bg-gray-100 text-gray-600" />
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
          <label className="block text-sm font-medium mb-1">Imagens do Produto (Links)</label>
          <textarea 
            name="imagens" 
            defaultValue={produto.imagens ? produto.imagens.join('\n') : ''} 
            placeholder="Cole o link da foto aqui..." 
            className="w-full border border-border rounded-lg p-2 h-24 text-sm"
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">Links separados por vírgula ou quebra de linha. Altere a ordem dos links para mudar a ordem das fotos.</p>
          
          {/* Miniaturas de Fotos */}
          {produto.imagens && produto.imagens.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {produto.imagens.map((img: string, i: number) => (
                <div key={i} className="relative w-20 h-20 flex-shrink-0 border border-gray-300 rounded overflow-hidden">
                  <div className="absolute top-0 left-0 bg-black/50 text-white text-[10px] px-1 z-10">{i + 1}</div>
                  <img src={img} alt={`Foto ${i+1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">URL do Vídeo (YouTube, MP4, etc)</label>
          <input name="video_url" type="url" defaultValue={produto.video_url || ''} placeholder="Ex: https://youtube.com/watch?v=..." className="w-full border border-border rounded-lg p-2" />
          <p className="text-xs text-gray-500 mt-1">Opcional. Se preenchido, o vídeo aparecerá abaixo das fotos na página do produto.</p>
        </div>

        <button type="submit" className="bg-primary text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition mt-4">
          Salvar Alterações
        </button>
      </form>
    </div>
  );
}
