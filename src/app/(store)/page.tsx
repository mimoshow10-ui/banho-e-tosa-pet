import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CountdownTimer from "@/components/CountdownTimer";
import BannerCarousel from "@/components/BannerCarousel";
import HomeCouponsBanner from "@/components/HomeCouponsBanner";
import ProductCard from "@/components/ProductCard";
import BenefitsBar from "@/components/BenefitsBar";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: configs } = await supabase.from('configuracoes').select('*');
  const banners = configs?.find(c => c.chave === 'marketing_banners')?.valor?.urls || ['/banner-pet.jpg'];

  const cuponsConfig = configs?.find(c => c.chave === 'cupons_config')?.valor || { posicao_home: 'topo' };
  const posicaoCupons = cuponsConfig.posicao_home || 'topo';

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
  const produtosComFoto = produtos.filter(p => Array.isArray(p.imagens) && p.imagens.length > 0 && typeof p.imagens[0] === 'string' && p.imagens[0].startsWith('http'));
  
  // Apenas produtos com PROMOÇÃO ATIVA DENTRO DO PERÍODO
  const agora = Date.now();
  const produtosPromocao = (superPromocoes || []).filter((prod) => {
    if (!Array.isArray(prod.imagens) || prod.imagens.length === 0) return false;
    if (prod.estoque !== null && prod.estoque !== undefined && Number(prod.estoque) <= 0) return false;
    
    // Checagem do Início da Promoção (se cadastrado)
    if (prod.promocao_inicio_em) {
      const inicio = new Date(prod.promocao_inicio_em).getTime();
      if (!isNaN(inicio) && inicio > agora) return false;
    }

    // Checagem de Validade / Fim da Promoção
    if (prod.promocao_expira_em) {
      const expira = new Date(prod.promocao_expira_em).getTime();
      if (isNaN(expira) || expira <= agora) return false;
    } else {
      return false;
    }

    return true;
  }).slice(0, 8);

  // Mais Vendidos: busca selecionados ou preenche com os mais recentes com foto
  const idsMaisVendidos = destaquesConfig.mais_vendidos || [];
  let produtosMaisVendidos = (idsMaisVendidos.length > 0
    ? produtosComFoto.filter(p => idsMaisVendidos.includes(p.id))
    : []);
  
  if (produtosMaisVendidos.length < 8) {
    const existing = new Set(produtosMaisVendidos.map(p => p.id));
    for (const p of produtosComFoto) {
      if (!existing.has(p.id)) {
        produtosMaisVendidos.push(p);
        if (produtosMaisVendidos.length >= 8) break;
      }
    }
  }

  // Novidades: busca selecionados ou preenche com os mais recentes com foto
  const idsNovidades = destaquesConfig.novidades || [];
  let produtosNovidades = (idsNovidades.length > 0
    ? produtosComFoto.filter(p => idsNovidades.includes(p.id))
    : []);

  if (produtosNovidades.length < 8) {
    const existing = new Set(produtosNovidades.map(p => p.id));
    for (const p of produtosComFoto) {
      if (!existing.has(p.id)) {
        produtosNovidades.push(p);
        if (produtosNovidades.length >= 8) break;
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. FAIXA DE CUPONS NO TOPO */}
      {posicaoCupons === 'topo' && <HomeCouponsBanner />}

      {/* BANNER PRINCIPAL COM CARROSEL */}
      <section className="w-full">
        <BannerCarousel banners={banners} />
      </section>

      {/* 2. FAIXA DE CUPONS LOGO ABAIXO DO BANNER */}
      {posicaoCupons === 'abaixo_banner' && <HomeCouponsBanner />}

      {/* BARRA DE BENEFÍCIOS E DIFERENCIAIS */}
      <BenefitsBar />

      {/* 3. FAIXA DE CUPONS ABAIXO DOS BENEFÍCIOS */}
      {posicaoCupons === 'abaixo_beneficios' && <HomeCouponsBanner />}

      {/* SEÇÃO PRINCIPAL DE VITRINE DA LOJA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 w-full">
        
        {/* 4. FAIXA DE CUPONS ACIMA DAS OFERTAS */}
        {posicaoCupons === 'acima_ofertas' && <HomeCouponsBanner />}

        {/* 1. Super Promoção do Dia (APENAS DENTRO DO PERÍODO) */}
        {produtosPromocao.length > 0 && (
          <section className="py-8 px-6 bg-red-50/60 rounded-3xl border border-red-100 shadow-xs">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-heading font-black text-red-600 uppercase tracking-tight flex items-center gap-2">
                  🔥 Super Ofertas por Tempo Limitado
                </h2>
                <p className="text-red-500 font-bold text-xs md:text-sm mt-0.5">Ofertas exclusivas no período promocional!</p>
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
