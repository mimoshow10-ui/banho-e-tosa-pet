'use client'

import { useState } from 'react';
import { salvarBanners } from './actions';
import { Trash2, Plus } from 'lucide-react';

export default function BannersForm({ urlsAtuais }: { urlsAtuais: string[] }) {
  const [urls, setUrls] = useState<string[]>(urlsAtuais);
  const [novos, setNovos] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const removerAntiga = (index: number) => {
    const novas = [...urls];
    novas.splice(index, 1);
    setUrls(novas);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-8">
      <div className="flex items-center gap-2 mb-6 border-b pb-2">
        <h2 className="text-xl font-bold text-secondary">Carrossel de Banners (Página Inicial)</h2>
      </div>
      
      <form action={async (formData) => {
        setLoading(true);
        formData.append('urls_antigas', JSON.stringify(urls));
        await salvarBanners(formData);
        setLoading(false);
      }} className="flex flex-col gap-6">
        
        {urls.length > 0 && (
          <div>
            <h3 className="font-bold text-sm mb-3">Banners Ativos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {urls.map((url, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden border border-gray-300 h-24">
                  <img src={url} className="w-full h-full object-cover" alt="Banner" />
                  <button type="button" onClick={() => removerAntiga(i)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:scale-110 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-bold text-sm mb-3">Adicionar Novos Banners</h3>
          <div className="flex flex-col gap-3">
            {Array.from({ length: novos }).map((_, i) => (
              <input key={i} type="file" name={\anner_file_\\} accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-200 rounded p-2" />
            ))}
          </div>
          
          {urls.length + novos < 10 && (
            <button type="button" onClick={() => setNovos(n => n + 1)} className="mt-3 text-sm font-bold text-primary flex items-center gap-1 hover:underline">
              <Plus size={16} /> Adicionar mais um espaço
            </button>
          )}
        </div>

        <button type="submit" disabled={loading} className="bg-primary text-white py-3 px-8 rounded-lg font-bold hover:bg-orange-600 transition w-full md:w-auto self-start disabled:opacity-50">
          {loading ? 'Salvando...' : 'Salvar Banners'}
        </button>
      </form>
    </div>
  );
}
