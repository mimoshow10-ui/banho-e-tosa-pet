'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function BannerCarousel({ banners }: { banners: string[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent(c => (c + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="w-full h-[160px] sm:h-[220px] md:h-[270px] lg:h-[300px] relative overflow-hidden bg-gray-100">
      {banners.map((url, i) => (
        <div 
          key={i} 
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img 
            src={url} 
            alt={`Banner ${i+1}`} 
            className="w-full h-full object-cover object-center"
          />
        </div>
      ))}

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
          {banners.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full transition-colors ${i === current ? 'bg-primary' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
