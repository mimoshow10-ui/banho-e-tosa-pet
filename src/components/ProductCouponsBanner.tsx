'use client';

import { useState, useEffect } from 'react';
import { Ticket, CheckCircle2, Sparkles } from 'lucide-react';
import { Cupom } from '@/lib/types/coupon';

interface Props {
  produtoId: string;
  categoriaId?: string;
  sku?: string;
}

export default function ProductCouponsBanner({ produtoId, categoriaId, sku }: Props) {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [coletados, setColetados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar cupons coletados do localStorage
    try {
      const raw = localStorage.getItem('cupons_coletados');
      if (raw) {
        setColetados(JSON.parse(raw));
      }
    } catch {
      // localStorage indisponível
    }

    // Buscar cupons ativos do backend
    async function carregarCupons() {
      try {
        const res = await fetch('/api/cupons/disponiveis');
        if (res.ok) {
          const data = await res.json();
          const disponiveis: Cupom[] = data.cupons || [];

          // Filtrar cupons elegíveis para este produto/categoria
          const elegiveis = disponiveis.filter(c => {
            if (!c.ativo) return false;
            if (c.tipo_elegibilidade === 'todos') return true;
            if (c.tipo_elegibilidade === 'produtos' && c.elegiveis_ids?.includes(produtoId)) return true;
            if (c.tipo_elegibilidade === 'subgrupos' && categoriaId && c.elegiveis_ids?.includes(categoriaId)) return true;
            if (c.tipo_elegibilidade === 'skus' && sku && c.elegiveis_ids?.includes(sku)) return true;
            return false;
          });

          setCupons(elegiveis);
        }
      } catch {
        // Fallback local se a API não responder
        setCupons([
          {
            id: 'cupom-bemvindo',
            nome_interno: 'Desconto de Boas-Vindas',
            codigo: 'BEMVINDO10',
            tipo_desconto: 'percentual',
            valor_desconto: 10,
            compra_minima_reais: 50,
            ativo: true,
            usos_realizados: 0,
            permitir_produtos_promocionais: true,
            tipo_elegibilidade: 'todos',
            criado_em: new Date().toISOString(),
          }
        ]);
      }
      setLoading(false);
    }

    carregarCupons();
  }, [produtoId, categoriaId, sku]);

  function coletarCupom(codigo: string) {
    if (coletados.includes(codigo)) return;
    const novos = [...coletados, codigo];
    setColetados(novos);
    try {
      localStorage.setItem('cupons_coletados', JSON.stringify(novos));
    } catch {
      // localStorage indisponível
    }
  }

  if (loading || cupons.length === 0) return null;

  return (
    <div className="border border-orange-200 bg-gradient-to-r from-orange-50/80 to-amber-50/50 rounded-2xl p-4 shadow-2xs my-4">
      <div className="flex items-center gap-2 mb-3">
        <Ticket size={20} className="text-primary" />
        <h3 className="font-bold text-secondary text-sm flex items-center gap-1.5">
          Cupons da Loja Disponíveis
          <Sparkles size={14} className="text-primary animate-pulse" />
        </h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {cupons.map((c) => {
          const isColetado = coletados.includes(c.codigo);

          return (
            <div
              key={c.id}
              className="bg-white border border-orange-200 rounded-xl p-3 flex items-center justify-between gap-4 min-w-[240px] flex-shrink-0 shadow-2xs relative overflow-hidden"
            >
              <div className="flex-1">
                <div className="font-black text-primary text-sm flex items-center gap-1">
                  {c.tipo_desconto === 'percentual' && `${c.valor_desconto}% OFF`}
                  {c.tipo_desconto === 'fixo' && `R$ ${c.valor_desconto.toFixed(2)} OFF`}
                  {c.tipo_desconto === 'frete_gratis' && `FRETE GRÁTIS`}
                </div>
                {c.compra_minima_reais && (
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                    Mínimo: R$ {c.compra_minima_reais.toFixed(2).replace('.', ',')}
                  </p>
                )}
                <span className="text-[10px] font-mono font-bold text-gray-400 block mt-0.5 uppercase">
                  Cupom: {c.codigo}
                </span>
              </div>

              <button
                type="button"
                onClick={() => coletarCupom(c.codigo)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 flex-shrink-0 ${
                  isColetado
                    ? 'bg-green-100 text-green-800 cursor-default'
                    : 'bg-primary hover:bg-orange-600 text-white shadow-2xs'
                }`}
              >
                {isColetado ? (
                  <>
                    <CheckCircle2 size={12} />
                    <span>COLETADO</span>
                  </>
                ) : (
                  <span>PEGAR CUPOM</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
