'use client';

import { usePathname } from 'next/navigation';

export default function TopBar({ topbar }: { topbar: any }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  const showTopbar = topbar.visibilidade === 'todas' || (topbar.visibilidade === 'home' && isHome);

  if (!showTopbar || topbar.visibilidade === 'nenhuma') {
    return null;
  }

  const texto = topbar.texto || '🚚 Frete grátis acima de R$ 99,00';

  return (
    <div className={`w-full ${topbar.cor} text-white py-2 overflow-hidden relative shadow-2xs`}>
      <style jsx>{`
        @keyframes marqueeSlow {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee-slow {
          display: inline-block;
          white-space: nowrap;
          animation: marqueeSlow 30s linear infinite;
        }
        .animate-marquee-slow:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="w-full flex items-center justify-center">
        <div className="animate-marquee-slow text-base md:text-lg font-black tracking-wider flex items-center gap-32 md:gap-48 px-8">
          <span className="flex items-center gap-3">{texto}</span>
          <span className="opacity-50 text-xl">•</span>
          <span className="flex items-center gap-3">{texto}</span>
          <span className="opacity-50 text-xl">•</span>
          <span className="flex items-center gap-3">{texto}</span>
        </div>
      </div>
    </div>
  );
}
