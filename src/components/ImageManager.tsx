'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, ArrowRight, GripHorizontal, Upload, Clipboard, Link as LinkIcon, Loader2, ImagePlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ImageManager({ initialImages = [] }: { initialImages?: string[] }) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDragOverBox, setIsDragOverBox] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Processa o arquivo (colado do clipboard ou enviado do computador)
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);

    try {
      const fileExt = file.name ? file.name.split('.').pop() || 'png' : 'png';
      const fileName = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `manual/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('produtos-fotos')
        .upload(filePath, file, { contentType: file.type || 'image/png', upsert: true });

      if (uploadErr) {
        console.error("Erro ao enviar foto para o Supabase Storage:", uploadErr.message);
        // Fallback: Usar leitor DataURL Base64 caso o storage falhe
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImages(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('produtos-fotos')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          setImages(prev => [...prev, publicUrlData.publicUrl]);
        }
      }
    } catch (err) {
      console.error("Exceção ao processar imagem:", err);
    } finally {
      setUploading(false);
    }
  };

  // Suporte a COLAR PRINT (Ctrl + V) global na página do formulário
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            processImageFile(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  // Eventos de Drag & Drop de arquivos de imagem no retângulo
  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverBox(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          processImageFile(file);
        }
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => processImageFile(file));
      e.target.value = '';
    }
  };

  const handleAddLink = () => {
    const val = linkInput.trim();
    if (val) {
      setImages(prev => [...prev, val]);
      setLinkInput('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Campo oculto com as imagens separadas por quebra de linha */}
      <input type="hidden" name="imagens" value={images.join('\n')} />
      
      {/* Grid de Fotos Existentes com Drag-to-Reorder */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {images.map((img, i) => (
            <div 
              key={img + i} 
              draggable
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={(e) => { e.preventDefault(); onDragOver(i); }}
              onDragEnd={onDragEnd}
              className={`relative w-32 h-32 border-2 rounded-xl overflow-hidden group cursor-grab active:cursor-grabbing bg-gray-100 ${
                draggedIndex === i ? 'opacity-50 border-primary' : 'border-gray-200 hover:border-primary/50'
              }`}
            >
              <div className="absolute top-2 left-2 bg-black/70 text-white text-[11px] px-2 py-0.5 rounded-full z-10 font-bold backdrop-blur-xs">
                #{i + 1}
              </div>

              <img src={img} alt={`Foto ${i+1}`} className="w-full h-full object-cover pointer-events-none" />
              
              <button 
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-700 shadow-md cursor-pointer"
                title="Remover Foto"
              >
                <X size={14} />
              </button>
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-4 pb-2 px-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button 
                  type="button" 
                  onClick={() => moveLeft(i)} 
                  disabled={i === 0}
                  className="text-white disabled:opacity-30 hover:text-primary transition bg-black/40 rounded p-1 backdrop-blur-xs cursor-pointer"
                  title="Mover para Esquerda"
                >
                  <ArrowLeft size={14} />
                </button>
                <GripHorizontal size={14} className="text-gray-300" />
                <button 
                  type="button" 
                  onClick={() => moveRight(i)} 
                  disabled={i === images.length - 1}
                  className="text-white disabled:opacity-30 hover:text-primary transition bg-black/40 rounded p-1 backdrop-blur-xs cursor-pointer"
                  title="Mover para Direita"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Zona Interativa de Envio: Colar Print (Ctrl + V) / Upload de Arquivo / Drag & Drop */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragOverBox(true); }}
        onDragLeave={() => setIsDragOverBox(false)}
        onDrop={handleDropFiles}
        className={`p-6 border-2 border-dashed rounded-2xl transition text-center relative ${
          isDragOverBox 
            ? 'border-primary bg-orange-50/50' 
            : 'border-blue-200 bg-blue-50/30 hover:border-blue-300'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInputChange} 
          accept="image/*" 
          multiple 
          className="hidden" 
        />

        {uploading ? (
          <div className="py-4 flex flex-col items-center justify-center text-primary font-bold gap-2">
            <Loader2 size={32} className="animate-spin text-primary" />
            <span className="text-sm">Processando e enviando imagem...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center gap-3 text-blue-600">
              <div className="p-3 bg-blue-100/70 rounded-full text-blue-700 shadow-2xs">
                <Clipboard size={24} />
              </div>
              <div className="p-3 bg-orange-100/70 rounded-full text-orange-700 shadow-2xs">
                <Upload size={24} />
              </div>
            </div>

            <div>
              <p className="text-sm font-extrabold text-gray-800">
                📋 Pressione <kbd className="px-2 py-1 bg-white border border-gray-300 rounded-md shadow-2xs text-xs font-mono text-primary">Ctrl + V</kbd> para colar um print da tela
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Você também pode arrastar e soltar arquivos de imagem aqui ou escolher do seu computador
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-secondary hover:bg-black text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <ImagePlus size={16} />
                <span>Escolher Arquivo do Computador</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adicionar Foto por URL/Link */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
          <LinkIcon size={14} className="text-gray-500" />
          <span>Ou Adicione Foto via Link (URL Pública):</span>
        </label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Cole a URL pública da imagem (https://...)" 
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-primary focus:outline-none bg-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddLink();
              }
            }}
          />
          <button 
            type="button" 
            onClick={handleAddLink} 
            className="bg-primary text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition shadow-2xs cursor-pointer"
          >
            Adicionar Link
          </button>
        </div>
      </div>
    </div>
  );
}
