'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function HeaderLogo() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  if (isHome) {
    return (
      <div className="w-full flex justify-center py-4 bg-white border-b border-gray-100">
        <Link href="/">
          <div className="relative w-64 sm:w-80 md:w-[420px] h-24 sm:h-28 md:h-36 cursor-pointer hover:scale-102 transition duration-300">
            <Image
              src="/logo-luxo.jpg"
              alt="Banho e Tosa Pet Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
      </div>
    );
  }

  return (
    <Link href="/">
      <div className="relative w-44 md:w-52 h-14 cursor-pointer hover:opacity-90 transition">
        <Image
          src="/logo-luxo.jpg"
          alt="Banho e Tosa Pet Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
    </Link>
  );
}
