'use client';

import { useState } from 'react';
import { Sparkles, Wand2, RefreshCw, CheckCircle2, X } from 'lucide-react';

interface Props {
  onGerado: (url: string) => void;
}

export default function GeradorBannerIAModal({ onGerado }: Props) {
  const [aberto, setAberto] = useState(false);
  const [promptTema, setPromptTema] = useState('');
  const [tipoSelecao, setTipoSelecao] = useState('desconto');
  const [carregando, setCarregando] = useState(false);
  const [imagemGerada, setImagemGerada] = useState<string | null>(null);

  async function gerarComIA() {
    setCarregando(true);
    setImagemGerada(null);

    try {
      const res = await fetch('/api/admin/gerar-banner-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: promptTema, tipo: tipoSelecao }),
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setImagemGerada(data.url);
      }
    } catch {}
    finally {
      setCarregando(false);
    }
  }

  function aplicarEFechar() {
    if (imagemGerada) {
      onGerado(imagemGerada);
      setAberto(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
        title="Gerar banner promocional automaticamente com Inteligência Artificial"
      >
        <Sparkles size={14} className="text-amber-300 animate-pulse" />
        <span>Gerar com I.A.</span>
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-6">
            
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Wand2 size={22} />
              </div>
              <div>
                <h3 className="font-bold text-secondary text-lg">Gerador de Banners com I.A.</h3>
                <p className="text-xs text-gray-500">Crie artes de pop-up e banners promocionais em segundos.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Qual o tema do Banner / Pop-up?</label>
                <input
                  type="text"
                  value={promptTema}
                  onChange={(e) => setPromptTema(e.target.value)}
                  placeholder="Ex: Cupom de 10% OFF para Coleção de Lacinhos Pet"
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Estilo Promocional Desejado</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoSelecao('desconto')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer ${
                      tipoSelecao === 'desconto' ? 'border-purple-600 bg-purple-50 text-purple-900' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    🎟️ Cupons & OFF
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoSelecao('frete')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer ${
                      tipoSelecao === 'frete' ? 'border-purple-600 bg-purple-50 text-purple-900' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    🚚 Frete Grátis
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoSelecao('acessorios')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer ${
                      tipoSelecao === 'acessorios' ? 'border-purple-600 bg-purple-50 text-purple-900' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    🎀 Acessórios Pet
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={gerarComIA}
                disabled={carregando}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {carregando ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Gerando Arte com I.A...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Criar Arte do Banner com I.A.</span>
                  </>
                )}
              </button>

              {imagemGerada && (
                <div className="space-y-3 pt-2 animate-in fade-in">
                  <div className="w-full h-48 bg-gray-100 rounded-2xl overflow-hidden border border-purple-200 shadow-sm relative">
                    <img src={imagemGerada} alt="Banner Gerado" className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={aplicarEFechar}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Usar Esta Imagem no Pop-up</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
