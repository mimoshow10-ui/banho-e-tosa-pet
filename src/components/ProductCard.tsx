'use client';

import Link from 'next/link';
import CountdownTimer from './CountdownTimer';

interface ProdutoCardProps {
  produto: {
    id: string;
    nome: string;
    slug: string;
    preco: number;
    preco_promocional?: number | null;
    promocao_expira_em?: string | null;
    imagens?: any;
  };
}

export default function ProductCard({ produto }: ProdutoCardProps) {
  let foto: string | null = null;
  try {
    let raw = produto.imagens;
    if (typeof raw === 'string' && raw.trim().startsWith('[')) {
      try { raw = JSON.parse(raw); } catch {}
    }
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
      foto = raw[0].split(/[\r\n,]+/)[0].trim();
    } else if (typeof raw === 'string' && raw.trim()) {
      foto = raw.split(/[\r\n,]+/)[0].trim();
    }
  } catch {}

  const precoNormal = Number(produto.preco || 0);
  const temPromo =
    produto.preco_promocional && Number(produto.preco_promocional) < precoNormal;
  const precoPromo = temPromo ? Number(produto.preco_promocional) : null;
  const pctDesconto = temPromo && precoNormal > 0
    ? Math.round(((precoNormal - precoPromo!) / precoNormal) * 100)
    : 0;

  const agora = Date.now();
  const expiraTime = produto.promocao_expira_em ? new Date(produto.promocao_expira_em).getTime() : null;
  const timerAtivo = temPromo && expiraTime !== null && !isNaN(expiraTime) && expiraTime > agora;

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-2xs hover:shadow-md transition-all border border-gray-200 overflow-hidden group">
      {/* Imagem do Produto com Badge de Desconto */}
      <Link href={`/produto/${produto.slug}`}>
        <div className="aspect-square bg-white relative overflow-hidden flex items-center justify-center p-1">
          <img
            src={foto || '/banner-pet.jpg'}
            alt={produto.nome || 'Produto'}
            className="w-full h-full object-contain group-hover:scale-105 transition duration-300 bg-white"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/banner-pet.jpg';
            }}
          />

          {temPromo && pctDesconto > 0 && (
            <span className="absolute top-2.5 right-2.5 bg-red-600 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-md z-10 animate-pulse">
              -{pctDesconto}% OFF
            </span>
          )}
        </div>
      </Link>

      {/* Conteúdo do Card */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <Link href={`/produto/${produto.slug}`}>
            <h3 className="font-bold text-xs md:text-sm line-clamp-2 hover:text-primary transition text-secondary leading-snug">
              {produto.nome}
            </h3>
          </Link>
        </div>

        <div className="mt-auto space-y-2">
          {/* Preço Cheio x Preço com Desconto */}
          {temPromo && precoPromo !== null ? (
            <div>
              <span className="text-xs text-gray-400 line-through font-medium block">
                R$ {precoNormal.toFixed(2).replace('.', ',')}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl md:text-2xl font-heading font-black text-primary">
                  R$ {precoPromo.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xl md:text-2xl font-heading font-black text-primary block">
              R$ {precoNormal.toFixed(2).replace('.', ',')}
            </span>
          )}

          {/* Timer de Validade Promocional */}
          {timerAtivo && (
            <div className="pt-1 border-t border-orange-100">
              <CountdownTimer targetDate={produto.promocao_expira_em!} />
            </div>
          )}

          {/* Botão Ver Produto */}
          <Link
            href={`/produto/${produto.slug}`}
            className="w-full bg-secondary hover:bg-blue-900 text-white py-2 rounded-xl font-bold transition text-xs flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
          >
            Ver Produto
          </Link>
        </div>
      </div>
    </div>
  );
}
