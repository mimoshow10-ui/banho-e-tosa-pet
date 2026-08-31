import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // Buscar a categoria no banco de dados pelo slug
  const { data: categoria } = await supabase.from('categorias').select('*').eq('slug', slug).single();
  
  let produtos = [];
  let categoriaNome = slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' ');

  if (categoria) {
    categoriaNome = categoria.nome;
    const { data } = await supabase.from('produtos').select('*').eq('categoria_id', categoria.id).eq('ativo', true);
    if (data) produtos = data;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-primary transition">Home</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-text font-semibold">{categoriaNome}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar de Filtros (Mantida visualmente por enquanto) */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
            <h2 className="font-heading font-bold text-lg mb-6 text-secondary">Filtros</h2>
            <p className="text-sm text-gray-500 italic">Filtros em construção</p>
          </div>
        </aside>

        {/* Grid de Produtos */}
        <main className="flex-1">
          {/* Header do Grid (Ordenação e Resultados) */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-border">
            <h1 className="text-2xl font-heading font-bold text-secondary">{categoriaNome}</h1>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <span className="text-sm text-gray-500">{produtos.length} produtos</span>
              <select className="border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary">
                <option>Mais Relevantes</option>
                <option>Menor Preço</option>
                <option>Maior Preço</option>
              </select>
            </div>
          </div>

          {/* Grid Real */}
          {produtos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {produtos.map((prod: any) => (
                <div key={prod.id} className="flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition border border-border overflow-hidden">
                  <Link href={`/produto/${prod.slug}`}>
                    <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden">
                      {prod.imagens && prod.imagens.length > 0 ? (
                        <Image src={prod.imagens[0]} alt={prod.nome} fill className="object-cover" />
                      ) : (
                        <span className="text-gray-400 text-sm font-bold">Sem Foto</span>
                      )}
                    </div>
                  </Link>
                  <div className="p-4 flex flex-col flex-grow">
                    <Link href={`/produto/${prod.slug}`}>
                      <h3 className="font-bold mb-1 text-sm md:text-base line-clamp-2 hover:text-primary transition text-secondary">
                        {prod.nome}
                      </h3>
                    </Link>
                    <div className="mt-auto pt-2">
                      <span className="text-xl font-heading font-bold text-primary">
                        R$ {Number(prod.preco).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <button className="mt-4 w-full bg-secondary text-white py-2 rounded-lg font-bold hover:bg-blue-900 transition text-sm">
                      Comprar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-12 text-center rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 font-bold text-lg mb-2">Nenhum produto encontrado nesta categoria.</p>
              <p className="text-gray-400 text-sm">Vá no Painel Admin e adicione produtos a esta categoria.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
