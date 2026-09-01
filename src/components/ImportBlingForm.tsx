'use client'

import { useActionState } from 'react';
import { importarSKU } from '@/app/admin/produtos/actions';

export default function ImportBlingForm() {
  const [error, submitAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      await importarSKU(formData);
      return null;
    },
    null
  );

  return (
    <form action={submitAction} className="flex gap-2">
      <input name="sku" type="text" placeholder="Ex: MS5153-H7" required className="flex-1 border border-border rounded-lg p-2 text-sm" />
      <button type="submit" disabled={isPending} className="bg-secondary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-900 transition shadow-sm text-sm disabled:opacity-50">
        {isPending ? 'Importando...' : 'Importar SKU do Bling'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
