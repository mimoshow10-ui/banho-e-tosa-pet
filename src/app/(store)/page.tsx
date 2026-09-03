import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CountdownTimer from "@/components/CountdownTimer";
import BannerCarousel from "@/components/BannerCarousel";
import HomeCouponsBanner from "@/components/HomeCouponsBanner";
import ProductCard from "@/components/ProductCard";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: configs } = await supabase.from('configuracoes').select('*');
  const banners = configs?.find(c => c.chave === 'marketing_banners')?.valor?.urls || ['/banner-pet.jpg'];

  // Destaques da vitrine
  const destaquesConfig = configs?.find(c => c.chave === 'vitrine_destaques')?.valor || { mais_vendidos: [], novidades: [] };

  // Puxar apenas produtos PAI (parent_id IS NULL) na vitrine
  const { data: todosProdutos } = await supabase
    .from('produtos')
    .select('*')
    .eq('ativo', true)
    .is('parent_id', null)
    .order('criado_em', { ascending: false });

  // Buscar destaques da super promoção (apenas produtos PAI)
  const { data: superPromocoes } = await supabase
    .from('produtos')
    .select('*')
    .or('destaque_super_promocao.eq.true,preco_promocional.not.is.null')
    .eq('ativo', true)
    .is('parent_id', null)
    .order('criado_em', { ascending: false });

  const produtos = todosProdutos || [];
  
  // Apenas produtos com RELÓGIO ATIVADO (promocao_expira_em válido no futuro)
  const agora = Date.now();
  const produtosPromocao = (superPromocoes || []).filter((prod) => {
    if (prod.estoque !== null && prod.estoque !== undefined && Number(prod.estoque) <= 0) return false;
    if (!prod.promocao_expira_em) return false; // Exige relógio ativado
    const expira = new Date(prod.promocao_expira_em).getTime();
    if (isNaN(expira) || expira <= agora) return false; // Exige validade ativa no futuro
    return true;
  }).slice(0, 8);

  // Mais Vendidos
  const idsMaisVendidos = destaquesConfig.mais_vendidos || [];
  const produtosMaisVendidos = idsMaisVendidos.length > 0
    ? produtos.filter(p => idsMaisVendidos.includes(p.id))
    : produtos.slice(0, 6);

  // Novidades
  const idsNovidades = destaquesConfig.novidades || [];
  const produtosNovidades = idsNovidades.length > 0
    ? produtos.filter(p => idsNovidades.includes(p.id))
    : produtos.slice(0, 8);

  return (
    <div className="flex flex-col min-h-screen">
      {/* BANNER PRINCIPAL COM CARROSEL */}
      <section className="w-full relative">
        <BannerCarousel banners={banners} />

        {/* FAIXA FLUTUANTE DE CUPONS NO TOPO DO BANNER */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-6xl px-4 pointer-events-auto">
          <HomeCouponsBanner />
        </div>
      </section>

      {/* SEÇÃO PRINCIPAL DE VITRINE DA LOJA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 w-full">
        
        {/* 1. Super Promoção do Dia (APENAS COM RELÓGIO ATIVADO) */}
        {produtosPromocao.length > 0 && (
          <section className="py-8 px-6 bg-red-50/60 rounded-3xl border border-red-100 shadow-xs">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-heading font-black text-red-600 uppercase tracking-tight flex items-center gap-2">
                  🔥 Super Ofertas por Tempo Limitado
                </h2>
                <p className="text-red-500 font-bold text-xs md:text-sm mt-0.5">Ofertas exclusivas com cronômetro ativado!</p>
              </div>
              <Link href="/categoria/todas" className="text-red-600 font-bold hover:underline text-xs md:text-sm hidden md:block">
                Ver todas as ofertas &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {produtosPromocao.map((prod) => (
                <ProductCard key={`promo-${prod.id}`} produto={prod} />
              ))}
            </div>
          </section>
        )}

        {/* 2. Mais Vendidos */}
        {produtosMaisVendidos.length > 0 && (
          <section className="py-8 px-6 bg-amber-50/60 rounded-3xl border border-amber-100 shadow-xs">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-heading font-black text-amber-900 uppercase tracking-tight flex items-center gap-2">
                  ⭐ Os Mais Vendidos
                </h2>
                <p className="text-amber-700 font-bold text-xs md:text-sm mt-0.5">Os queridinhos dos nossos clientes pet shop!</p>
              </div>
              <Link href="/categoria/todas" className="text-amber-800 font-bold hover:underline text-xs md:text-sm hidden md:block">
                Ver todos os mais vendidos &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {produtosMaisVendidos.map((prod) => (
                <ProductCard key={`best-${prod.id}`} produto={prod} />
              ))}
            </div>
          </section>
        )}

        {/* 3. Nossas Novidades */}
        <section className="py-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-secondary flex items-center gap-2">
                🆕 Nossas Novidades
              </h2>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5">Últimos lançamentos adicionados ao catálogo</p>
            </div>
            <Link href="/categoria/todas" className="text-primary font-bold hover:underline text-xs md:text-sm hidden md:block">
              Ver todos os lançamentos &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {produtosNovidades && produtosNovidades.length > 0 ? (
              produtosNovidades.map((prod) => (
                <ProductCard key={prod.id} produto={prod} />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <p className="text-base font-bold mb-1">A vitrine está vazia!</p>
                <p className="text-xs text-gray-400">Os produtos cadastrados no Painel Admin aparecerão aqui.</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
