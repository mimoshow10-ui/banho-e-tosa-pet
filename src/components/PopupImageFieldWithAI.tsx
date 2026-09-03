'use client';

import { useState } from 'react';
import GeradorBannerIAModal from './GeradorBannerIAModal';

interface Props {
  initialUrl?: string;
}

export default function PopupImageFieldWithAI({ initialUrl = '' }: Props) {
  const [url, setUrl] = useState(initialUrl);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700">
          Imagem / Banner do Pop-up (Recomendado: 800x800 px ou 600x800 px)
        </label>
        <GeradorBannerIAModal onGerado={(novaUrl) => setUrl(novaUrl)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            name="popup_file"
            type="file"
            accept="image/*"
            className="w-full border border-gray-300 rounded-xl p-2 text-xs bg-white cursor-pointer"
          />
          <p className="text-[11px] text-gray-400 mt-1">Selecione uma foto no seu computador.</p>
        </div>
        <div>
          <input
            name="imagem_url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Ou cole a URL da imagem / gerada por I.A"
            className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-white font-mono"
          />
        </div>
      </div>

      {url && (
        <div className="mt-2 w-36 h-36 relative bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-2xs">
          <img src={url} alt="Prévia do Pop-up" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}
