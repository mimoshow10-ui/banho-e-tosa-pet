'use client'

import Link from 'next/link';
import Image from 'next/image';

export default function VariationSelector({ currentSlug, family }: { currentSlug: string, family: any[] }) {
  if (!family || family.length <= 1) return null;

  // Sort so parent comes first, or just alphabetical
  const sortedFamily = [...family].sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div className="mb-8 border border-gray-200 rounded-xl p-4 bg-gray-50/50">
      <h3 className="font-bold text-secondary mb-3 text-sm uppercase tracking-wide">Opções Disponíveis:</h3>
      <div className="flex flex-wrap gap-3">
        {sortedFamily.map((item) => {
          const isActive = item.slug === currentSlug;
          let image: string | null = null;
          if (item.imagens && item.imagens.length > 0) {
            const first = item.imagens[0];
            if (typeof first === 'string' && first.trim()) {
              image = first.split(/[\r\n,]+/)[0].trim();
            }
          }

          return (
            <Link 
              key={item.id} 
              href={`/produto/${item.slug}`}
              scroll={false}
              className={`group relative flex items-center gap-3 p-2 rounded-lg border-2 transition-all ${isActive ? 'border-primary bg-white shadow-sm ring-1 ring-primary/20' : 'border-gray-200 bg-white hover:border-gray-300 opacity-80 hover:opacity-100'}`}
            >
              {image && (
                <div className="w-12 h-12 relative rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image src={image} alt={item.nome} fill className="object-cover" sizes="48px" />
                </div>
              )}
              <div className="flex flex-col pr-2">
                <span className={`text-xs font-bold line-clamp-1 max-w-[140px] ${isActive ? 'text-primary' : 'text-gray-700'}`}>
                  {item.nome}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  R$ {Number(item.preco_promocional || item.preco).toFixed(2).replace('.', ',')}
                </span>
              </div>
              
              {isActive && (
                <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-0.5 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
