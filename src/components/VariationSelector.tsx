'use client'

import Link from 'next/link';
import { extractImageUrls } from './ProductMediaGallery';

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
          const fotos = extractImageUrls(item.imagens);
          const image = fotos[0] || null;
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
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
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
