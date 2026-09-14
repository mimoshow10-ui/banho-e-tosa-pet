'use client';

import { useFormStatus } from 'react-dom';
import { RefreshCw, Save } from 'lucide-react';

export default function FormSubmitButton({
  label = 'Salvar Alterações',
  loadingLabel = 'Salvando Alterações...',
}: {
  label?: string;
  loadingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
        pending
          ? 'bg-gray-400 opacity-80 cursor-wait'
          : 'bg-primary hover:bg-orange-600 active:scale-[0.99]'
      }`}
    >
      {pending ? (
        <>
          <RefreshCw size={18} className="animate-spin text-white" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <Save size={18} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
