'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Flame, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Maximize2, 
  Award, 
  Sparkles,
  Truck,
  PackageCheck
} from 'lucide-react';

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
      {/* 1. LATERAL ESQUERDA: DISTRIBUIDOR OFICIAL MIMOSHOW        */}
      {/* ========================================================= */}
      <aside 
        aria-label="Distribuidor Oficial Mimoshow"
        className="hidden xl:block fixed left-2 2xl:left-4 top-[215px] z-40 select-none animate-in fade-in slide-in-from-left-4 duration-300"
      >
        {leftOpen ? (
          <div className="w-44 2xl:w-48 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-amber-200 shadow-2xl p-3 space-y-2.5 transition-all hover:border-amber-300">
            {/* Header do Card com Botão de Minimizar */}
            <div className="flex items-center justify-between pb-1.5 border-b border-amber-100">
              <span className="flex items-center gap-1 text-[10px] font-black tracking-wider uppercase bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                <Award size={12} className="text-amber-600" />
                Oficial
              </span>
              <button
                onClick={() => setLeftOpen(false)}
                title="Minimizar banner"
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition"
              >
                <X size={14} />
              </button>
            </div>

            {/* Logo e Selo Oficial */}
            <div className="text-center space-y-1.5">
              <div className="relative w-full h-14 2xl:h-16 flex items-center justify-center bg-gray-50/80 rounded-xl p-2 border border-gray-100">
                <Image
                  src="/logo-mimoshow.png"
                  alt="Mimoshow Distribuidor Oficial"
                  width={130}
                  height={45}
                  className="object-contain max-h-11 2xl:max-h-12 w-auto"
                  priority
                />
              </div>
              <div>
                <h3 className="text-[11px] 2xl:text-xs font-heading font-black text-secondary uppercase tracking-tight flex items-center justify-center gap-1">
                  Distribuidor Oficial
                  <ShieldCheck size={13} className="text-green-600" />
                </h3>
                <p className="text-[9px] 2xl:text-[10px] font-bold text-amber-700">MIMOSHOW Indústria & Pet</p>
              </div>
            </div>

            {/* Diferenciais e Garantias */}
            <div className="space-y-1 pt-1 text-[10px] 2xl:text-[11px] font-medium text-gray-700">
              <div className="flex items-center gap-1.5 bg-amber-50/60 p-1.5 rounded-lg border border-amber-100/80">
                <PackageCheck size={13} className="text-amber-700 flex-shrink-0" />
                <span>100% Direto da Fábrica</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-50/60 p-1.5 rounded-lg border border-blue-100/80">
                <Sparkles size={13} className="text-blue-700 flex-shrink-0" />
                <span>Preço Especial Pet Shop</span>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50/60 p-1.5 rounded-lg border border-green-100/80">
                <Truck size={13} className="text-green-700 flex-shrink-0" />
                <span>Pronta Entrega</span>
              </div>
            </div>

            {/* Botão de Ação */}
            <Link
              href="/categoria/todas"
              className="block w-full text-center text-[10px] 2xl:text-xs font-black uppercase py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg transition-all"
            >
              Ver Catálogo Oficial
            </Link>
          </div>
        ) : (
          /* Aba Minimizado */
          <button
            onClick={() => setLeftOpen(true)}
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md border-2 border-amber-300 text-secondary hover:text-amber-700 font-black text-xs px-2.5 py-2 rounded-r-2xl shadow-xl hover:shadow-2xl transition-all hover:translate-x-1"
            title="Expandir Distribuidor Oficial"
          >
            <Award size={15} className="text-amber-600" />
            <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] 2xl:text-[11px] tracking-widest font-black uppercase">
              Distribuidor Mimoshow
            </span>
            <Maximize2 size={11} className="text-gray-400" />
          </button>
        )}
      </aside>

      {/* ========================================================= */}
      {/* 2. LATERAL DIREITA: OFERTAS RELÂMPAGO (ROTAÇÃO 3S)        */}
      {/* ========================================================= */}
      {total > 0 && currentProduct && (
        <aside 
          aria-label="Ofertas Relâmpago"
          className="hidden xl:block fixed right-2 2xl:right-4 top-[215px] z-40 select-none animate-in fade-in slide-in-from-right-4 duration-300"
        >
          {rightOpen ? (
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
                  onClick={() => setRightOpen(false)}
                  title="Minimizar ofertas"
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition"
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
                    className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-secondary font-bold"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="font-bold text-gray-600">
                    {currentIndex + 1} de {total} (Troca a cada 3s)
                  </span>
                  <button
                    onClick={handleNext}
                    title="Próxima oferta"
                    className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-secondary font-bold"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Aba Minimizado */
            <button
              onClick={() => setRightOpen(true)}
              className="flex items-center gap-2 bg-white/95 backdrop-blur-md border-2 border-orange-400 text-red-600 hover:text-orange-700 font-black text-xs px-3 py-2 rounded-l-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-x-1"
              title="Expandir Ofertas Relâmpago"
            >
              <Maximize2 size={12} className="text-gray-400" />
              <span className="[writing-mode:vertical-lr] rotate-180 text-[11px] tracking-widest font-black uppercase">
                🔥 Ofertas Relâmpago
              </span>
              <Flame size={16} className="text-orange-500 fill-orange-500" />
            </button>
          )}
        </aside>
      )}
    </>
  );
}
