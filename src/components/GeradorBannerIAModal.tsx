'use client';

import { useState } from 'react';
import { Sparkles, Wand2, RefreshCw, CheckCircle2, X } from 'lucide-react';

interface Props {
  onGerado: (url: string) => void;
}

const SUGESTOES_TEMAS = [
  '🎀 Lacinhos e Gravatinhas Pet',
  '🎃 Coleção de Halloween Pet',
  '🐱 Produtos e Brinquedos para Gatos',
  '🐶 Acessórios de Banho e Tosa',
  '🎄 Especial Promocional de Natal',
  '🚚 Banner de Frete Grátis',
];

export default function GeradorBannerIAModal({ onGerado }: Props) {
  const [aberto, setAberto] = useState(false);
  const [promptTema, setPromptTema] = useState('');
  const [tipoSelecao, setTipoSelecao] = useState('desconto');
  const [carregando, setCarregando] = useState(false);
  const [imagemGerada, setImagemGerada] = useState<string | null>(null);

  async function gerarComIA() {
    setCarregando(true);

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
        title="Gerar banner promocional automaticamente com Inteligência Artificial baseada no seu tema"
      >
        <Sparkles size={14} className="text-amber-300 animate-pulse" />
        <span>Gerar com I.A.</span>
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] overflow-y-auto">
            
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
                <h3 className="font-bold text-secondary text-lg">Gerador Temático com I.A.</h3>
                <p className="text-xs text-gray-500">Gere imagens promocionais exclusivas criadas sob medida para seu tema.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Qual o tema ou produto do Banner / Pop-up?
                </label>
                <input
                  type="text"
                  value={promptTema}
                  onChange={(e) => setPromptTema(e.target.value)}
                  placeholder="Digite o tema desejado (Ex: Lacinhos de Halloween, Produtos de Gato, Banho e Tosa...)"
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Sugestões rápidas de temas */}
              <div>
                <span className="block text-[11px] font-semibold text-gray-500 mb-1.5">Sugestões de Temas Rápidos:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGESTOES_TEMAS.map((sugestao) => (
                    <button
                      key={sugestao}
                      type="button"
                      onClick={() => setPromptTema(sugestao)}
                      className="text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-200 transition cursor-pointer"
                    >
                      {sugestao}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Estilo Promocional</label>
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
                    <span>Desenhando com Inteligência Artificial...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Gerar Arte do Tema com I.A.</span>
                  </>
                )}
              </button>

              {imagemGerada && (
                <div className="space-y-3 pt-2 animate-in fade-in">
                  <div className="w-full h-52 bg-gray-900 rounded-2xl overflow-hidden border border-purple-200 shadow-md relative group">
                    <img
                      src={imagemGerada}
                      alt="Banner Gerado por IA"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={gerarComIA}
                      disabled={carregando}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={14} className={carregando ? 'animate-spin' : ''} />
                      <span>Gerar Outra Opção</span>
                    </button>
                    <button
                      type="button"
                      onClick={aplicarEFechar}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={16} />
                      <span>Usar no Pop-up</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
