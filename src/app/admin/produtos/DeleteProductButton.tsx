'use client'

import { Trash2 } from 'lucide-react';
import { excluirProduto } from './actions';

export default function DeleteProductButton({ id, nome }: { id: string, nome: string }) {
  return (
    <button 
      onClick={async () => {
        if (window.confirm(`Tem certeza absoluta que deseja EXCLUIR DEFINITIVAMENTE o produto "${nome}"?`)) {
          await excluirProduto(id);
        }
      }}
      className="text-red-600 hover:underline flex items-center gap-1 font-bold ml-3"
      title="Excluir Produto"
    >
      <Trash2 size={16} /> Excluir
    </button>
  );
}
