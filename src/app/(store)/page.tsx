import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CountdownTimer from "@/components/CountdownTimer";
import BannerCarousel from "@/components/BannerCarousel";
import HomeCouponsBanner from "@/components/HomeCouponsBanner";

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
  
  // Filtrar promoções ativas com estoque
  const agora = Date.now();
  const produtosPromocao = (superPromocoes || []).filter((prod) => {
    if (prod.estoque !== null && prod.estoque !== undefined && Number(prod.estoque) <= 0) return false;
    if (prod.promocao_expira_em) {
      const expira = new Date(prod.promocao_expira_em).getTime();
      if (isNaN(expira) || expira <= agora) return false;
    }
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
      {/* Cupons de Desconto Disponíveis da Loja (Ao Topo do Banner Principal) */}
      <HomeCouponsBanner />

      {/* Hero Section com Banner Dinâmico */}
      <section className="w-full relative bg-gray-100">
        <BannerCarousel banners={banners} />
      </section>

      {/* Conteúdo Principal — Usando área lateral (max-w-[1500px]) */}
      <div className="max-w-[1500px] w-full mx-auto px-4 md:px-8 space-y-12 py-8">

        {/* 1. Super Promoção */}
        {produtosPromocao.length > 0 && (
          <section className="py-8 px-6 bg-red-50/80 rounded-3xl border border-red-100 shadow-xs">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-heading font-black text-red-600 uppercase tracking-tight flex items-center gap-2">
                  🔥 Super Promoção
                </h2>
                <p className="text-red-500 font-bold text-xs md:text-sm mt-0.5">Ofertas exclusivas por tempo limitado!</p>
              </div>
              <Link href="/categoria/todas" className="text-red-600 font-bold hover:underline text-xs md:text-sm hidden md:block">
                Ver todas as ofertas &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {produtosPromocao.map((prod) => {
                const desconto = Math.round(((prod.preco - prod.preco_promocional) / prod.preco) * 100);
                const foto = prod.imagens?.[0] ? (typeof prod.imagens[0] === 'string' ? prod.imagens[0].split(/[\r\n,]+/)[0] : prod.imagens[0]) : null;

                return (
                  <Link href={`/produto/${prod.slug}`} key={`promo-${prod.id}`} className="group bg-white rounded-2xl shadow-xs border border-red-200 overflow-hidden hover:shadow-md transition relative flex flex-col h-[290px]">
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs z-10">
                      -{desconto}% OFF
                    </div>
                    <div className="w-full aspect-square bg-gray-100 relative">
                      {foto ? (
                        <Image src={foto} alt={prod.nome} fill className="object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs bg-gray-200">Sem Foto</div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1 justify-between">
                      <h3 className="font-bold text-secondary text-xs group-hover:text-red-600 transition line-clamp-2">{prod.nome}</h3>
                      <div className="mt-auto">
                        <div className="flex items-baseline gap-1">
                          <span className="font-black text-sm md:text-base text-red-600">R$ {Number(prod.preco_promocional).toFixed(2).replace('.', ',')}</span>
                          <span className="text-[10px] text-gray-400 line-through">R$ {Number(prod.preco).toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 2. Mais Vendidos (Antes de Novidades) */}
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
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {produtosMaisVendidos.map((prod) => {
                const foto = prod.imagens?.[0] ? (typeof prod.imagens[0] === 'string' ? prod.imagens[0].split(/[\r\n,]+/)[0] : prod.imagens[0]) : null;
                const precoExibido = prod.preco_promocional && Number(prod.preco_promocional) < Number(prod.preco) ? prod.preco_promocional : prod.preco;

                return (
                  <Link href={`/produto/${prod.slug}`} key={`best-${prod.id}`} className="group bg-white rounded-2xl shadow-xs border border-amber-200 overflow-hidden hover:shadow-md transition flex flex-col h-[290px]">
                    <div className="w-full aspect-square bg-gray-100 relative">
                      {foto ? (
                        <Image src={foto} alt={prod.nome} fill className="object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs bg-gray-200">Sem Foto</div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1 justify-between">
                      <h3 className="font-bold text-secondary text-xs group-hover:text-amber-600 transition line-clamp-2">{prod.nome}</h3>
                      <div className="mt-auto">
                        <span className="font-black text-sm md:text-base text-primary">R$ {Number(precoExibido).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {produtosNovidades && produtosNovidades.length > 0 ? (
              produtosNovidades.map((prod) => {
                const foto = prod.imagens?.[0] ? (typeof prod.imagens[0] === 'string' ? prod.imagens[0].split(/[\r\n,]+/)[0] : prod.imagens[0]) : null;

                return (
                  <Link href={`/produto/${prod.slug}`} key={prod.id} className="group bg-white rounded-2xl shadow-xs border border-border overflow-hidden hover:shadow-md transition flex flex-col">
                    <div className="w-full aspect-square bg-gray-100 relative">
                      {foto ? (
                        <Image src={foto} alt={prod.nome} fill className="object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs bg-gray-200">Sem Foto</div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1 justify-between">
                      <h3 className="font-bold text-secondary text-xs mb-2 group-hover:text-primary transition line-clamp-2">{prod.nome}</h3>
                      <div className="mt-auto">
                        <span className="font-bold text-base text-primary">R$ {Number(prod.preco).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  </Link>
                );
              })
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
