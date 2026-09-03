'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface Props {
  imagens: string[];
  videoUrl?: string | null;
  nome: string;
}

export default function ProductMediaGallery({ imagens, videoUrl, nome }: Props) {
  // Se tiver vídeo, o item ativo padrão é 'video', senão é a foto de índice 0
  const [activeMedia, setActiveMedia] = useState<'video' | number>(videoUrl ? 'video' : 0);

  // Trata URLs de imagens que podem vir separadas por \r\n ou vírgula
  const processedImages = (imagens || []).flatMap(img =>
    typeof img === 'string' ? img.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean) : []
  );

  // Extrair ID do YouTube se for link do YT
  const getYouTubeId = (url: string) => {
    if (url.includes('v=')) return url.split('v=')[1]?.split('&')[0];
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0];
    return null;
  };

  const videoId = videoUrl ? getYouTubeId(videoUrl) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* CAIXA DE MÍDIA PRINCIPAL (FOTO OU VÍDEO SELECIONADO) */}
      <div className="w-full aspect-square bg-black rounded-2xl border border-border relative overflow-hidden flex items-center justify-center">
        {activeMedia === 'video' && videoUrl ? (
          videoId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&rel=0&controls=0`}
              title="Vídeo do Produto"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video autoPlay loop muted playsInline className="w-full h-full object-cover">
              <source src={videoUrl} />
            </video>
          )
        ) : typeof activeMedia === 'number' && processedImages[activeMedia] ? (
          <Image
            src={processedImages[activeMedia]}
            alt={`${nome} - mídia ${activeMedia + 1}`}
            fill
            className="object-cover bg-white"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-gray-200">
            Sem Mídia
          </div>
        )}
      </div>

      {/* MINIATURAS DA GALERIA (VÍDEO + FOTOS) */}
      {(videoUrl || processedImages.length > 1) && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {/* Miniatura do Vídeo (Primeira posição se existir vídeo) */}
          {videoUrl && (
            <button
              type="button"
              onClick={() => setActiveMedia('video')}
              className={`w-20 h-20 bg-gray-900 rounded-xl border-2 flex flex-col items-center justify-center flex-shrink-0 relative overflow-hidden transition ${
                activeMedia === 'video' ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                <Play size={16} className="fill-white ml-0.5" />
              </div>
              <span className="text-[10px] font-bold text-white mt-1 uppercase tracking-wider">Vídeo</span>
            </button>
          )}

          {/* Miniaturas das Fotos */}
          {processedImages.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveMedia(index)}
              className={`w-20 h-20 bg-gray-100 rounded-xl border-2 flex-shrink-0 relative overflow-hidden transition ${
                activeMedia === index ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <Image src={img} alt={`Thumbnail ${index + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
