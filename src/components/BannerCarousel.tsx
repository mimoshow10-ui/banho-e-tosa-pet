'use client'

import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

export interface BannerItem {
  url: string;
  link_url?: string;
}

export default function BannerCarousel({ banners, className }: { banners: (BannerItem | string)[]; className?: string }) {
  const [current, setCurrent] = useState(0);

  const items: BannerItem[] = (banners || []).map(b => {
    if (typeof b === 'string') return { url: b, link_url: '' };
    return b;
  });

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent(c => (c + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!items || items.length === 0) return null;

  return (
    <div className={className || "w-full h-[160px] sm:h-[220px] md:h-[270px] lg:h-[300px] relative overflow-hidden bg-gray-900 group shadow-inner"}>
      {items.map((item, i) => {
        const hasLink = !!item.link_url?.trim();
        const isVideo = item.link_url?.includes('youtube') || item.link_url?.includes('youtu.be') || item.link_url?.includes('vimeo') || item.link_url?.endsWith('.mp4');

        const Content = (
          <div className="relative w-full h-full">
            <img 
              src={item.url} 
              alt={`Banner ${i + 1}`} 
              className="w-full h-full object-cover object-center"
            />
            {isVideo && (
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                <div className="bg-red-600/90 text-white px-4 py-2.5 rounded-full shadow-lg hover:scale-110 transition flex items-center gap-2 border border-white/20">
                  <Play size={22} className="fill-white" />
                  <span className="text-xs md:text-sm font-bold uppercase tracking-wider">Assistir Vídeo</span>
                </div>
              </div>
            )}
          </div>
        );

        return (
          <div 
            key={i} 
            className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            {hasLink ? (
              <a 
                href={item.link_url} 
                target={item.link_url?.startsWith('http') ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="block w-full h-full cursor-pointer hover:opacity-95 transition"
              >
                {Content}
              </a>
            ) : (
              Content
            )}
          </div>
        );
      })}

      {items.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
          {items.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full transition-all cursor-pointer ${i === current ? 'bg-primary scale-125 shadow-md' : 'bg-white/60 hover:bg-white'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
