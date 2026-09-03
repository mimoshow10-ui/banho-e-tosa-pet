'use client';

import { useState, useEffect } from 'react';
import { Ticket, Check, Sparkles, Tag, ArrowRight } from 'lucide-react';
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
    { id: '1', codigo: 'BEMVINDO10', tipo: 'percentual', valor: 10, compra_minima: 50, nome_interno: '10% OFF na Primeira Compra' },
    { id: '2', codigo: 'FRETEGRATIS', tipo: 'frete_gratis', valor: 0, compra_minima: 99, nome_interno: 'Frete Grátis acima de R$ 99' },
    { id: '3', codigo: 'PET20', tipo: 'fixo', valor: 20, compra_minima: 150, nome_interno: 'R$ 20 OFF acima de R$ 150' },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 py-4 px-4 text-white shadow-md border-b border-orange-600/30">
      <div className="max-w-[1500px] mx-auto space-y-3">
        
        {/* Cabeçalho da Seção de Cupons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-yellow-200">
              <Ticket size={18} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-heading font-black tracking-tight uppercase flex items-center gap-1.5">
                <span>🎟️ Cupons da Loja</span>
                <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full tracking-normal lowercase font-sans">
                  economize já
                </span>
              </h2>
            </div>
          </div>
          
          <span className="text-xs font-bold text-yellow-100 hidden sm:flex items-center gap-1">
            Clique em PEGAR para aplicar no carrinho <ArrowRight size={14} />
          </span>
        </div>

        {/* Cards Estilo Ticket de Cupom */}
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
                className="bg-white text-secondary rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-orange-500 border border-gray-200 flex items-center justify-between gap-3 group relative"
              >
                {/* Detalhes do Cupom */}
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-red-600 text-white font-black text-[11px] px-2 py-0.5 rounded-md uppercase tracking-tight shadow-2xs">
                      {badgeTexto}
                    </span>
                    <span className="font-mono font-bold text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                      <Tag size={10} className="text-orange-500" />
                      {c.codigo}
                    </span>
                  </div>
                  
                  <p className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-primary transition">
                    {c.nome_interno}
                  </p>

                  <p className="text-[10px] text-gray-400 font-medium">
                    {c.compra_minima && c.compra_minima > 0
                      ? `Mínimo R$ ${Number(c.compra_minima).toFixed(2).replace('.', ',')}`
                      : 'Sem valor mínimo exigido'}
                  </p>
                </div>

                {/* Botão de Coletar */}
                <button
                  type="button"
                  onClick={() => coletarCupom(c)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                    isColetado
                      ? 'bg-green-600 text-white shadow-2xs'
                      : 'bg-primary text-white hover:bg-orange-600 shadow-sm active:scale-95'
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
