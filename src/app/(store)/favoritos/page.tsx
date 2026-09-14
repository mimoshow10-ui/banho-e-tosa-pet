'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function FavoritosPage() {
  const [favoritos, setFavoritos] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('favoritos');
      if (raw) {
        setFavoritos(JSON.parse(raw));
      }
    } catch {
      //
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 font-sans">
      <h1 className="text-2xl md:text-3xl font-heading font-bold text-secondary mb-8 flex items-center gap-3">
        <Heart size={32} className="text-red-500 fill-red-500" />
        Meus Favoritos
      </h1>

      {favoritos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {favoritos.map((prod) => (
            <div key={prod.id} className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="aspect-square bg-gray-100 relative">
                  {prod.imagem ? (
                    <Image src={prod.imagem} alt={prod.nome} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">Sem Foto</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-secondary text-sm line-clamp-2">{prod.nome}</h3>
                  <p className="font-black text-primary text-base mt-2">R$ {Number(prod.preco).toFixed(2).replace('.', ',')}</p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <Link
                  href={`/produto/${prod.slug}`}
                  className="w-full bg-secondary hover:bg-blue-900 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                >
                  <ShoppingBag size={14} />
                  Ver Produto
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300 max-w-md mx-auto space-y-4 shadow-2xs">
          <Heart size={48} className="mx-auto text-red-300" />
          <h2 className="text-xl font-bold text-secondary">Sua lista de favoritos está vazia</h2>
          <p className="text-xs text-gray-500">Navegue pelos produtos e clique no ícone de coração para salvar seus itens favoritos!</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Explorar Produtos</span>
          </Link>
        </div>
      )}
    </div>
  );
}
