'use client';

import { usePathname } from 'next/navigation';

export default function HomeOnlyCategoryNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Exibe o menu horizontal de categorias APENAS na página principal (Home: '/')
  if (pathname !== '/') {
    return null;
  }

  return <>{children}</>;
}
