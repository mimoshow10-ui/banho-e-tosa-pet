'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Flame, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Maximize2, 
  Heart, 
  ExternalLink 
} from 'lucide-react';

function InstagramIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface PromoProduct {
  id: string;
  nome: string;
  slug: string;
  preco: number;
  preco_promocional?: number | null;
  imagens?: string[] | null;
}

interface DesktopSideBannersProps {
  produtosPromocao: PromoProduct[];
}

export default function DesktopSideBanners({ produtosPromocao }: DesktopSideBannersProps) {
  // Estado para os banners (aberto ou minimizado)
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // Rotação de produtos promocionais (a cada 3 segundos)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filtrar apenas produtos válidos
  const validProducts = (produtosPromocao || []).filter(p => p && p.nome && p.slug);
  const total = validProducts.length;
  const currentProduct = total > 0 ? validProducts[currentIndex % total] : null;

  // Coleção de fotos para o grid do celular (Instagram)
  const promoImages = validProducts
    .flatMap(p => p.imagens || [])
    .filter(img => img && typeof img === 'string' && img.length > 5);

  const defaultPhotos = [
    '/banner-pet.jpg',
    '/logo-luxo.png',
    '/logo-mimoshow.png',
    '/logo-luxo.jpg'
  ];

  const instaPhotos = Array.from(new Set([...promoImages, ...defaultPhotos])).slice(0, 4);

  // Timer leve para rotação de 3 segundos (sem travar CPU ou re-render constante)
  useEffect(() => {
    if (total <= 1 || isPaused || !leftOpen) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 3000);

    return () => clearInterval(interval);
  }, [total, isPaused, leftOpen]);

  const handleNext = () => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const calculateDiscount = (de: number, por?: number | null) => {
    if (!por || por >= de || de <= 0) return null;
    return Math.round(((de - por) / de) * 100);
  };

  const formatBRL = (val?: number | null) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. LATERAL ESQUERDA: OFERTAS RELÂMPAGO (ROTAÇÃO 3S)        */}
      {/* ========================================================= */}
      {total > 0 && currentProduct && (
        <aside 
          aria-label="Ofertas Relâmpago"
          className="hidden lg:block fixed left-1 xl:left-2 2xl:left-4 top-[160px] 2xl:top-[180px] z-40 select-none animate-in fade-in slide-in-from-left-4 duration-300"
        >
          {leftOpen ? (
            <div 
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="w-40 xl:w-44 2xl:w-52 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-orange-300 shadow-2xl overflow-hidden transition-all hover:border-orange-400 group"
            >
              {/* Barra de Progresso de 3 Segundos via CSS suave */}
              <div className="w-full bg-orange-100 h-1 overflow-hidden">
                <div 
                  key={currentIndex}
                  className={`bg-gradient-to-r from-orange-500 to-red-500 h-full w-full origin-left ${
                    !isPaused ? 'animate-[progress_3s_linear_infinite]' : ''
                  }`}
                  style={{
                    animationDuration: '3000ms',
                    animationTimingFunction: 'linear'
                  }}
                />
              </div>

              {/* Header com Botão de Minimizar */}
              <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <h3 className="text-[11px] 2xl:text-xs font-heading font-black text-red-600 uppercase tracking-tight flex items-center gap-1">
                    <Flame size={13} className="text-orange-500 fill-orange-500 animate-pulse" />
                    Oferta Relâmpago
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setLeftOpen(false)}
                  title="Minimizar ofertas"
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Produto em Destaque */}
              <div className="p-3 pt-1.5 space-y-2.5 2xl:space-y-3">
                {/* Foto do Produto */}
                <Link 
                  href={`/produto/${currentProduct.slug}`}
                  className="relative block w-full h-28 2xl:h-36 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 group/img"
                >
                  {currentProduct.imagens && currentProduct.imagens.length > 0 && currentProduct.imagens[0] ? (
                    <Image
                      src={currentProduct.imagens[0]}
                      alt={currentProduct.nome}
                      fill
                      className="object-contain p-2 group-hover/img:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                      Sem foto
                    </div>
                  )}

                  {/* Badge de Desconto */}
                  {calculateDiscount(currentProduct.preco, currentProduct.preco_promocional) ? (
                    <span className="absolute top-1.5 left-1.5 bg-red-600 text-white font-black text-[9px] 2xl:text-[10px] uppercase px-1.5 2xl:px-2 py-0.5 rounded-full shadow-sm">
                      -{calculateDiscount(currentProduct.preco, currentProduct.preco_promocional)}% OFF
                    </span>
                  ) : (
                    <span className="absolute top-1.5 left-1.5 bg-orange-500 text-white font-black text-[8px] 2xl:text-[9px] uppercase px-1.5 py-0.5 rounded-full shadow-sm">
                      Destaque
                    </span>
                  )}
                </Link>

                {/* Título do Produto */}
                <Link href={`/produto/${currentProduct.slug}`}>
                  <h4 
                    title={currentProduct.nome}
                    className="text-[11px] 2xl:text-xs font-bold text-gray-800 line-clamp-2 hover:text-primary transition leading-tight min-h-[1.75rem] 2xl:min-h-[2rem]"
                  >
                    {currentProduct.nome}
                  </h4>
                </Link>

                {/* Preços */}
                <div className="bg-orange-50/70 p-2 2xl:p-2.5 rounded-xl border border-orange-100">
                  {currentProduct.preco_promocional && currentProduct.preco_promocional > 0 ? (
                    <div className="space-y-0.5">
                      <span className="text-[9px] 2xl:text-[10px] text-gray-400 line-through block">
                        De: {formatBRL(currentProduct.preco)}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] 2xl:text-xs font-bold text-gray-500">Por:</span>
                        <strong className="text-sm 2xl:text-base font-black text-red-600">
                          {formatBRL(currentProduct.preco_promocional)}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[9px] 2xl:text-[10px] text-gray-500 font-bold block">Preço Promocional:</span>
                      <strong className="text-sm 2xl:text-base font-black text-primary">
                        {formatBRL(currentProduct.preco)}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Botão de Ação */}
                <Link
                  href={`/produto/${currentProduct.slug}`}
                  className="block w-full text-center text-[10px] 2xl:text-xs font-black uppercase py-2 2xl:py-2.5 px-2.5 rounded-xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:opacity-95 text-white shadow-md hover:shadow-lg transition-all"
                >
                  Aproveitar Oferta
                </Link>

                {/* Controles e Indicador de Paginação */}
                <div className="flex items-center justify-between text-[9px] 2xl:text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handlePrev}
                    title="Oferta anterior"
                    className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-secondary font-bold cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="font-bold text-gray-600 text-[9px] 2xl:text-[10px]">
                    {((currentIndex % total) + 1)} de {total} (3s)
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    title="Próxima oferta"
                    className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-secondary font-bold cursor-pointer"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Aba Minimizado na Esquerda */
            <button
              type="button"
              onClick={() => setLeftOpen(true)}
              className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md border-2 border-orange-400 text-red-600 hover:text-orange-700 font-black text-xs px-2.5 py-2.5 rounded-r-2xl shadow-xl hover:shadow-2xl transition-all hover:translate-x-1 cursor-pointer"
              title="Expandir Ofertas Relâmpago"
            >
              <Flame size={15} className="text-orange-500 fill-orange-500" />
              <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] 2xl:text-[11px] tracking-widest font-black uppercase">
                🔥 Ofertas Relâmpago
              </span>
              <Maximize2 size={11} className="text-gray-400" />
            </button>
          )}
        </aside>
      )}

      {/* ========================================================= */}
      {/* 2. LATERAL DIREITA: SMARTPHONE INSTAGRAM                   */}
      {/* ========================================================= */}
      <aside 
        aria-label="Instagram Oficial"
        className="hidden lg:block fixed right-1 xl:right-2 2xl:right-4 top-[150px] 2xl:top-[170px] z-40 select-none animate-in fade-in slide-in-from-right-4 duration-300"
      >
        {rightOpen ? (
          <div className="w-44 xl:w-48 2xl:w-56 bg-slate-950 rounded-[32px] 2xl:rounded-[38px] p-2 2xl:p-2.5 shadow-2xl border-3 2xl:border-4 border-slate-800 relative transition-all hover:scale-[1.01] group">
            
            {/* Notch / Dynamic Island do Smartphone */}
            <div className="absolute top-2.5 2xl:top-3 left-1/2 -translate-x-1/2 w-12 2xl:w-16 h-2.5 2xl:h-3 bg-black rounded-full z-20 flex items-center justify-center gap-1.5 shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
              <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700"></div>
            </div>

            {/* Botão de Minimizar */}
            <button
              type="button"
              onClick={() => setRightOpen(false)}
              title="Minimizar Instagram"
              className="absolute top-2 right-2.5 bg-black/70 hover:bg-black text-white p-1 rounded-full z-30 transition cursor-pointer"
            >
              <X size={11} />
            </button>

            {/* Tela do Celular */}
            <div className="bg-white rounded-[24px] 2xl:rounded-[28px] overflow-hidden pt-3.5 2xl:pt-4 pb-2 border border-slate-200 shadow-inner flex flex-col text-slate-800">
              
              {/* Header da Conta do Instagram */}
              <a 
                href="https://instagram.com/mimoshoweva" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between px-2.5 2xl:px-3 py-1.5 2xl:py-2 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 hover:bg-pink-100 transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 2xl:gap-2 min-w-0">
                  <div className="w-7 h-7 2xl:w-8 2xl:h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex-shrink-0 shadow-xs">
                    <div className="w-full h-full bg-white rounded-full p-0.5 flex items-center justify-center overflow-hidden">
                      <Image 
                        src="/logo-mimoshow.png" 
                        alt="Instagram Oficial" 
                        width={24} 
                        height={24} 
                        className="object-contain" 
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] 2xl:text-[10px] font-black text-slate-900 truncate leading-tight flex items-center gap-0.5">
                      mimoshoweva
                      <span className="text-blue-500 font-black text-[8px] 2xl:text-[9px]">✓</span>
                    </p>
                    <p className="text-[7.5px] 2xl:text-[8px] font-bold text-gray-500 leading-none">Instagram Oficial</p>
                  </div>
                </div>

                <span className="text-[8px] 2xl:text-[9px] font-black text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 px-2 2xl:px-2.5 py-0.5 2xl:py-1 rounded-full shadow-xs hover:brightness-110 transition">
                  Seguir
                </span>
              </a>

              {/* Título de Fotos do Feed */}
              <div className="px-2.5 2xl:px-3 pt-1.5 pb-1 flex items-center justify-between">
                <span className="text-[8px] 2xl:text-[9px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                  <InstagramIcon size={10} className="text-pink-600" /> Nossas Postagens
                </span>
                <span className="text-[7.5px] 2xl:text-[8px] font-bold text-pink-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span> Ao vivo
                </span>
              </div>

              {/* Grid 2x2 de Publicações do Instagram */}
              <div className="px-1.5 2xl:px-2 py-1">
                <a 
                  href="https://instagram.com/mimoshoweva" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="grid grid-cols-2 gap-1 2xl:gap-1.5 group/grid cursor-pointer"
                >
                  {instaPhotos.map((imgUrl, idx) => (
                    <div key={idx} className="relative h-16 2xl:h-20 bg-gray-100 rounded-lg 2xl:rounded-xl overflow-hidden border border-gray-100 group/post">
                      <Image 
                        src={imgUrl} 
                        alt={`Post Instagram ${idx + 1}`} 
                        fill 
                        className="object-cover group-hover/post:scale-110 transition duration-300" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover/post:opacity-100 transition flex items-end justify-center p-1 text-white">
                        <span className="flex items-center gap-0.5 text-[8px] 2xl:text-[9px] text-white font-black">
                          <Heart size={9} className="fill-red-500 text-red-500" /> {124 + (idx * 47)}
                        </span>
                      </div>
                    </div>
                  ))}
                </a>
              </div>

              {/* Subtítulo & Chamada de Ação */}
              <div className="px-2 2xl:px-2.5 pt-1 pb-1 text-center space-y-1">
                <p className="text-[8.5px] 2xl:text-[9.5px] font-bold text-slate-600 leading-tight">
                  Veja lançamentos & bastidores no Instagram! 📸
                </p>

                <a
                  href="https://instagram.com/mimoshoweva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center text-[9px] 2xl:text-[10px] font-black uppercase py-1.5 2xl:py-2 px-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:brightness-110 text-white shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <InstagramIcon size={12} />
                  <span>Siga @mimoshoweva</span>
                  <ExternalLink size={9} />
                </a>
              </div>

            </div>

            {/* Home Bar do Celular */}
            <div className="w-12 2xl:w-14 h-1 bg-slate-700 rounded-full mx-auto mt-2 2xl:mt-2.5"></div>
          </div>
        ) : (
          /* Aba Minimizado na Direita com Visual Instagram */
          <button
            type="button"
            onClick={() => setRightOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-b from-purple-600 via-pink-600 to-amber-500 text-white font-black text-xs px-2.5 py-3 rounded-l-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-x-1 cursor-pointer"
            title="Expandir Instagram"
          >
            <InstagramIcon size={15} className="text-white animate-pulse" />
            <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] 2xl:text-[11px] tracking-widest font-black uppercase">
              📲 Instagram
            </span>
            <Maximize2 size={11} className="text-white/80" />
          </button>
        )}
      </aside>
    </>
  );
}
