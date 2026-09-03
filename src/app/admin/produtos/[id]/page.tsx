import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import CategorySelector from '@/components/CategorySelector';
import ImageManager from '@/components/ImageManager';
import VariacaoManager from '@/components/VariacaoManager';

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
  let expiraIso = null;
  if (promocao_expira_em) {
    const dateStr = promocao_expira_em.length === 16 ? `${promocao_expira_em}:00-03:00` : promocao_expira_em;
    expiraIso = new Date(dateStr).toISOString();
  }

  const destaque_home = formData.get('destaque_home') as string;
  const isSuperPromo = destaque_home === 'super_promocao';

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
    destaque_super_promocao: isSuperPromo,
    promocao_expira_em: expiraIso
  };

  const { error } = await supabase.from('produtos').update(payload).eq('id', id);
  
  if (error) {
    redirect(`/admin/produtos/${id}?erro=Erro ao salvar: ${error.message}`);
  }

  // Atualizar listas de destaques da Home em configuracoes
  try {
    const { data: configCurrent } = await supabase.from('configuracoes').select('valor').eq('chave', 'vitrine_destaques').single();
    let valorAtual = configCurrent?.valor || { mais_vendidos: [], novidades: [] };

    let mvList: string[] = (valorAtual.mais_vendidos || []).filter((prodId: string) => prodId !== id);
    let novList: string[] = (valorAtual.novidades || []).filter((prodId: string) => prodId !== id);

    if (destaque_home === 'mais_vendidos') {
      mvList.unshift(id);
    } else if (destaque_home === 'lancamento') {
      novList.unshift(id);
    }

    await supabase.from('configuracoes').upsert({
      chave: 'vitrine_destaques',
      valor: {
        mais_vendidos: Array.from(new Set(mvList)),
        novidades: Array.from(new Set(novList))
      }
    }, { onConflict: 'chave' });
  } catch {}

  revalidatePath('/admin/produtos');
  revalidatePath('/');
  
  const { data: prodExistente } = await supabase.from('produtos').select('slug').eq('id', id).single();
  if (prodExistente) {
    revalidatePath(`/produto/${prodExistente.slug}`);
  }

  if (categoria_id) {
    const { data: cat } = await supabase.from('categorias').select('slug').eq('id', categoria_id).single();
    if (cat) revalidatePath(`/categoria/${cat.slug}`);
  }
  
  redirect(`/admin/produtos?msg=Produto atualizado com sucesso!`);
}

export default async function EditarProduto(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const { data: produto } = await supabase.from('produtos').select('*').eq('id', id).single();
  const { data: categorias } = await supabase.from('categorias').select('*');
  const { data: configDestaques } = await supabase.from('configuracoes').select('valor').eq('chave', 'vitrine_destaques').single();
  const valorDestaques = configDestaques?.valor || { mais_vendidos: [], novidades: [] };

  let destaqueInicial = 'nenhum';
  if (produto?.destaque_super_promocao) {
    destaqueInicial = 'super_promocao';
  } else if (Array.isArray(valorDestaques.mais_vendidos) && valorDestaques.mais_vendidos.includes(id)) {
    destaqueInicial = 'mais_vendidos';
  } else if (Array.isArray(valorDestaques.novidades) && valorDestaques.novidades.includes(id)) {
    destaqueInicial = 'lancamento';
  }

  // Buscar variações já vinculadas (filhos deste produto)
  const familyId = produto?.parent_id || id;
  const { data: familyRaw } = await supabase
    .from('produtos')
    .select('id, nome, codigo_barras, imagens, preco')
    .or(`id.eq.${familyId},parent_id.eq.${familyId}`)
    .neq('id', id);
  const variacoes = (familyRaw || []) as any[];

  // Todos os produtos para busca (só id, nome, sku, imagem, preco)
  const { data: todosProdutosRaw } = await supabase
    .from('produtos')
    .select('id, nome, codigo_barras, imagens, preco')
    .order('nome');
  const todosProdutos = (todosProdutosRaw || []) as any[];

  if (!produto) {
    return <div className="p-8 font-bold text-red-600">Produto não encontrado!</div>;
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 min-h-[36px] flex items-end">
              Preço Normal (R$)
            </label>
            <input
              name="preco"
              type="text"
              defaultValue={produto.preco}
              required
              className="w-full border border-gray-300 rounded-xl p-2.5 h-11 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-green-700 mb-1 min-h-[36px] flex items-end">
              Preço Promoção (R$)
            </label>
            <input
              name="preco_promocional"
              type="text"
              defaultValue={produto.preco_promocional || ''}
              className="w-full border border-green-500 rounded-xl p-2.5 h-11 text-sm font-bold text-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none bg-green-50/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-red-600 mb-1 min-h-[36px] flex items-end">
              Validade Promoção
            </label>
            <input
              name="promocao_expira_em"
              type="datetime-local"
              defaultValue={produto.promocao_expira_em ? new Date(new Date(produto.promocao_expira_em).getTime() - 3 * 3600 * 1000).toISOString().slice(0,16) : ''}
              className="w-full border border-red-300 rounded-xl p-2.5 h-11 text-xs font-bold text-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none bg-red-50/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1 min-h-[36px] flex items-end">
              Destaque na Home?
            </label>
            <select
              name="destaque_home"
              defaultValue={destaqueInicial}
              className="w-full border border-primary/50 bg-orange-50/40 rounded-xl p-2.5 h-11 text-xs md:text-sm font-bold text-secondary focus:ring-2 focus:ring-primary focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="nenhum">Nenhum (Vitrine Normal)</option>
              <option value="super_promocao">🔥 Super Promoção</option>
              <option value="mais_vendidos">⭐ Os Mais Vendidos</option>
              <option value="lancamento">🆕 Lançamento / Novidade</option>
            </select>
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

        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-bold mb-2 text-secondary">Variações / Produtos Filhos</h2>
          <p className="text-xs text-gray-500 mb-4">
            Vincule ou remova produtos que funcionam como tamanhos ou pacotes (ex: 25 un, 50 un) deste produto.
          </p>

          <VariacaoManager
            parentId={familyId}
            currentProdutoId={id}
            variacoesIniciais={variacoes}
            todosProdutos={todosProdutos}
          />
        </div>

        <div className="border-t border-border pt-6">
          <label className="block text-sm font-medium mb-3">Imagens do Anúncio (Primeira é a Capa)</label>
          <ImageManager initialImages={produto.imagens || []} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Vídeo Explicativo do Produto (URL do YouTube)</label>
          <input 
            name="video_url" 
            type="url" 
            placeholder="https://www.youtube.com/watch?v=..." 
            defaultValue={produto.video_url || ''} 
            className="w-full border border-border rounded-lg p-2" 
          />
          <p className="text-xs text-gray-500 mt-1">Cole o link completo do vídeo do YouTube para ser exibido na página de vendas.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Produtos Relacionados (Mais Opções de Compra)</label>
          <input 
            name="relacionados" 
            type="text" 
            placeholder="IDs dos produtos separados por vírgula" 
            defaultValue={produto.produtos_relacionados ? produto.produtos_relacionados.join(', ') : ''} 
            className="w-full border border-border rounded-lg p-2" 
          />
          <p className="text-xs text-gray-500 mt-1">IDs dos produtos que aparecerão na seção "Compre Junto".</p>
        </div>

        <button type="submit" className="bg-primary text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition mt-4">
          Salvar Alterações
        </button>
      </form>
    </div>
  );
}
