'use client';

import { CreditCard, Percent, Truck, ShieldCheck } from 'lucide-react';

export default function BenefitsBar() {
  const diferenciais = [
    {
      icon: CreditCard,
      titulo: 'ATÉ 4X SEM JUROS',
      subtitulo: 'Todos os cartões de crédito!',
    },
    {
      icon: Percent,
      titulo: '5% DE DESCONTO',
      subtitulo: 'No PIX à vista',
    },
    {
      icon: Truck,
      titulo: 'FRETE GRÁTIS',
      subtitulo: 'Confira as regras e regiões*',
    },
    {
      icon: ShieldCheck,
      titulo: 'SITE SEGURO',
      subtitulo: 'Protegemos seus dados',
    },
  ];

  return (
    <div className="w-full bg-white border-y border-gray-200 py-4 px-4 shadow-2xs">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {diferenciais.map((item, index) => {
          const Icone = item.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-orange-50/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-100/80 text-primary flex items-center justify-center flex-shrink-0 shadow-2xs border border-orange-200">
                <Icone size={24} strokeWidth={2.2} />
              </div>
              <div>
                <h4 className="font-heading font-black text-xs md:text-sm text-secondary uppercase tracking-tight leading-tight">
                  {item.titulo}
                </h4>
                <p className="text-[11px] font-semibold text-gray-500 mt-0.5 leading-tight">
                  {item.subtitulo}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
