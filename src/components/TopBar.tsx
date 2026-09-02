'use client'

import { usePathname } from 'next/navigation';

export default function TopBar({ topbar }: { topbar: any }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  
  const showTopbar = topbar.visibilidade === 'todas' || (topbar.visibilidade === 'home' && isHome);

  if (!showTopbar || topbar.visibilidade === 'nenhuma') {
    return null;
  }

  return (
    <div className={`w-full ${topbar.cor} text-white text-center py-2 text-sm font-semibold`}>
      {topbar.texto}
    </div>
  );
}
