'use client';

import { useState, useEffect } from 'react';

export default function CartCountBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function atualizarContador() {
      try {
        const raw = localStorage.getItem('carrinho');
        if (raw) {
          const itens = JSON.parse(raw);
          if (Array.isArray(itens)) {
            const totalQtd = itens.reduce((sum, item) => sum + (Number(item.quantidade) || 1), 0);
            setCount(totalQtd);
            return;
          }
        }
        setCount(0);
      } catch {
        setCount(0);
      }
    }

    atualizarContador();

    // Ouvir eventos de atualização do carrinho
    window.addEventListener('cart-updated', atualizarContador);
    window.addEventListener('storage', atualizarContador);

    return () => {
      window.removeEventListener('cart-updated', atualizarContador);
      window.removeEventListener('storage', atualizarContador);
    };
  }, []);

  return (
    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-2xs">
      {count}
    </span>
  );
}
