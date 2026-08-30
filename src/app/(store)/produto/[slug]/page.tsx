import Link from 'next/link';
import { Heart, Truck, Star } from 'lucide-react';

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // Format slug for title
  const nomeProduto = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-primary transition">Home</Link>
        <span className="mx-2">&gt;</span>
        <Link href="/categoria/coleiras" className="hover:text-primary transition">Coleiras</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-text font-semibold">{nomeProduto}</span>
      </nav>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Galeria de Imagens (Esquerda) */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          {/* Imagem Principal */}
          <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center border border-border">
            <span className="text-gray-400">Imagem Principal (600x600)</span>
          </div>
          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((thumb) => (
              <div key={thumb} className="aspect-square bg-gray-100 rounded-xl border border-border flex items-center justify-center cursor-pointer hover:border-primary transition">
                <span className="text-gray-400 text-xs">Thumb {thumb}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detalhes do Produto (Direita) */}
        <div className="w-full md:w-1/2 flex flex-col">
          <h1 className="text-3xl font-heading font-bold text-secondary mb-2">
            {nomeProduto}
          </h1>
          
          <div className="flex items-center gap-2 mb-6 text-yellow-400">
            <div className="flex"><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /></div>
            <span className="text-sm text-gray-500 underline cursor-pointer">(127 avaliações)</span>
          </div>

          <div className="mb-6">
            <span className="text-4xl font-heading font-bold text-primary">R$ 29,90</span>
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed">
            Acessório perfeito para deixar o seu pet estiloso. Feito com material premium, confortável e resistente.
          </p>

          {/* Seletores */}
          <div className="mb-8 flex flex-col gap-6">
            {/* Tamanho */}
            <div>
              <h3 className="font-semibold mb-3">Tamanho</h3>
              <div className="flex gap-3">
                {['P', 'M', 'G', 'GG'].map((t) => (
                  <button key={t} className="w-12 h-12 border-2 border-border rounded-lg flex items-center justify-center font-bold hover:border-primary hover:text-primary transition">
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantidade */}
            <div>
              <h3 className="font-semibold mb-3">Quantidade</h3>
              <div className="flex items-center border-2 border-border rounded-lg w-fit overflow-hidden">
                <button className="px-4 py-2 hover:bg-gray-100 transition">-</button>
                <input type="number" defaultValue={1} min={1} className="w-12 text-center focus:outline-none bg-transparent font-bold" />
                <button className="px-4 py-2 hover:bg-gray-100 transition">+</button>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col gap-4 mb-8">
            <button className="w-full bg-accent text-text font-bold py-4 rounded-xl hover:bg-yellow-400 transition text-lg">
              Adicionar ao Carrinho
            </button>
            <div className="flex gap-4">
              <button className="flex-1 bg-secondary text-white font-bold py-4 rounded-xl hover:bg-blue-900 transition">
                Comprar Agora
              </button>
              <button className="w-14 h-14 border-2 border-border rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary transition">
                <Heart size={24} />
              </button>
            </div>
          </div>

          {/* Frete */}
          <div className="bg-gray-50 p-6 rounded-xl border border-border">
            <div className="flex items-center gap-3 mb-4 text-secondary">
              <Truck size={24} />
              <h3 className="font-bold">Calcular Frete e Prazo</h3>
            </div>
            <div className="flex gap-4">
              <input type="text" placeholder="Digite seu CEP" className="flex-1 border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary" />
              <button className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition">
                Calcular
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Abas de Informação e Produtos Relacionados ficariam aqui */}
      <div className="mt-16 pt-16 border-t border-border">
        <h2 className="text-2xl font-heading font-bold text-center mb-8 text-secondary">Quem comprou isso também comprou</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
             <div key={item} className="flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition border border-border overflow-hidden">
                <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                  <span className="text-gray-400">Foto {item}</span>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold mb-1 text-sm md:text-base line-clamp-2">Produto Relacionado {item}</h3>
                  <div className="mt-auto pt-2">
                    <span className="text-lg font-heading font-bold text-primary">R$ 29,90</span>
                  </div>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
