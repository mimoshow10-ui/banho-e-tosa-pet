'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X, Sparkles } from 'lucide-react';

interface PopupData {
  ativo: boolean;
  imagem_url?: string;
  link_destino?: string;
  titulo?: string;
  subtitulo?: string;
  tempo_exibicao_segundos?: number;
  gatilho?: 'imediato' | 'tempo' | 'saida';
  onde_exibir?: 'home' | 'todas' | 'carrinho' | 'produtos';
  frequencia?: 'uma_vez_por_sessao' | 'sempre' | 'uma_vez_por_dia';
}

export default function PromoModalPopup() {
  const pathname = usePathname();
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    // Não exibir dentro do Painel Admin
    if (pathname.startsWith('/admin')) return;

    async function carregarPopup() {
      try {
        const res = await fetch('/api/marketing/popup');
        if (res.ok) {
          const data = await res.json();
          const p: PopupData = data.popup;

          if (!p || !p.ativo) return;

          // 1. Checar onde exibir
          if (p.onde_exibir === 'home' && pathname !== '/') return;
          if (p.onde_exibir === 'carrinho' && pathname !== '/carrinho') return;
          if (p.onde_exibir === 'produtos' && !pathname.startsWith('/produto/')) return;

          // 2. Checar Frequência
          if (p.frequencia === 'uma_vez_por_sessao') {
            if (sessionStorage.getItem('popup_exibido')) return;
          } else if (p.frequencia === 'uma_vez_por_dia') {
            const ultimo = localStorage.getItem('popup_exibido_timestamp');
            if (ultimo && Date.now() - parseInt(ultimo) < 86400000) return;
          }

          setPopup(p);

          // 3. Disparar Gatilho
          if (p.gatilho === 'imediato') {
            exibirModal(p);
          } else if (p.gatilho === 'saida') {
            const handleMouseLeave = (e: MouseEvent) => {
              if (e.clientY <= 0) {
                exibirModal(p);
                document.removeEventListener('mouseleave', handleMouseLeave);
              }
            };
            document.addEventListener('mouseleave', handleMouseLeave);
          } else {
            // Tempo (em segundos)
            const delayMs = (p.tempo_exibicao_segundos || 3) * 1000;
            const timer = setTimeout(() => {
              exibirModal(p);
            }, delayMs);
            return () => clearTimeout(timer);
          }
        }
      } catch {
        // Ignora erros
      }
    }

    carregarPopup();
  }, [pathname]);

  function exibirModal(p: PopupData) {
    setVisivel(true);
    try {
      if (p.frequencia === 'uma_vez_por_sessao') {
        sessionStorage.setItem('popup_exibido', 'true');
      } else if (p.frequencia === 'uma_vez_por_dia') {
        localStorage.setItem('popup_exibido_timestamp', Date.now().toString());
      }
    } catch {}
  }

  function fechar() {
    setVisivel(false);
  }

  if (!visivel || !popup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 transform animate-in zoom-in-95 duration-200">
        
        {/* Botão Fechar X */}
        <button
          type="button"
          onClick={fechar}
          className="absolute top-3 right-3 z-20 bg-black/60 hover:bg-black text-white p-2 rounded-full transition shadow-md cursor-pointer"
          title="Fechar"
        >
          <X size={18} />
        </button>

        {/* Banner com Foto se cadastrada */}
        {popup.imagem_url ? (
          <div>
            {popup.link_destino ? (
              <Link href={popup.link_destino} onClick={fechar}>
                <img
                  src={popup.imagem_url}
                  alt={popup.titulo || 'Promoção Exclusiva'}
                  className="w-full h-auto max-h-[75vh] object-cover hover:opacity-95 transition cursor-pointer"
                />
              </Link>
            ) : (
              <img
                src={popup.imagem_url}
                alt={popup.titulo || 'Promoção Exclusiva'}
                className="w-full h-auto max-h-[75vh] object-cover"
              />
            )}
          </div>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Sparkles size={24} />
            </div>
            {popup.titulo && <h2 className="text-2xl font-bold text-secondary">{popup.titulo}</h2>}
            {popup.subtitulo && <p className="text-sm text-gray-600">{popup.subtitulo}</p>}
            {popup.link_destino && (
              <Link
                href={popup.link_destino}
                onClick={fechar}
                className="inline-block bg-primary hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-md"
              >
                Aproveitar Agora
              </Link>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
