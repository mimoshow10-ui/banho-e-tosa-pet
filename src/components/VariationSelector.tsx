'use client'

import Link from 'next/link';

export default function VariationSelector({ currentSlug, family }: { currentSlug: string, family: any[] }) {
  if (!family || family.length <= 1) return null;

  const sortedFamily = [...family].sort((a, b) => {
    const nomeA = String(a?.nome || '');
    const nomeB = String(b?.nome || '');
    return nomeA.localeCompare(nomeB);
  });

  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50">
      <h3 className="font-bold text-secondary mb-2 text-xs uppercase tracking-wide">Opções Disponíveis:</h3>
      <div className="flex flex-wrap gap-2">
        {sortedFamily.map((item) => {
          if (!item || !item.slug) return null;
          const isActive = item.slug === currentSlug;
          let image: string | null = null;

          try {
            if (item.imagens) {
              let raw = item.imagens;
              if (typeof raw === 'string' && raw.trim().startsWith('[')) {
                try { raw = JSON.parse(raw); } catch {}
              }
              if (Array.isArray(raw) && raw.length > 0) {
                const first = raw[0];
                if (typeof first === 'string' && first.trim()) {
                  image = first.split(/[\r\n,]+/)[0].trim();
                }
              } else if (typeof raw === 'string' && raw.trim()) {
                image = raw.split(/[\r\n,]+/)[0].trim();
              }
            }
          } catch {}

          const priceVal = Number(item.preco_promocional || item.preco || 0);

          return (
            <Link 
              key={item.id || item.slug} 
              href={`/produto/${item.slug}`}
              scroll={false}
              className={`group relative flex items-center gap-2 p-1.5 rounded-lg border transition-all ${
                isActive ? 'border-primary bg-white shadow-sm ring-1 ring-primary/20' : 'border-gray-200 bg-white hover:border-gray-300 opacity-80 hover:opacity-100'
              }`}
            >
              {image && (
                <div className="w-9 h-9 relative rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={image}
                    alt={item.nome || 'Opção'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/banner-pet.jpg';
                    }}
                  />
                </div>
              )}
              <div className="flex flex-col pr-1">
                <span className={`text-[11px] font-bold line-clamp-1 max-w-[120px] ${isActive ? 'text-primary' : 'text-gray-700'}`}>
                  {item.nome || 'Opção'}
                </span>
                <span className="text-[10px] font-medium text-gray-500">
                  R$ {priceVal.toFixed(2).replace('.', ',')}
                </span>
              </div>
              
              {isActive && (
                <div className="absolute -top-1.5 -right-1.5 bg-primary text-white rounded-full p-0.5 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
