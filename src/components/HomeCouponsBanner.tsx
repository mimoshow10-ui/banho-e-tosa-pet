'use client';

import { useState, useEffect } from 'react';
import { Check, Sparkles, Tag } from 'lucide-react';
import { CupomDesconto } from '@/lib/types/coupon';

export default function HomeCouponsBanner() {
  const [cupons, setCupons] = useState<CupomDesconto[]>([]);
  const [coletados, setColetados] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function carregarCupons() {
      try {
        const res = await fetch('/api/cupons/disponiveis');
        if (res.ok) {
          const data = await res.json();
          setCupons(data.cupons || []);
        }
      } catch {}
    }

    try {
      const raw = localStorage.getItem('cupons_coletados');
      if (raw) setColetados(JSON.parse(raw));
    } catch {}

    carregarCupons();
  }, []);

  function coletarCupom(c: Partial<CupomDesconto>) {
    try {
      if (!c.codigo) return;
      const novos = { ...coletados, [c.codigo]: true };
      setColetados(novos);
      localStorage.setItem('cupons_coletados', JSON.stringify(novos));
      localStorage.setItem('cupom_ativo_codigo', c.codigo);
      navigator.clipboard.writeText(c.codigo);
    } catch {}
  }

  const listaExibida: Partial<CupomDesconto>[] = cupons.length > 0 ? cupons : [
    { id: '1', codigo: 'BEMVINDO10', tipo: 'percentual', valor: 10, compra_minima: 50, nome_interno: 'Cupom de Boas-Vindas 10% OFF' },
    { id: '2', codigo: 'FRETEGRATIS', tipo: 'frete_gratis', valor: 0, compra_minima: 99, nome_interno: 'Cupom Frete Grátis acima R$ 99' },
    { id: '3', codigo: 'PET20', tipo: 'fixo', valor: 20, compra_minima: 150, nome_interno: 'Cupom R$ 20 OFF Especial' },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 py-3.5 px-4 text-white shadow-sm border-b border-orange-600/30">
      <div className="max-w-7xl mx-auto">
        {/* Grid Ampliado (+1/3 em tamanho) de Cupons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {listaExibida.map((c) => {
            const isColetado = !!coletados[c.codigo!];
            const badgeTexto = c.tipo === 'percentual'
              ? `${c.valor}% OFF`
              : c.tipo === 'fixo'
              ? `R$ ${c.valor} OFF`
              : 'FRETE GRÁTIS';

            return (
              <div
                key={c.codigo}
                className="bg-white text-secondary rounded-2xl p-3 md:p-3.5 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-orange-500 border border-gray-200 flex items-center justify-between gap-3 group relative"
              >
                {/* Detalhes do Cupom */}
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-red-600 text-white font-black text-xs md:text-sm px-2 py-0.5 rounded-md uppercase tracking-tight shadow-2xs">
                      {badgeTexto}
                    </span>
                    <span className="font-mono font-black text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md border border-gray-300 flex items-center gap-1">
                      <Tag size={11} className="text-orange-500" />
                      {c.codigo}
                    </span>
                  </div>
                  
                  {/* Nome/Descrição do Cupom com Fonte Maior e Destacada */}
                  <p className="text-xs md:text-sm font-black text-gray-900 line-clamp-1 group-hover:text-primary transition leading-snug">
                    {c.nome_interno}
                  </p>
                </div>

                {/* Botão de Coletar Ampliado */}
                <button
                  type="button"
                  onClick={() => coletarCupom(c)}
                  className={`px-4 py-2 rounded-xl text-xs md:text-sm font-black transition-all duration-200 flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                    isColetado
                      ? 'bg-green-600 text-white shadow-2xs'
                      : 'bg-primary text-white hover:bg-orange-600 shadow-xs active:scale-95'
                  }`}
                >
                  {isColetado ? (
                    <>
                      <Check size={14} />
                      <span>Coletado</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Pegar</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
