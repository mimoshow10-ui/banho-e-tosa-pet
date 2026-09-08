'use client'

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { importarSKU } from '@/app/admin/produtos/actions';

export default function ImportBlingForm() {
  const searchParams = useSearchParams();
  const [skuVal, setSkuVal] = useState(searchParams.get('imported_sku') || '');
  const [isPending, setIsPending] = useState(false);

  const currentParams = searchParams.toString();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setIsPending(true);
        const formData = new FormData(e.currentTarget);
        formData.set('currentParams', currentParams);
        try {
          await importarSKU(formData);
        } finally {
          setIsPending(false);
        }
      }}
      className="flex gap-2"
    >
      <input
        name="sku"
        type="text"
        value={skuVal}
        onChange={(e) => setSkuVal(e.target.value)}
        placeholder="Ex: MS5153-H7"
        required
        className="flex-1 border border-border rounded-lg p-2 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-primary focus:outline-none"
      />
      <input type="hidden" name="currentParams" value={currentParams} />
      <button
        type="submit"
        disabled={isPending}
        className="bg-secondary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-900 transition shadow-sm text-sm disabled:opacity-50 cursor-pointer"
      >
        {isPending ? 'Importando...' : 'Importar SKU do Bling'}
      </button>
    </form>
  );
}

