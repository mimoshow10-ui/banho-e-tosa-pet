import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  // Buscar os dados do produto no banco para gerar as tags SEO dinamicamente
  const { data: produto } = await supabase
    .from('produtos')
    .select('nome, descricao_curta, seo_title, seo_description, imagens')
    .eq('slug', slug)
    .single();

  if (!produto) {
    return {
      title: 'Produto não encontrado | Banho & Tosa',
    };
  }

  const title = produto.seo_title || `${produto.nome} | Banho & Tosa Pet`;
  const description = produto.seo_description || produto.descricao_curta || `Compre ${produto.nome} no Banho & Tosa Pet com as melhores condições!`;
  
  // Pegar a imagem principal para aparecer ao compartilhar o link no WhatsApp/Instagram
  const imagem = produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : '/banner-pet.jpg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imagem],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imagem],
    }
  };
}

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Puxar o produto real do banco usando a URL
  const { data: produto } = await supabase
    .from('produtos')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!produto) {
    notFound(); 
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Galeria de Imagens REAIS */}
        <div className="flex flex-col gap-4">
          <div className="w-full aspect-square bg-gray-100 rounded-2xl border border-border relative overflow-hidden">
             {produto.imagens && produto.imagens.length > 0 ? (
                <Image src={produto.imagens[0]} alt={produto.nome} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-gray-200">Sem Foto</div>
              )}
          </div>
          {produto.imagens && produto.imagens.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {produto.imagens.slice(1).map((img: string, index: number) => (
                <div key={index} className="w-24 h-24 bg-gray-100 rounded-xl border border-border flex-shrink-0 relative overflow-hidden">
                  <Image src={img} alt={`Foto ${index}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
          
          {/* VÍDEO DO PRODUTO */}
          {produto.video_url && (
            <div className="w-full mt-4 bg-black rounded-2xl overflow-hidden aspect-video border border-border">
              {produto.video_url.includes('youtube.com') || produto.video_url.includes('youtu.be') ? (
                <iframe 
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${
                    produto.video_url.includes('v=') 
                      ? produto.video_url.split('v=')[1].split('&')[0] 
                      : produto.video_url.split('youtu.be/')[1]?.split('?')[0]
                  }`}
                  title="Vídeo do Produto"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video controls className="w-full h-full">
                  <source src={produto.video_url} />
                  Seu navegador não suporta vídeos.
                </video>
              )}
            </div>
          )}
        </div>

        {/* Informações do Produto REAIS */}
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-secondary mb-4">
            {produto.nome}
          </h1>
          
          <div className="text-3xl font-bold text-primary mb-6">
            R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
          </div>

          {produto.descricao_curta || produto.descricao ? (
            <div 
              className="text-gray-600 mb-8 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: produto.descricao_curta || produto.descricao }}
            />
          ) : (
            <p className="text-gray-600 mb-8 leading-relaxed">
              Nenhuma descrição fornecida para este produto.
            </p>
          )}

          {/* Variações de Tamanho */}
          {produto.tamanhos && produto.tamanhos.length > 0 && (
            <div className="mb-8">
              <h3 className="font-bold text-secondary mb-3">Tamanho:</h3>
              <div className="flex gap-3">
                {produto.tamanhos.map((tam: string) => (
                  <button key={tam} className="w-12 h-12 rounded-lg border-2 border-border font-bold text-secondary hover:border-primary transition">
                    {tam}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-auto">
            <Link href="/carrinho" className="flex-1 bg-accent text-text text-center font-bold text-lg py-4 rounded-xl hover:bg-yellow-400 transition shadow-sm">
              Adicionar ao Carrinho
            </Link>
          </div>
        </div>
      </div>

      {/* SEÇÃO COMPRE JUNTO (Cross-sell) */}
      <div className="mt-24 border-t border-border pt-12">
        <h2 className="text-2xl font-heading font-bold text-secondary mb-8">Compre Junto e Ganhe Desconto</h2>
        <div className="flex flex-col md:flex-row gap-8 items-center bg-gray-50 p-6 rounded-2xl border border-border">
          {/* Produto Atual */}
          <div className="flex flex-col items-center max-w-[200px] text-center">
             <div className="w-32 h-32 bg-gray-200 rounded-xl mb-4"></div>
             <p className="font-bold text-sm line-clamp-2">{produto.nome}</p>
             <p className="text-primary font-bold">R$ {Number(produto.preco).toFixed(2).replace('.', ',')}</p>
          </div>
          
          <div className="text-3xl font-bold text-gray-300">+</div>
          
          {/* Produto Relacionado (Anúncio de outro produto) */}
          <div className="flex flex-col items-center max-w-[200px] text-center">
             <div className="w-32 h-32 bg-blue-100 rounded-xl mb-4 flex items-center justify-center text-blue-500 font-bold text-xs p-2">Produto Linkado no Painel</div>
             <p className="font-bold text-sm line-clamp-2">Ex: Plaquinha de Identificação</p>
             <p className="text-primary font-bold">R$ 15,00</p>
          </div>

          <div className="text-3xl font-bold text-gray-300">=</div>

          {/* Resumo da Compra Conjunta */}
          <div className="flex flex-col items-center bg-white p-6 rounded-xl border border-border shadow-sm ml-auto w-full md:w-auto">
            <p className="text-gray-500 mb-2">Comprando os dois juntos:</p>
            <p className="text-3xl font-bold text-primary mb-4">R$ {Number(Number(produto.preco) + 15).toFixed(2).replace('.', ',')}</p>
            <button className="bg-secondary text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-900 transition w-full">
              Levar o Kit
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
