'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ArrowRight, Heart, Star, Palette } from 'lucide-react';

export default function MimoCategoriesShowcase() {
  const cards = [
    {
      title: 'MIMOSHOW PET',
      subtitle: 'Laços, Gravatas & Acessórios Pet',
      description: 'Estilo, charme e conforto para seu pet brilhar em qualquer ocasião!',
      badge: '🐾 LINHA PET',
      image: '/banner-mimoshow-pet.jpg',
      link: '/categoria/pet',
      gradient: 'from-amber-500 via-orange-500 to-rose-500',
      borderHover: 'hover:border-orange-400',
      shadowColor: 'hover:shadow-orange-200/80',
      tagColor: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: '🐶',
    },
    {
      title: 'MIMOSHOW KIDS',
      subtitle: 'Laços, Tiaras & Acessórios Infantis',
      description: 'Cores, magia e delicadeza para alegrar e encantar os pequenos!',
      badge: '🎈 LINHA INFANTIL',
      image: '/banner-mimoshow-kids.jpg',
      link: '/categoria/criancas',
      gradient: 'from-pink-500 via-purple-500 to-indigo-500',
      borderHover: 'hover:border-pink-400',
      shadowColor: 'hover:shadow-pink-200/80',
      tagColor: 'bg-pink-100 text-pink-800 border-pink-200',
      icon: '🎀',
    },
    {
      title: 'MIMOSHOW DECOR',
      subtitle: 'Adesivos & Decoração Criativa',
      description: 'Mimos artesanais e detalhes alegres para transformar seu espaço!',
      badge: '✨ LINHA DECOR & CASA',
      image: '/banner-mimoshow-decor.jpg',
      link: '/categoria/decoracao',
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      borderHover: 'hover:border-teal-400',
      shadowColor: 'hover:shadow-teal-200/80',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: '🏡',
    },
  ];

  return (
    <section className="w-full py-6">
      <div className="text-center max-w-2xl mx-auto mb-6 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-100 via-pink-100 to-purple-100 border border-orange-200 text-orange-700 font-extrabold text-xs mb-2 shadow-2xs">
          <Sparkles size={14} className="text-pink-500 animate-pulse" />
          <span>UNIVERSO MIMOSHOW</span>
          <Palette size={14} className="text-purple-500" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-heading font-black text-secondary tracking-tight">
          Descubra Nossas 3 Linhas Especiais
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm mt-1 font-medium">
          Tudo feito com carinho, cores vibrantes e qualidade incomparável!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`group relative bg-white rounded-3xl overflow-hidden border-2 border-gray-100 ${card.borderHover} shadow-md transition-all duration-300 hover:-translate-y-1.5 ${card.shadowColor} flex flex-col`}
          >
            {/* Imagem do Card com Proporção Ampla */}
            <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-gray-100">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              
              {/* Badge de Categoria */}
              <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs font-black text-[11px] px-3 py-1 rounded-full shadow-md text-gray-800 flex items-center gap-1.5 border border-white/40">
                <span>{card.icon}</span>
                <span>{card.badge}</span>
              </span>
            </div>

            {/* Conteúdo com Gradiente e Botão */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <h3 className="font-heading font-black text-lg sm:text-xl text-secondary group-hover:text-primary transition flex items-center justify-between">
                  <span>{card.title}</span>
                  <span className="text-base">{card.icon}</span>
                </h3>
                <p className="font-bold text-xs text-orange-600">
                  {card.subtitle}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  {card.description}
                </p>
              </div>

              {/* Botão Colorido */}
              <Link
                href={card.link}
                className={`w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r ${card.gradient} text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm group-hover:shadow-md transition-all duration-200 active:scale-98`}
              >
                <span>Explorar {card.title}</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
