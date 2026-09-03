import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || '';

  let produtos: any[] = [];

  if (q) {
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .eq('ativo', true)
      .is('parent_id', null)
      .or(`nome.ilike.%${q}%,codigo_barras.ilike.%${q}%,descricao.ilike.%${q}%`)
      .order('criado_em', { ascending: false });

    if (data) produtos = data;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-primary transition">Home</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-text font-semibold">Busca por "{q}"</span>
      </nav>

      <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-heading font-bold text-secondary">
            {q ? `Resultados para "${q}"` : 'Busca de Produtos'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {produtos.length} {produtos.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </p>
        </div>
      </div>

      {produtos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {produtos.map((prod) => {
            const precoExibido = prod.preco_promocional && Number(prod.preco_promocional) < Number(prod.preco)
              ? Number(prod.preco_promocional)
              : Number(prod.preco);

            const temDesconto = prod.preco_promocional && Number(prod.preco_promocional) < Number(prod.preco);

            return (
              <div
                key={prod.id}
                className="flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition border border-border overflow-hidden group"
              >
                <Link href={`/produto/${prod.slug}`}>
                  <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    {prod.imagens && prod.imagens.length > 0 ? (
                      <Image
                        src={prod.imagens[0]}
                        alt={prod.nome}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm font-bold">Sem Foto</span>
                    )}
                    {temDesconto && (
                      <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                        PROMO
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-4 flex flex-col flex-grow">
                  <Link href={`/produto/${prod.slug}`}>
                    <h3 className="font-bold mb-2 text-sm line-clamp-2 hover:text-primary transition text-secondary">
                      {prod.nome}
                    </h3>
                  </Link>
                  <div className="mt-auto pt-2">
                    {temDesconto && (
                      <span className="text-xs text-gray-400 line-through block">
                        R$ {Number(prod.preco).toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    <span className="text-xl font-heading font-bold text-primary">
                      R$ {precoExibido.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <Link
                    href={`/produto/${prod.slug}`}
                    className="mt-4 w-full bg-secondary text-white py-2 rounded-lg font-bold hover:bg-blue-900 transition text-sm text-center block"
                  >
                    Ver Produto
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 p-12 text-center rounded-2xl border border-dashed border-gray-300 my-8">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-gray-700 font-bold text-lg mb-1">
            Nenhum produto encontrado para "{q}"
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Tente buscar por termos mais genéricos como "adesivo", "gravata", "laço" ou pelo código do produto.
          </p>
          <Link
            href="/categoria/todas"
            className="inline-block bg-primary text-white font-bold px-6 py-2.5 rounded-full hover:bg-orange-600 transition text-sm"
          >
            Ver Todos os Produtos
          </Link>
        </div>
      )}
    </div>
  );
}
