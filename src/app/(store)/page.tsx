import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Puxar todos os produtos ativos ordenados por novidade
  const { data: todosProdutos } = await supabase
    .from('produtos')
    .select('*')
    .eq('ativo', true)
    .order('criado_em', { ascending: false });

  // Buscar destaques da super promoção
  const { data: superPromocoes } = await supabase
    .from('produtos')
    .select('*')
    .eq('destaque_super_promocao', true)
    .order('criado_em', { ascending: false })
    .limit(4);

  const produtos = todosProdutos || [];
  const produtosPromocao = superPromocoes || [];
  
  // Os demais (ou até os mesmos) vão para a vitrine principal
  const produtosNovidades = produtos.slice(0, 8);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section com Banner Dinâmico */}
      <section className="w-full relative bg-gray-100">
        <div className="w-full h-[300px] md:h-[500px] relative">
          <Image 
            src="/banner-pet.jpg" 
            alt="Mimo Show Pet - Acessórios" 
            fill 
            className="object-cover object-center"
            priority
          />
          {/* Overlay Escuro com Texto */}
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-white drop-shadow-lg">
              Estilo e Conforto para o seu Melhor Amigo!
            </h1>
            <Link href="/categoria/todas" className="bg-primary text-text font-bold py-3 px-8 rounded-full hover:bg-orange-600 transition text-lg shadow-lg">
              Ver Coleção Completa
            </Link>
          </div>
        </div>
      </section>

      {/* Super Promoção */}
      {produtosPromocao.length > 0 && (
        <section className="py-12 px-4 max-w-7xl mx-auto w-full bg-red-50 mt-8 rounded-2xl border border-red-100">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-heading font-black text-red-600 uppercase tracking-tight flex items-center gap-2">
                🔥 Super Promoção
              </h2>
              <p className="text-red-500 font-bold text-sm mt-1">Ofertas por tempo limitado!</p>
            </div>
            <Link href="/promocoes" className="text-red-600 font-bold hover:underline text-sm hidden md:block">
              Ver todas as ofertas
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {produtosPromocao.map((prod) => {
              const desconto = Math.round(((prod.preco - prod.preco_promocional) / prod.preco) * 100);
              return (
                <Link href={`/produto/${prod.slug}`} key={`promo-${prod.id}`} className="group bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden hover:shadow-md transition relative">
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10 shadow">
                    -{desconto}% OFF
                  </div>
                  <div className="w-full h-40 bg-gray-100 relative">
                    {prod.imagens && prod.imagens.length > 0 ? (
                      <Image src={prod.imagens[0]} alt={prod.nome} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm bg-gray-200">Sem Foto</div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col h-auto">
                    <h3 className="font-bold text-secondary text-sm mb-2 group-hover:text-red-600 transition line-clamp-2">{prod.nome}</h3>
                    <div className="mt-auto flex flex-col">
                      <span className="text-xs text-gray-400 line-through">R$ {Number(prod.preco).toFixed(2).replace('.', ',')}</span>
                      <span className="font-black text-lg text-red-600">R$ {Number(prod.preco_promocional).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Destaques puxando do Supabase */}
      <section className="py-16 px-4 max-w-7xl mx-auto w-full">
        <h2 className="text-3xl font-heading font-bold text-secondary text-center mb-12">Nossas Novidades</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {produtosNovidades && produtosNovidades.length > 0 ? (
            produtosNovidades.map((prod) => (
              <Link href={`/produto/${prod.slug}`} key={prod.id} className="group bg-white rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition">
                <div className="w-full h-48 bg-gray-100 relative">
                  {prod.imagens && prod.imagens.length > 0 ? (
                    <Image src={prod.imagens[0]} alt={prod.nome} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm bg-gray-200">Sem Foto</div>
                  )}
                </div>
                <div className="p-4 flex flex-col h-32">
                  <h3 className="font-bold text-secondary mb-2 group-hover:text-primary transition line-clamp-2">{prod.nome}</h3>
                  <div className="mt-auto">
                    <span className="font-bold text-xl text-primary">R$ {Number(prod.preco).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-lg font-bold mb-2">A vitrine está vazia!</p>
              <p>Os produtos que você cadastrar no Painel Admin ou exportar do Bling aparecerão automaticamente aqui.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
