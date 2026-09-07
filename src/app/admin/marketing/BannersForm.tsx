'use client'

import { useState } from 'react';
import { salvarBanners } from './actions';
import { Trash2, Plus, ArrowUp, ArrowDown, Link as LinkIcon, Video, Move, Sparkles } from 'lucide-react';

export interface BannerItemData {
  url: string;
  link_url: string;
}

export default function BannersForm({ bannersIniciais }: { bannersIniciais: (BannerItemData | string)[] }) {
  // Converter props iniciais para formato unificado { url, link_url }
  const [items, setItems] = useState<BannerItemData[]>(() => {
    return (bannersIniciais || []).map(b => {
      if (typeof b === 'string') return { url: b, link_url: '' };
      return { url: b.url || '', link_url: b.link_url || '' };
    });
  });

  const [novos, setNovos] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Mover banner para cima
  function moverParaCima(index: number) {
    if (index === 0) return;
    const novosItems = [...items];
    const temp = novosItems[index - 1];
    novosItems[index - 1] = novosItems[index];
    novosItems[index] = temp;
    setItems(novosItems);
  }

  // Mover banner para baixo
  function moverParaBaixo(index: number) {
    if (index === items.length - 1) return;
    const novosItems = [...items];
    const temp = novosItems[index + 1];
    novosItems[index + 1] = novosItems[index];
    novosItems[index] = temp;
    setItems(novosItems);
  }

  // Atualizar link de um banner existente
  function atualizarLink(index: number, link: string) {
    const novosItems = [...items];
    novosItems[index].link_url = link;
    setItems(novosItems);
  }

  // Remover banner
  function removerBanner(index: number) {
    const novosItems = [...items];
    novosItems.splice(index, 1);
    setItems(novosItems);
  }

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-2">
        <div>
          <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            2. Carrossel de Banners Principal (Com Links & Ordenação)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Altere a ordem dos banners (estilo Kanban/Lista), adicione links de produtos ou vídeos do YouTube.
          </p>
        </div>
        <span className="bg-orange-100 text-primary border border-orange-200 text-xs font-black px-3 py-1 rounded-full w-fit">
          {items.length} Banner(s) Ativo(s)
        </span>
      </div>
      
      <form
        action={async (formData) => {
          setLoading(true);
          formData.append('banners_json', JSON.stringify(items));
          await salvarBanners(formData);
          setLoading(false);
        }}
        className="space-y-6"
      >
        {/* LISTA DE BANNERS ATIVOS (ORDENAÇÃO KANBAN / REORDENAR) */}
        {items.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <Move size={14} className="text-primary" />
              <span>Ordem de Exibição dos Banners (Use as setas para reordenar)</span>
            </h3>

            <div className="space-y-3">
              {items.map((item, i) => {
                const isVideo = item.link_url?.includes('youtube') || item.link_url?.includes('youtu.be') || item.link_url?.includes('vimeo');

                return (
                  <div 
                    key={i} 
                    className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-200 hover:border-orange-300 transition shadow-2xs"
                  >
                    {/* Badge da Posição */}
                    <div className="flex items-center gap-2">
                      <span className="bg-secondary text-white font-black text-xs w-7 h-7 rounded-xl flex items-center justify-center shadow-2xs">
                        #{i + 1}
                      </span>
                      
                      {/* Botões de Reordenação (Kanban / Subir / Descer) */}
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moverParaCima(i)}
                          disabled={i === 0}
                          title="Mover para Cima / Esquerda"
                          className="bg-white hover:bg-orange-100 text-secondary p-1 rounded-lg border border-gray-300 disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moverParaBaixo(i)}
                          disabled={i === items.length - 1}
                          title="Mover para Baixo / Direita"
                          className="bg-white hover:bg-orange-100 text-secondary p-1 rounded-lg border border-gray-300 disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Preview da Imagem do Banner */}
                    <div className="w-full md:w-48 h-20 rounded-xl overflow-hidden border border-gray-300 bg-gray-200 relative flex-shrink-0">
                      <img src={item.url} className="w-full h-full object-cover" alt={`Banner #${i + 1}`} />
                      {isVideo && (
                        <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                          <Video size={10} /> VÍDEO
                        </span>
                      )}
                    </div>

                    {/* Campo de Link do Produto ou Vídeo */}
                    <div className="flex-1 w-full space-y-1">
                      <label className="block text-xs font-bold text-gray-700 flex items-center gap-1">
                        <LinkIcon size={12} className="text-primary" />
                        <span>Link de Destino / Vídeo (Opcional):</span>
                      </label>
                      <input
                        type="url"
                        value={item.link_url || ''}
                        onChange={(e) => atualizarLink(i, e.target.value)}
                        placeholder="Ex: https://sualoja.com/produto/coleira ou URL do vídeo YouTube"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-[10px] text-gray-500">
                        Cole a URL do anúncio do produto para redirecionar ao clicar ou link do YouTube para destacar vídeo.
                      </p>
                    </div>

                    {/* Botão de Excluir Banner */}
                    <button 
                      type="button" 
                      onClick={() => removerBanner(i)} 
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-2.5 rounded-xl transition cursor-pointer self-end md:self-center"
                      title="Excluir este Banner"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ADICIONAR NOVOS BANNERS COM LINK */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">
            Adicionar Novos Banners
          </h3>
          
          <div className="space-y-3">
            {Array.from({ length: novos }).map((_, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50/60 p-3.5 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Arquivo de Imagem do Banner #{items.length + i + 1}
                  </label>
                  <input 
                    type="file" 
                    name={`banner_file_${i}`} 
                    accept="image/*" 
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-primary hover:file:bg-orange-100 cursor-pointer border border-gray-300 rounded-xl p-1.5 bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Link do Produto ou Vídeo (Opcional)
                  </label>
                  <input 
                    type="url" 
                    name={`banner_file_link_${i}`} 
                    placeholder="https://... (URL do produto ou vídeo YouTube)" 
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary" 
                  />
                </div>
              </div>
            ))}
          </div>
          
          {items.length + novos < 10 && (
            <button 
              type="button" 
              onClick={() => setNovos(n => n + 1)} 
              className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer py-1"
            >
              <Plus size={15} />
              <span>Adicionar mais um espaço para banner</span>
            </button>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="bg-primary hover:bg-orange-600 text-white py-3 px-8 rounded-xl font-bold transition shadow-sm w-full md:w-auto disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm"
        >
          {loading ? 'Salvando Banners & Posições...' : '💾 Salvar Alterações dos Banners'}
        </button>
      </form>
    </div>
  );
}
