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

function InstagramIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
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
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const validProducts = (produtosPromocao || []).filter(p => p && p.nome && p.slug);
  const total = validProducts.length;
  const currentProduct = total > 0 ? validProducts[currentIndex % total] : null;

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
      {/* 1. LATERAL ESQUERDA: OFERTAS RELÂMPAGO (SLIM -30%)        */}
      {/* ========================================================= */}
      {total > 0 && currentProduct && (
        <aside 
          aria-label="Ofertas Relâmpago"
          className="hidden lg:block fixed left-1 xl:left-2 2xl:left-3 top-[480px] 2xl:top-[500px] z-40 select-none animate-in fade-in slide-in-from-left-4 duration-300"
        >
          {leftOpen ? (
            <div 
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="w-36 xl:w-40 2xl:w-44 bg-white/95 backdrop-blur-md rounded-xl border border-orange-300 shadow-xl overflow-hidden transition-all hover:border-orange-400 group"
            >
              {/* Barra de Progresso Suave */}
              <div className="w-full bg-orange-100 h-0.5 overflow-hidden">
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

              {/* Header */}
              <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5">
                <div className="flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                  <h3 className="text-[10px] font-heading font-black text-red-600 uppercase tracking-tight flex items-center gap-0.5">
                    <Flame size={11} className="text-orange-500 fill-orange-500 animate-pulse" />
                    Oferta Flash
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setLeftOpen(false)}
                  title="Minimizar"
                  className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                >
                  <X size={11} />
                </button>
              </div>

              {/* Produto */}
              <div className="p-2 pt-1 space-y-1.5">
                {/* Foto */}
                <Link 
                  href={`/produto/${currentProduct.slug}`}
                  className="relative block w-full h-20 2xl:h-24 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 group/img"
                >
                  {currentProduct.imagens && currentProduct.imagens.length > 0 && currentProduct.imagens[0] ? (
                    <Image
                      src={currentProduct.imagens[0]}
                      alt={currentProduct.nome}
                      fill
                      className="object-contain p-1 group-hover/img:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-[9px] font-bold">
                      Sem foto
                    </div>
                  )}

                  {calculateDiscount(currentProduct.preco, currentProduct.preco_promocional) ? (
                    <span className="absolute top-1 left-1 bg-red-600 text-white font-black text-[8px] uppercase px-1 py-0.5 rounded-full shadow-xs">
                      -{calculateDiscount(currentProduct.preco, currentProduct.preco_promocional)}%
                    </span>
                  ) : null}
                </Link>

                {/* Nome */}
                <Link href={`/produto/${currentProduct.slug}`}>
                  <h4 
                    title={currentProduct.nome}
                    className="text-[9.5px] font-bold text-gray-800 line-clamp-2 hover:text-primary transition leading-tight min-h-[1.4rem]"
                  >
                    {currentProduct.nome}
                  </h4>
                </Link>

                {/* Preço */}
                <div className="bg-orange-50/70 p-1.5 rounded-lg border border-orange-100">
                  {currentProduct.preco_promocional && currentProduct.preco_promocional > 0 ? (
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-gray-400 line-through block leading-none">
                        De: {formatBRL(currentProduct.preco)}
                      </span>
                      <div className="flex items-baseline gap-0.5">
                        <strong className="text-[11px] 2xl:text-xs font-black text-red-600">
                          {formatBRL(currentProduct.preco_promocional)}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <strong className="text-[11px] 2xl:text-xs font-black text-primary">
                        {formatBRL(currentProduct.preco)}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Botão */}
                <Link
                  href={`/produto/${currentProduct.slug}`}
                  className="block w-full text-center text-[9px] font-black uppercase py-1.5 px-1.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-95 text-white shadow-xs transition-all"
                >
                  Ver Oferta
                </Link>

                {/* Paginação */}
                <div className="flex items-center justify-between text-[8px] text-gray-500 pt-0.5 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-0.5 hover:bg-gray-100 rounded text-gray-600 cursor-pointer"
                  >
                    <ChevronLeft size={11} />
                  </button>
                  <span className="font-bold text-gray-500 text-[8px]">
                    {((currentIndex % total) + 1)}/{total} (3s)
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-0.5 hover:bg-gray-100 rounded text-gray-600 cursor-pointer"
                  >
                    <ChevronRight size={11} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Aba Minimizado */
            <button
              type="button"
              onClick={() => setLeftOpen(true)}
              className="flex items-center gap-1 bg-white/95 backdrop-blur-md border border-orange-400 text-red-600 font-black text-[10px] px-2 py-2 rounded-r-xl shadow-lg hover:translate-x-0.5 transition-all cursor-pointer"
              title="Expandir Ofertas"
            >
              <Flame size={13} className="text-orange-500 fill-orange-500" />
              <span className="[writing-mode:vertical-lr] rotate-180 text-[9px] tracking-wider font-black uppercase">
                🔥 Ofertas
              </span>
              <Maximize2 size={9} className="text-gray-400" />
            </button>
          )}
        </aside>
      )}

      {/* ========================================================= */}
      {/* 2. LATERAL DIREITA: SMARTPHONE INSTAGRAM (SLIM -30%)       */}
      {/* ========================================================= */}
      <aside 
        aria-label="Instagram Oficial"
        className="hidden lg:block fixed right-1 xl:right-2 2xl:right-3 top-[460px] 2xl:top-[480px] z-40 select-none animate-in fade-in slide-in-from-right-4 duration-300"
      >
        {rightOpen ? (
          <div className="w-36 xl:w-40 2xl:w-44 bg-slate-950 rounded-[24px] 2xl:rounded-[28px] p-1.5 shadow-xl border-2 border-slate-800 relative transition-all hover:scale-[1.01] group">
            
            {/* Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-black rounded-full z-20 flex items-center justify-center gap-1">
              <div className="w-1 h-1 rounded-full bg-slate-800"></div>
            </div>

            {/* Minimizar */}
            <button
              type="button"
              onClick={() => setRightOpen(false)}
              title="Minimizar"
              className="absolute top-1.5 right-2 bg-black/70 hover:bg-black text-white p-0.5 rounded-full z-30 transition cursor-pointer"
            >
              <X size={10} />
            </button>

            {/* Tela */}
            <div className="bg-white rounded-[18px] 2xl:rounded-[20px] overflow-hidden pt-2.5 pb-1 border border-slate-200 shadow-inner flex flex-col text-slate-800">
              
              {/* Header Instagram */}
              <a 
                href="https://instagram.com/mimoshoweva" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between px-1.5 py-1 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 hover:bg-pink-100 transition cursor-pointer"
              >
                <div className="flex items-center gap-1 min-w-0">
                  <div className="w-5 h-5 rounded-full p-[1px] bg-gradient-to-tr from-amber-500 to-purple-600 flex-shrink-0">
                    <div className="w-full h-full bg-white rounded-full p-0.5 flex items-center justify-center overflow-hidden">
                      <Image 
                        src="/logo-mimoshow.png" 
                        alt="Instagram" 
                        width={18} 
                        height={18} 
                        className="object-contain" 
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-black text-slate-900 truncate leading-tight">
                      mimoshoweva
                    </p>
                  </div>
                </div>

                <span className="text-[7.5px] font-black text-white bg-gradient-to-r from-purple-600 to-pink-600 px-1.5 py-0.5 rounded-full">
                  Seguir
                </span>
              </a>

              {/* Grid 2x2 */}
              <div className="px-1 py-1">
                <a 
                  href="https://instagram.com/mimoshoweva" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="grid grid-cols-2 gap-1 group/grid cursor-pointer"
                >
                  {instaPhotos.map((imgUrl, idx) => (
                    <div key={idx} className="relative h-11 2xl:h-13 bg-gray-100 rounded-md overflow-hidden border border-gray-100 group/post">
                      <Image 
                        src={imgUrl} 
                        alt={`Post ${idx + 1}`} 
                        fill 
                        className="object-cover group-hover/post:scale-110 transition duration-300" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/post:opacity-100 transition flex items-end justify-center p-0.5 text-white">
                        <span className="flex items-center gap-0.5 text-[7px] text-white font-black">
                          <Heart size={7} className="fill-red-500 text-red-500" /> {120 + (idx * 40)}
                        </span>
                      </div>
                    </div>
                  ))}
                </a>
              </div>

              {/* Ação */}
              <div className="px-1.5 pb-0.5 text-center">
                <a
                  href="https://instagram.com/mimoshoweva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center text-[8px] font-black uppercase py-1 px-1 rounded-md bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:brightness-110 text-white shadow-xs transition-all flex items-center justify-center gap-0.5 cursor-pointer"
                >
                  <InstagramIcon size={10} />
                  <span>Instagram</span>
                  <ExternalLink size={7} />
                </a>
              </div>

            </div>

            {/* Home Bar */}
            <div className="w-8 h-0.5 bg-slate-700 rounded-full mx-auto mt-1"></div>
          </div>
        ) : (
          /* Aba Minimizado */
          <button
            type="button"
            onClick={() => setRightOpen(true)}
            className="flex items-center gap-1 bg-gradient-to-b from-purple-600 via-pink-600 to-amber-500 text-white font-black text-[10px] px-2 py-2 rounded-l-xl shadow-lg hover:-translate-x-0.5 transition-all cursor-pointer"
            title="Expandir Instagram"
          >
            <InstagramIcon size={13} className="text-white animate-pulse" />
            <span className="[writing-mode:vertical-lr] rotate-180 text-[9px] tracking-wider font-black uppercase">
              📲 Insta
            </span>
            <Maximize2 size={9} className="text-white/80" />
          </button>
        )}
      </aside>
    </>
  );
}
