import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import CountdownTimer from '@/components/CountdownTimer';
import VariationSelector from '@/components/VariationSelector';
import FreteCalculator from '@/components/FreteCalculator';
import ProductMediaGallery from '@/components/ProductMediaGallery';
import ProductAiAssistant from '@/components/ProductAiAssistant';
import ProductCouponsBanner from '@/components/ProductCouponsBanner';
import AddToCartButtons from '@/components/AddToCartButtons';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    
    const { data: produtos } = await supabase
      .from('produtos')
      .select('nome, descricao_curta, seo_title, seo_description, imagens, parent_id')
      .eq('slug', slug)
      .limit(1);

    const rawProduto = produtos && produtos.length > 0 ? produtos[0] : null;

    if (!rawProduto) return { title: 'Produto não encontrado | Banho & Tosa' };

    let produto = rawProduto;
    if (rawProduto.parent_id) {
      const { data: parentProduct } = await supabase
        .from('produtos')
        .select('nome, descricao_curta, seo_title, seo_description, imagens')
        .eq('id', rawProduto.parent_id)
        .maybeSingle();
      if (parentProduct) {
        produto = parentProduct;
      }
    }

    const title = (produto.seo_title || `${produto.nome} | Banho & Tosa Pet`).slice(0, 70);
    const rawDesc = produto.seo_description || produto.descricao_curta || `Compre ${produto.nome} no Banho & Tosa Pet!`;
    const description = rawDesc.replace(/<[^>]*>?/gm, '').replace(/[\r\n]+/g, ' ').slice(0, 160).trim();

    let imagem = '/banner-pet.jpg';
    if (produto.imagens && produto.imagens.length > 0) {
      const rawImg = produto.imagens[0];
      if (typeof rawImg === 'string' && rawImg.trim()) {
        imagem = rawImg.split(/[\r\n,]+/)[0].trim();
      }
    }

    return {
      title,
      description,
      openGraph: { title, description, images: [imagem], type: 'website' },
      twitter: { card: 'summary_large_image', title, description, images: [imagem] }
    };
  } catch {
    return { title: 'Banho & Tosa Pet' };
  }
}

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*')
    .eq('slug', slug)
    .limit(1);

  const rawProduto = produtos && produtos.length > 0 ? produtos[0] : null;

  if (!rawProduto) notFound();

  // Se o produto acessado for um FILHO, buscar o produto PAI como anúncio principal
  let produto = rawProduto;
  if (rawProduto.parent_id) {
    const { data: parentProduct } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', rawProduto.parent_id)
      .maybeSingle();
    if (parentProduct) {
      produto = parentProduct;
    }
  }

  // Buscar família de variações com segurança
  let family: any[] = [];
  try {
    const familyId = produto.parent_id || produto.id;
    if (familyId) {
      const { data: familyData } = await supabase
        .from('produtos')
        .select('id, nome, slug, imagens, preco, preco_promocional, estoque, ativo')
        .or(`id.eq.${familyId},parent_id.eq.${familyId}`)
        .eq('ativo', true)
        .order('id');
      family = familyData || [];
    }
  } catch {}

  const temVariacoes = Array.isArray(family) && family.length > 1;
  const preco = Number(produto.preco || 0);
  const agora = Date.now();
  const expiraTime = produto.promocao_expira_em ? new Date(produto.promocao_expira_em).getTime() : null;
  const promoExpirada = expiraTime !== null && (isNaN(expiraTime) || expiraTime <= agora);
  const semEstoque = produto.estoque !== null && produto.estoque !== undefined && Number(produto.estoque) <= 0;

  const promoValida = produto.preco_promocional && Number(produto.preco_promocional) < preco && !promoExpirada && !semEstoque;
  const precoPromo = promoValida ? Number(produto.preco_promocional) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">

      {/* ── Bloco principal: Foto | Info ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">

        {/* COLUNA ESQUERDA — Galeria de fotos e vídeo */}
        <ProductMediaGallery
          imagens={produto.imagens || []}
          videoUrl={produto.video_url}
          nome={produto.nome}
        />

        {/* COLUNA DIREITA — Nome, preço, variações, botões, frete */}
        <div className="flex flex-col gap-4">

          {/* Nome */}
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-secondary leading-tight">
            {produto.nome}
          </h1>

          {/* Preço */}
          <div className="flex items-end gap-3">
            {precoPromo ? (
              <>
                <span className="text-lg text-gray-400 line-through">R$ {preco.toFixed(2).replace('.', ',')}</span>
                <span className="text-4xl font-black text-primary">R$ {precoPromo.toFixed(2).replace('.', ',')}</span>
              </>
            ) : (
              <span className="text-4xl font-black text-primary">R$ {preco.toFixed(2).replace('.', ',')}</span>
            )}
            {promoValida && produto.promocao_expira_em && (
              <div className="ml-2">
                <CountdownTimer targetDate={produto.promocao_expira_em} />
              </div>
            )}
          </div>

          {/* Variações (só aparece se tiver filhos vinculados) */}
          {temVariacoes && (
            <div>
              <p className="text-sm font-bold text-gray-500 mb-2">Escolha uma opção:</p>
              <VariationSelector currentSlug={produto.slug} family={family || []} />
            </div>
          )}

          {/* Tamanhos (se houver) */}
          {Array.isArray(produto.tamanhos) && produto.tamanhos.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-500 mb-2">Tamanho:</p>
              <div className="flex gap-2 flex-wrap">
                {produto.tamanhos.map((tam: string) => (
                  <button key={tam} className="px-4 py-2 rounded-lg border-2 border-border font-bold text-secondary hover:border-primary transition text-sm">
                    {tam}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Botões de compra interativos de e-commerce */}
          <AddToCartButtons produto={produto} />

          {/* Cupons da Loja Disponíveis (Shopee Style) */}
          <ProductCouponsBanner
            produtoId={produto.id}
            categoriaId={produto.categoria_id}
            sku={produto.codigo_barras}
          />

          {/* Calculadora de Frete por CEP */}
          <FreteCalculator />

          {/* Campo Pergunte sobre este Produto (IA Assistente) */}
          <ProductAiAssistant produto={produto} />

          {/* Estoque */}
          {produto.estoque > 0 && produto.estoque < 20 && (
            <p className="text-orange-600 font-bold text-sm">⚠️ Apenas {produto.estoque} em estoque!</p>
          )}
        </div>
      </div>

      {/* ── Descrição completa abaixo ── */}
      {(produto.descricao_curta || produto.descricao) && (
        <div className="border-t border-border pt-10">
          <h2 className="text-2xl font-heading font-bold text-secondary mb-6">Descrição do Produto</h2>
          <div
            className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: produto.descricao_curta || produto.descricao }}
          />
        </div>
      )}

    </div>
  );
}
