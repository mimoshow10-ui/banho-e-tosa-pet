import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

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
        </div>

        {/* Informações do Produto REAIS */}
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-secondary mb-4">
            {produto.nome}
          </h1>
          
          <div className="text-3xl font-bold text-primary mb-6">
            R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed">
            {produto.descricao_curta || produto.descricao || 'Nenhuma descrição fornecida para este produto.'}
          </p>

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
