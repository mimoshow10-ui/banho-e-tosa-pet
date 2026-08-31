import Link from 'next/link';

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // Format the slug for display
  const categoriaNome = slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' ');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-primary transition">Home</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-text font-semibold">{categoriaNome}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar de Filtros */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
            <h2 className="font-heading font-bold text-lg mb-6 text-secondary">Filtros</h2>
            
            {/* Filtro Tamanho */}
            {/* Filtro Público / Estampa */}
            <div className="mb-6 border-b border-border pb-6">
              <h3 className="font-bold mb-3 text-secondary text-sm uppercase tracking-wide">Público / Estilo</h3>
              <div className="flex flex-col gap-2">
                {['Macho', 'Fêmea', 'Unissex / Sortido', 'Temático (Natal, etc)'].map((estilo) => (
                  <label key={estilo} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary" />
                    <span className="text-sm text-gray-600 group-hover:text-primary transition">{estilo}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro Quantidade / Pacote */}
            <div className="mb-6 border-b border-border pb-6">
              <h3 className="font-bold mb-3 text-secondary text-sm uppercase tracking-wide">Quantidade no Pacote</h3>
              <div className="flex flex-wrap gap-2">
                {['50 un', '100 un', '250 un', '500 un'].map((t) => (
                  <button key={t} className="px-3 py-2 border border-border rounded-lg flex items-center justify-center hover:border-primary hover:text-primary hover:bg-orange-50 transition text-sm text-gray-600">
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro Preço */}
            <div className="mb-6">
              <h3 className="font-bold mb-3 text-secondary text-sm uppercase tracking-wide">Faixa de Preço</h3>
              <input type="range" min="10" max="300" className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
              <div className="flex justify-between text-xs font-bold text-gray-500 mt-3">
                <span>R$ 10</span>
                <span>R$ 300+</span>
              </div>
            </div>

          </div>
        </aside>

        {/* Grid de Produtos */}
        <main className="flex-1">
          {/* Header do Grid (Ordenação e Resultados) */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-border">
            <h1 className="text-2xl font-heading font-bold text-secondary">{categoriaNome}</h1>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <span className="text-sm text-gray-500">12 produtos</span>
              <select className="border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary">
                <option>Mais Relevantes</option>
                <option>Menor Preço</option>
                <option>Maior Preço</option>
                <option>Mais Vendidos</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition border border-border overflow-hidden">
                <Link href={`/produto/coleira-premium-${item}`}>
                  <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                    <span className="text-gray-400">Foto {item}</span>
                  </div>
                </Link>
                <div className="p-4 flex flex-col flex-grow">
                  <Link href={`/produto/coleira-premium-${item}`}>
                    <h3 className="font-bold mb-1 text-sm md:text-base line-clamp-2 hover:text-primary transition">
                      Produto de Exemplo {item}
                    </h3>
                  </Link>
                  <div className="text-yellow-400 text-xs mb-2">⭐⭐⭐⭐⭐ (4.8)</div>
                  <div className="mt-auto">
                    <span className="text-xl font-heading font-bold text-primary">R$ 29,90</span>
                  </div>
                  <button className="mt-4 w-full bg-secondary text-white py-2 rounded-lg font-bold hover:bg-blue-900 transition text-sm">
                    Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}
