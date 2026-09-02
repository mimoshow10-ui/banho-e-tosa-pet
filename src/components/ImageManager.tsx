'use client'

import { useState } from 'react';
import { X, ArrowLeft, ArrowRight, GripHorizontal } from 'lucide-react';

export default function ImageManager({ initialImages = [] }: { initialImages?: string[] }) {
  const [images, setImages] = useState<string[]>(initialImages);
  
  const moveLeft = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setImages(newImages);
  };

  const moveRight = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setImages(newImages);
  };

  const onDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div>
      <input type="hidden" name="imagens" value={images.join('\n')} />
      
      {images.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 bg-gray-50 mb-4">
          Nenhuma foto. Importe do Bling ou cole um link abaixo.
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 mb-6">
          {images.map((img, i) => (
            <div 
              key={img + i} 
              draggable
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={(e) => { e.preventDefault(); onDragOver(i); }}
              onDragEnd={onDragEnd}
              className={`relative w-32 h-32 border-2 rounded-xl overflow-hidden group cursor-grab active:cursor-grabbing ${draggedIndex === i ? 'opacity-50 border-primary' : 'border-gray-200'}`}
            >
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full z-10 font-bold backdrop-blur-sm">
                {i + 1}
              </div>
              <img src={img} alt={`Foto ${i+1}`} className="w-full h-full object-cover pointer-events-none" />
              
              <button 
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-700 shadow-md"
                title="Remover Foto"
              >
                <X size={16} />
              </button>
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-4 pb-2 px-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button 
                  type="button" 
                  onClick={() => moveLeft(i)} 
                  disabled={i === 0}
                  className="text-white disabled:opacity-30 hover:text-primary transition bg-black/40 rounded p-1 backdrop-blur-sm"
                >
                  <ArrowLeft size={16} />
                </button>
                <GripHorizontal size={16} className="text-gray-300" />
                <button 
                  type="button" 
                  onClick={() => moveRight(i)} 
                  disabled={i === images.length - 1}
                  className="text-white disabled:opacity-30 hover:text-primary transition bg-black/40 rounded p-1 backdrop-blur-sm"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-bold text-gray-700 mb-2">Adicionar Nova Foto (Link)</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Cole a URL pública da imagem (https://...)" 
            className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const val = e.currentTarget.value.trim();
                if (val) {
                  setImages([...images, val]);
                  e.currentTarget.value = '';
                }
              }
            }}
          />
          <button type="button" onClick={(e) => {
            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
            if (input.value.trim()) {
              setImages([...images, input.value.trim()]);
              input.value = '';
            }
          }} className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary-hover shadow-sm">
            Adicionar Foto
          </button>
        </div>
      </div>
    </div>
  );
}
