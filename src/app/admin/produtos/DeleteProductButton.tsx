'use client'

import { Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { excluirProduto } from './actions';

export default function DeleteProductButton({ id, nome }: { id: string, nome: string }) {
  const searchParams = useSearchParams();
  const currentParams = searchParams.toString();

  return (
    <button 
      onClick={async () => {
        if (window.confirm(`Tem certeza absoluta que deseja EXCLUIR DEFINITIVAMENTE o produto "${nome}"?`)) {
          await excluirProduto(id, currentParams);
        }
      }}
      className="text-red-600 hover:underline flex items-center gap-1 font-bold ml-3 cursor-pointer"
      title="Excluir Produto"
    >
      <Trash2 size={16} /> Excluir
    </button>
  );
}
