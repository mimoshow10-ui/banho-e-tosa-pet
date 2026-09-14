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
  const [progress, setProgress] = useState(0);

  const total = produtosPromocao?.length || 0;
  const currentProduct = total > 0 ? produtosPromocao[currentIndex] : null;

  // Coleção de fotos para o grid do celular (Instagram)
  const promoImages = (produtosPromocao || [])
    .flatMap(p => p.imagens || [])
    .filter(img => img && typeof img === 'string' && img.length > 5);

  const defaultPhotos = [
    '/logo-mimoshow.png',
    '/banner-pet.jpg',
    '/logo-luxo.jpg',
    '/logo-mimoshow.jpg'
  ];

  const instaPhotos = Array.from(new Set([...promoImages, ...defaultPhotos]));

  // Timer para rotação de 3 segundos com barra de progresso suave
  useEffect(() => {
    if (total <= 1 || isPaused || !rightOpen) return;

    const intervalTime = 3000; // 3 segundos
    const stepTime = 50; // atualiza a cada 50ms para animação suave
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += stepTime;
      setProgress(Math.min((elapsed / intervalTime) * 100, 100));

      if (elapsed >= intervalTime) {
        elapsed = 0;
        setProgress(0);
        setCurrentIndex((prev) => (prev + 1) % total);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [total, isPaused, rightOpen, currentIndex]);

  const handleNext = () => {
    setProgress(0);
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setProgress(0);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const calculateDiscount = (de: number, por?: number | null) => {
    if (!por || por >= de) return null;
    return Math.round(((de - por) / de) * 100);
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. LATERAL ESQUERDA: OFERTAS RELÂMPAGO (ROTAÇÃO 3S)        */}
      {/* ========================================================= */}
      {total > 0 && currentProduct && (
        <aside 
          aria-label="Ofertas Relâmpago"
          className="hidden xl:block fixed left-2 2xl:left-4 top-[200px] z-40 select-none animate-in fade-in slide-in-from-left-4 duration-300"
        >
          {leftOpen ? (
            <div 
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="w-48 2xl:w-52 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-orange-300 shadow-2xl overflow-hidden transition-all hover:border-orange-400 group"
            >
              {/* Barra de Progresso de 3 Segundos */}
              <div className="w-full bg-orange-100 h-1 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-full transition-all duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Header com Botão de Minimizar */}
              <div className="flex items-center justify-between px-3.5 pt-3 pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <h3 className="text-xs font-heading font-black text-red-600 uppercase tracking-tight flex items-center gap-1">
                    <Flame size={14} className="text-orange-500 fill-orange-500 animate-pulse" />
                    Oferta Relâmpago
                  </h3>
                </div>
                <button
                  onClick={() => setLeftOpen(false)}
                  title="Minimizar ofertas"
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Produto em Destaque */}
              <div className="p-3.5 pt-2 space-y-3">
                {/* Foto do Produto */}
                <Link 
                  href={`/produto/${currentProduct.slug}`}
                  className="relative block w-full h-36 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 group/img"
                >
                  {currentProduct.imagens && currentProduct.imagens.length > 0 ? (
                    <Image
                      src={currentProduct.imagens[0]}
                      alt={currentProduct.nome}
                      fill
                      className="object-contain p-2 group-hover/img:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold">
                      Sem foto
                    </div>
                  )}

                  {/* Badge de Desconto */}
                  {calculateDiscount(currentProduct.preco, currentProduct.preco_promocional) ? (
                    <span className="absolute top-2 left-2 bg-red-600 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-sm">
                      -{calculateDiscount(currentProduct.preco, currentProduct.preco_promocional)}% OFF
                    </span>
                  ) : (
                    <span className="absolute top-2 left-2 bg-orange-500 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow-sm">
                      Destaque
                    </span>
                  )}
                </Link>

                {/* Título do Produto */}
                <Link href={`/produto/${currentProduct.slug}`}>
                  <h4 
                    title={currentProduct.nome}
                    className="text-xs font-bold text-gray-800 line-clamp-2 hover:text-primary transition leading-tight min-h-[2rem]"
                  >
                    {currentProduct.nome}
                  </h4>
                </Link>

                {/* Preços */}
                <div className="bg-orange-50/70 p-2.5 rounded-xl border border-orange-100">
                  {currentProduct.preco_promocional && currentProduct.preco_promocional > 0 ? (
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-400 line-through block">
                        De: R$ {Number(currentProduct.preco).toFixed(2).replace('.', ',')}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-gray-500">Por:</span>
                        <strong className="text-base font-black text-red-600">
                          R$ {Number(currentProduct.preco_promocional).toFixed(2).replace('.', ',')}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold block">Preço Promocional:</span>
                      <strong className="text-base font-black text-primary">
                        R$ {Number(currentProduct.preco).toFixed(2).replace('.', ',')}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Botão de Ação */}
                <Link
                  href={`/produto/${currentProduct.slug}`}
                  className="block w-full text-center text-xs font-black uppercase py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:opacity-95 text-white shadow-md hover:shadow-lg transition-all"
                >
                  Aproveitar Oferta
                </Link>

                {/* Controles e Indicador de Paginação */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                  <button
                    onClick={handlePrev}
                    title="Oferta anterior"
                    className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-secondary font-bold cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="font-bold text-gray-600">
                    {currentIndex + 1} de {total} (Troca a cada 3s)
                  </span>
                  <button
                    onClick={handleNext}
                    title="Próxima oferta"
                    className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-secondary font-bold cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Aba Minimizado na Esquerda */
            <button
              onClick={() => setLeftOpen(true)}
              className="flex items-center gap-2 bg-white/95 backdrop-blur-md border-2 border-orange-400 text-red-600 hover:text-orange-700 font-black text-xs px-3 py-2.5 rounded-r-2xl shadow-xl hover:shadow-2xl transition-all hover:translate-x-1 cursor-pointer"
              title="Expandir Ofertas Relâmpago"
            >
              <Flame size={16} className="text-orange-500 fill-orange-500" />
              <span className="[writing-mode:vertical-lr] rotate-180 text-[11px] tracking-widest font-black uppercase">
                🔥 Ofertas Relâmpago
              </span>
              <Maximize2 size={12} className="text-gray-400" />
            </button>
          )}
        </aside>
      )}

      {/* ========================================================= */}
      {/* 2. LATERAL DIREITA: SMARTPHONE INSTAGRAM (@mimoshoweva)     */}
      {/* ========================================================= */}
      <aside 
        aria-label="Instagram Mimoshow Oficial"
        className="hidden xl:block fixed right-2 2xl:right-4 top-[170px] z-40 select-none animate-in fade-in slide-in-from-right-4 duration-300"
      >
        {rightOpen ? (
          <div className="w-52 2xl:w-56 bg-slate-950 rounded-[38px] p-2.5 shadow-2xl border-4 border-slate-800 relative transition-all hover:scale-[1.02] group">
            
            {/* Notch / Dynamic Island do Smartphone */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-3 bg-black rounded-full z-20 flex items-center justify-center gap-1.5 shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
              <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700"></div>
            </div>

            {/* Botão de Minimizar */}
            <button
              onClick={() => setRightOpen(false)}
              title="Minimizar Instagram"
              className="absolute top-2.5 right-3 bg-black/70 hover:bg-black text-white p-1 rounded-full z-30 transition cursor-pointer"
            >
              <X size={12} />
            </button>

            {/* Tela do Celular */}
            <div className="bg-white rounded-[28px] overflow-hidden pt-4 pb-2 border border-slate-200 shadow-inner flex flex-col text-slate-800">
              
              {/* Header da Conta do Instagram */}
              <a 
                href="https://instagram.com/mimoshoweva" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 hover:bg-pink-100 transition cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex-shrink-0 shadow-xs">
                    <div className="w-full h-full bg-white rounded-full p-0.5 flex items-center justify-center overflow-hidden">
                      <Image 
                        src="/logo-mimoshow.png" 
                        alt="MimoShow Instagram" 
                        width={24} 
                        height={24} 
                        className="object-contain" 
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-900 truncate leading-tight flex items-center gap-0.5">
                      mimoshoweva
                      <span className="text-blue-500 font-black text-[9px]">✓</span>
                    </p>
                    <p className="text-[8px] font-bold text-gray-500 leading-none">Instagram Oficial</p>
                  </div>
                </div>

                <span className="text-[9px] font-black text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 px-2.5 py-1 rounded-full shadow-xs hover:brightness-110 transition">
                  Seguir
                </span>
              </a>

              {/* Título de Fotos do Feed */}
              <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                  <InstagramIcon size={11} className="text-pink-600" /> Nossas Postagens
                </span>
                <span className="text-[8px] font-bold text-pink-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span> Ao vivo
                </span>
              </div>

              {/* Grid 2x2 de Publicações do Instagram */}
              <div className="px-2 py-1">
                <a 
                  href="https://instagram.com/mimoshoweva" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="grid grid-cols-2 gap-1.5 group/grid cursor-pointer"
                >
                  {instaPhotos.slice(0, 4).map((imgUrl, idx) => (
                    <div key={idx} className="relative h-20 bg-gray-100 rounded-xl overflow-hidden border border-gray-100 group/post">
                      <Image 
                        src={imgUrl} 
                        alt={`Post Instagram ${idx + 1}`} 
                        fill 
                        className="object-cover group-hover/post:scale-110 transition duration-300" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover/post:opacity-100 transition flex items-end justify-center p-1.5 text-white">
                        <span className="flex items-center gap-1 text-[9px] text-white font-black">
                          <Heart size={10} className="fill-red-500 text-red-500" /> {124 + (idx * 47)}
                        </span>
                      </div>
                    </div>
                  ))}
                </a>
              </div>

              {/* Subtítulo & Chamada de Ação */}
              <div className="px-2.5 pt-1.5 pb-1 text-center space-y-1.5">
                <p className="text-[9.5px] font-bold text-slate-600 leading-tight">
                  Veja os novos lançamentos & bastidores no Instagram! 📸✨
                </p>

                <a
                  href="https://instagram.com/mimoshoweva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center text-[10px] font-black uppercase py-2 px-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:brightness-110 text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <InstagramIcon size={13} />
                  <span>Siga @mimoshoweva</span>
                  <ExternalLink size={10} />
                </a>
              </div>

            </div>

            {/* Home Bar do Celular */}
            <div className="w-14 h-1 bg-slate-700 rounded-full mx-auto mt-2.5"></div>
          </div>
        ) : (
          /* Aba Minimizado na Direita com Visual Instagram */
          <button
            onClick={() => setRightOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-b from-purple-600 via-pink-600 to-amber-500 text-white font-black text-xs px-2.5 py-3 rounded-l-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-x-1 cursor-pointer"
            title="Expandir Instagram @mimoshoweva"
          >
            <InstagramIcon size={16} className="text-white animate-pulse" />
            <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] 2xl:text-[11px] tracking-widest font-black uppercase">
              📲 Instagram @mimoshoweva
            </span>
            <Maximize2 size={11} className="text-white/80" />
          </button>
        )}
      </aside>
    </>
  );
}
