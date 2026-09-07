import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import CountdownTimer from '@/components/CountdownTimer';
import VariationSelector from '@/components/VariationSelector';
import FreteCalculator from '@/components/FreteCalculator';
import ProductMediaGallery, { extractImageUrls } from '@/components/ProductMediaGallery';
import ProductAiAssistant from '@/components/ProductAiAssistant';
import ProductCouponsBanner from '@/components/ProductCouponsBanner';
import AddToCartButtons from '@/components/AddToCartButtons';
import SafeComponent from '@/components/SafeComponent';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function buscarProdutoMultiEstagio(slugOrQuery: string) {
  const raw = decodeURIComponent(slugOrQuery || '').trim();
  if (!raw) return null;

  try {
    // 1. Busca exata por Slug, ID, Código de Barras ou SKU
    const { data: d1 } = await supabase
      .from('produtos')
      .select('*')
      .or(`slug.eq.${raw},id.eq.${raw},codigo_barras.ilike.${raw},sku.ilike.${raw}`)
      .limit(1);

    if (d1 && d1.length > 0) return d1[0];

    // 2. Tentar busca limpando sufixos numéricos (ex: -15831840276) ou prefixos numéricos (ex: 1-)
    const clean = raw.replace(/-\d+$/, '').replace(/^\d+-/, '').trim();
    if (clean) {
      const { data: d2 } = await supabase
        .from('produtos')
        .select('*')
        .or(`slug.ilike.%${clean}%,id.ilike.%${clean}%,codigo_barras.ilike.%${clean}%,sku.ilike.%${clean}%`)
        .limit(1);
      if (d2 && d2.length > 0) return d2[0];
    }

    // 3. Tentar busca por palavras-chave principais do slug
    const palavras = (clean || raw).split('-').filter((w) => w.length > 2).slice(0, 4).join(' ');
    if (palavras) {
      const { data: d3 } = await supabase
        .from('produtos')
        .select('*')
        .or(`nome.ilike.%${palavras}%,slug.ilike.%${palavras}%`)
        .limit(1);
      if (d3 && d3.length > 0) return d3[0];
    }
  } catch {}

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const rawProduto = await buscarProdutoMultiEstagio(slug);

    if (!rawProduto) return { title: 'Produto não encontrado | Banho & Tosa Pet' };

    let produto = rawProduto;
    if (rawProduto.parent_id) {
      try {
        const { data: parentProduct } = await supabase
          .from('produtos')
          .select('nome, descricao_curta, seo_title, seo_description, imagens')
          .eq('id', rawProduto.parent_id)
          .maybeSingle();
        if (parentProduct) {
          produto = parentProduct;
        }
      } catch {}
    }

    const title = String(produto.seo_title || `${produto.nome || 'Produto'} | Banho & Tosa Pet`).slice(0, 70);
    const rawDesc = String(produto.seo_description || produto.descricao_curta || `Compre ${produto.nome || 'produtos'} no Banho & Tosa Pet!`);
    const description = rawDesc.replace(/<[^>]*>?/gm, '').replace(/[\r\n]+/g, ' ').slice(0, 160).trim();

    let imagem = '/logo-luxo.png';
    try {
      const fotos = extractImageUrls(produto.imagens);
      if (fotos.length > 0) imagem = fotos[0];
    } catch {}

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
  
  const rawProduto = await buscarProdutoMultiEstagio(slug);

  if (!rawProduto) notFound();

  // O produto ativo é exatamente a variação clicada pelo cliente (para exibir preço e SKU correspondentes)
  let produto = { ...rawProduto };
  if (rawProduto.parent_id) {
    try {
      const { data: parentProduct } = await supabase
        .from('produtos')
        .select('imagens')
        .eq('id', rawProduto.parent_id)
        .maybeSingle();

      if (parentProduct) {
        const fotosFilho = extractImageUrls(rawProduto.imagens);
        if (fotosFilho.length === 0 && parentProduct.imagens) {
          produto.imagens = parentProduct.imagens;
        }
      }
    } catch {}
  }

  // Buscar família de variações completa (Pai + todos os Filhos)
  let family: any[] = [];
  try {
    const familyId = rawProduto.parent_id || rawProduto.id;
    if (familyId) {
      const { data: familyData } = await supabase
        .from('produtos')
        .select('id, nome, slug, imagens, preco, preco_promocional, estoque, ativo, parent_id')
        .or(`id.eq.${familyId},parent_id.eq.${familyId}`)
        .eq('ativo', true);
      family = familyData || [];
    }
  } catch {}

  const temVariacoes = Array.isArray(family) && family.length > 1;
  const preco = Number(produto.preco || 0);
  const agora = Date.now();
  const expiraTime = produto.promocao_expira_em ? new Date(produto.promocao_expira_em).getTime() : null;
  const promoExpirada = expiraTime !== null && (isNaN(expiraTime) || expiraTime <= agora);

  const precoPromoVal = produto.preco_promocional ? Number(produto.preco_promocional) : null;
  const promoValida = precoPromoVal !== null && !isNaN(precoPromoVal) && precoPromoVal < preco && !promoExpirada;
  const precoPromo = promoValida ? precoPromoVal : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">

      {/* ── Bloco principal: Foto | Info ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">

        {/* COLUNA ESQUERDA — Galeria de fotos e vídeo */}
        <SafeComponent>
          <ProductMediaGallery
            imagens={produto.imagens || []}
            videoUrl={produto.video_url}
            nome={produto.nome || 'Produto'}
            sku={produto.codigo_barras || produto.sku}
          />
        </SafeComponent>

        {/* COLUNA DIREITA — Nome, preço, variações, botões, frete */}
        <div className="flex flex-col gap-4">

          {/* Nome */}
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-secondary leading-tight">
            {produto.nome || 'Produto'}
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
                <SafeComponent>
                  <CountdownTimer targetDate={produto.promocao_expira_em} />
                </SafeComponent>
              </div>
            )}
          </div>

          {/* Variações (só aparece se tiver filhos vinculados) */}
          {temVariacoes && (
            <SafeComponent>
              <div>
                <p className="text-sm font-bold text-gray-500 mb-2">Escolha uma opção:</p>
                <VariationSelector currentSlug={produto.slug} family={family || []} />
              </div>
            </SafeComponent>
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
          <SafeComponent>
            <AddToCartButtons produto={produto} />
          </SafeComponent>

          {/* Cupons da Loja Disponíveis (Shopee Style) */}
          <SafeComponent>
            <ProductCouponsBanner
              produtoId={produto.id}
              categoriaId={produto.categoria_id}
              sku={produto.codigo_barras}
            />
          </SafeComponent>

          {/* Calculadora de Frete por CEP */}
          <SafeComponent>
            <FreteCalculator />
          </SafeComponent>

          {/* Campo Pergunte sobre este Produto (IA Assistente) */}
          <SafeComponent>
            <ProductAiAssistant produto={produto} />
          </SafeComponent>

          {/* Estoque */}
          {Number(produto.estoque) > 0 && Number(produto.estoque) < 20 && (
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
            dangerouslySetInnerHTML={{ __html: String(produto.descricao_curta || produto.descricao || '') }}
          />
        </div>
      )}

    </div>
  );
}
