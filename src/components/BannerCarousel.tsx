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
    <div className="w-full h-[300px] md:h-[500px] relative overflow-hidden">
      {banners.map((url, i) => (
        <div 
          key={i} 
          className={\bsolute inset-0 transition-opacity duration-1000 \\}
        >
          <img 
            src={url} 
            alt={\Banner \\} 
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
              className={\w-3 h-3 rounded-full transition-colors \\}
            />
          ))}
        </div>
      )}
    </div>
  );
}
