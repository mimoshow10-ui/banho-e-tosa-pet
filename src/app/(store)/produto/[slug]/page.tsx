import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import CountdownTimer from '@/components/CountdownTimer';
import VariationSelector from '@/components/VariationSelector';
import FreteCalculator from '@/components/FreteCalculator';
import ProductMediaGallery from '@/components/ProductMediaGallery';
import ProductAiAssistant from '@/components/ProductAiAssistant';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  const { data: produto } = await supabase
    .from('produtos')
    .select('nome, descricao_curta, seo_title, seo_description, imagens')
    .eq('slug', slug)
    .single();

  if (!produto) return { title: 'Produto não encontrado | Banho & Tosa' };

  const title = produto.seo_title || `${produto.nome} | Banho & Tosa Pet`;
  const description = produto.seo_description || produto.descricao_curta || `Compre ${produto.nome} no Banho & Tosa Pet!`;
  const imagem = produto.imagens?.length > 0 ? produto.imagens[0] : '/banner-pet.jpg';

  return {
    title,
    description,
    openGraph: { title, description, images: [imagem], type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: [imagem] }
  };
}

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const { data: produto } = await supabase
    .from('produtos')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!produto) notFound();

  // Buscar família de variações
  const familyId = produto.parent_id || produto.id;
  const { data: family } = await supabase
    .from('produtos')
    .select('id, nome, slug, imagens, preco, preco_promocional, estoque, ativo')
    .or(`id.eq.${familyId},parent_id.eq.${familyId}`)
    .eq('ativo', true)
    .order('id');

  const temVariacoes = family && family.length > 1;
  const preco = Number(produto.preco);
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
          {produto.tamanhos?.length > 0 && (
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

          {/* Botões de compra padrão de e-commerce */}
          <div className="flex flex-col sm:flex-row gap-2.5 mt-1">
            <Link
              href="/carrinho"
              className="flex-1 bg-accent text-text text-center font-bold text-sm md:text-base py-3 rounded-xl hover:bg-yellow-400 transition shadow-xs border border-yellow-300 flex items-center justify-center gap-1.5"
            >
              🛒 Adicionar ao Carrinho
            </Link>
            <Link
              href="/carrinho"
              className="flex-1 bg-primary text-white text-center font-bold text-sm md:text-base py-3 rounded-xl hover:bg-orange-600 transition shadow-sm flex items-center justify-center gap-1.5"
            >
              ⚡ Comprar Agora
            </Link>
          </div>

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
