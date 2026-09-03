'use client';

import { useState, useEffect } from 'react';
import { Ticket, Check, Sparkles, Copy } from 'lucide-react';
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
      } catch {
        //
      }
    }

    try {
      const raw = localStorage.getItem('cupons_coletados');
      if (raw) setColetados(JSON.parse(raw));
    } catch {}

    carregarCupons();
  }, []);

  function coletarCupom(c: CupomDesconto) {
    try {
      const novos = { ...coletados, [c.codigo]: true };
      setColetados(novos);
      localStorage.setItem('cupons_coletados', JSON.stringify(novos));

      // Salva o último cupom coletado para auto-aplicação no carrinho
      localStorage.setItem('cupom_ativo_codigo', c.codigo);

      // Copia o código para a área de transferência do usuário
      navigator.clipboard.writeText(c.codigo);
    } catch {}
  }

  if (cupons.length === 0) {
    // Se ainda não cadastrou no banco, mostra 2 cupons de exemplo atrativos
    const cuponsExemplo: Partial<CupomDesconto>[] = [
      { id: '1', codigo: 'BEMVINDO10', tipo: 'percentual', valor: 10, compra_minima: 50, nome_interno: '10% OFF na Primeira Compra' },
      { id: '2', codigo: 'FRETEGRATIS', tipo: 'frete_gratis', valor: 0, compra_minima: 99, nome_interno: 'Frete Grátis acima de R$ 99' },
      { id: '3', codigo: 'PET20', tipo: 'fixo', valor: 20, compra_minima: 150, nome_interno: 'R$ 20 OFF em compras acima de R$ 150' },
    ];

    return (
      <div className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 py-6 px-4 text-white shadow-md">
        <div className="max-w-[1500px] mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket size={24} className="text-yellow-200 animate-bounce" />
              <h2 className="text-lg md:text-xl font-heading font-black tracking-tight uppercase">
                🎟️ Cupons Especiais da Loja
              </h2>
            </div>
            <span className="text-xs font-bold bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full hidden sm:inline-block">
              Pegue o seu e economize!
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cuponsExemplo.map((c) => {
              const isColetado = !!coletados[c.codigo!];

              return (
                <div
                  key={c.codigo}
                  className="bg-white text-secondary rounded-2xl p-4 shadow-sm border border-yellow-200 flex items-center justify-between gap-3 relative overflow-hidden group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-red-500 text-white font-black text-xs px-2 py-0.5 rounded-md uppercase">
                        {c.tipo === 'percentual' ? `${c.valor}% OFF` : c.tipo === 'fixo' ? `R$ ${c.valor} OFF` : 'FRETE GRÁTIS'}
                      </span>
                      <span className="font-mono font-bold text-xs text-gray-500">{c.codigo}</span>
                    </div>
                    <p className="text-xs text-gray-600 font-bold line-clamp-1">{c.nome_interno}</p>
                    <p className="text-[11px] text-gray-400">Mínimo R$ {c.compra_minima?.toFixed(2).replace('.', ',')}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => coletarCupom(c as CupomDesconto)}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer flex-shrink-0 ${
                      isColetado
                        ? 'bg-green-600 text-white'
                        : 'bg-primary text-white hover:bg-orange-600 shadow-2xs'
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

  return (
    <div className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 py-6 px-4 text-white shadow-md">
      <div className="max-w-[1500px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket size={24} className="text-yellow-200" />
            <h2 className="text-lg md:text-xl font-heading font-black tracking-tight uppercase">
              🎟️ Cupons Especiais da Loja
            </h2>
          </div>
          <span className="text-xs font-bold bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full hidden sm:inline-block">
            Pegue o seu e economize na hora!
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {cupons.map((c) => {
            const isColetado = !!coletados[c.codigo];

            return (
              <div
                key={c.id}
                className="bg-white text-secondary rounded-2xl p-4 shadow-sm border border-yellow-200 flex items-center justify-between gap-3 relative overflow-hidden group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-red-600 text-white font-black text-xs px-2 py-0.5 rounded-md uppercase">
                      {c.tipo === 'percentual' ? `${c.valor}% OFF` : c.tipo === 'fixo' ? `R$ ${c.valor} OFF` : 'FRETE GRÁTIS'}
                    </span>
                    <span className="font-mono font-bold text-xs text-gray-500">{c.codigo}</span>
                  </div>
                  <p className="text-xs text-gray-700 font-bold line-clamp-1">{c.nome_interno}</p>
                  {c.compra_minima > 0 && (
                    <p className="text-[11px] text-gray-400">Mínimo R$ {c.compra_minima.toFixed(2).replace('.', ',')}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => coletarCupom(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer flex-shrink-0 ${
                    isColetado
                      ? 'bg-green-600 text-white'
                      : 'bg-primary text-white hover:bg-orange-600 shadow-2xs'
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
