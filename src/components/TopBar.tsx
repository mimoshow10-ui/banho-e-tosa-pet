'use client';

import { usePathname } from 'next/navigation';

export default function TopBar({ topbar }: { topbar: any }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  const showTopbar = topbar.visibilidade === 'todas' || (topbar.visibilidade === 'home' && isHome);

  if (!showTopbar || topbar.visibilidade === 'nenhuma') {
    return null;
  }

  const frase1 = topbar.texto1 || topbar.texto || '🚚 Frete grátis acima de R$ 99,00';
  const frase2 = topbar.texto2 || '';

  const items = [];
  // Se houver frase 2, alternamos entre frase 1 e frase 2 com grande distancia em laranja entre elas
  for (let i = 0; i < 4; i++) {
    items.push({ id: `f1-${i}`, texto: frase1 });
    if (frase2 && frase2.trim()) {
      items.push({ id: `f2-${i}`, texto: frase2 });
    }
  }

  return (
    <div className={`w-full ${topbar.cor || 'bg-primary'} text-white py-2 overflow-hidden relative shadow-2xs`}>
      <style jsx>{`
        @keyframes marqueeSlow {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee-slow {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          animation: marqueeSlow 30s linear infinite;
        }
        .animate-marquee-slow:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="w-full flex items-center justify-center">
        <div className="animate-marquee-slow text-sm md:text-base font-black tracking-wider">
          {items.map((item, idx) => (
            <div key={item.id} className="inline-flex items-center">
              {/* Espaco de distancia em laranja antes de cada frase */}
              <span className="px-12 md:px-20 text-white font-black">{item.texto}</span>
              {/* Separador sutil com fundo laranja ao redor */}
              {idx < items.length - 1 && (
                <span className="text-white/40 font-normal text-xs">•</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
