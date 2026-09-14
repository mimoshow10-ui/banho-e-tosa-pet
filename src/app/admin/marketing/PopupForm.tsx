'use client';

import { useState } from 'react';
import { salvarPopup } from './actions';
import PopupImageFieldWithAI from '@/components/PopupImageFieldWithAI';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  popup: {
    ativo: boolean;
    imagem_url: string;
    link_destino: string;
    titulo: string;
    subtitulo: string;
    gatilho: string;
    tempo_exibicao_segundos: number;
    onde_exibir: string;
    frequencia: string;
  };
}

export default function PopupForm({ popup }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await salvarPopup(formData);
      if (res?.sucesso) {
        setMsg({ tipo: 'sucesso', texto: res.mensagem || 'Pop-up salvo com sucesso!' });
      } else {
        setMsg({ tipo: 'erro', texto: res?.erro || 'Erro ao salvar Pop-up.' });
      }
    } catch (err: any) {
      setMsg({ tipo: 'erro', texto: err.message || 'Erro de comunicação.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-purple-600" />
          <h2 className="text-lg font-bold text-secondary">3. Pop-up Promocional Modal</h2>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${popup.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
          {popup.ativo ? 'POP-UP ATIVO' : 'INATIVO'}
        </span>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 ${
            msg.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          {msg.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{msg.texto}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Ativo/Inativo */}
        <div className="flex items-center gap-2 md:col-span-2 bg-purple-50 p-3.5 rounded-xl border border-purple-100">
          <input
            id="popup_ativo"
            name="ativo"
            type="checkbox"
            defaultChecked={popup.ativo}
            className="w-4 h-4 accent-purple-600 cursor-pointer"
          />
          <label htmlFor="popup_ativo" className="text-sm font-bold text-purple-950 cursor-pointer">
            Ativar Pop-up Promocional na Loja
          </label>
        </div>

        {/* Imagem do Pop-up com Gerador de I.A. */}
        <div className="md:col-span-2">
          <PopupImageFieldWithAI initialUrl={popup.imagem_url || ''} />
        </div>

        {/* Link de Destino ao Clicar no Pop-up */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Link de Destino ao Clicar no Pop-up (Opcional)
          </label>
          <input
            name="link_destino"
            type="text"
            defaultValue={popup.link_destino || ''}
            placeholder="Ex: /categoria/lacinhos ou /produto/nome-do-produto"
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white font-medium"
          />
        </div>

        {/* Título e Subtítulo Alternativo */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Título Alternativo (Sem imagem)</label>
          <input
            name="titulo"
            type="text"
            defaultValue={popup.titulo || ''}
            placeholder="Ex: Ganhe 10% OFF na 1ª compra!"
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Subtítulo / Descrição Alternativa</label>
          <input
            name="subtitulo"
            type="text"
            defaultValue={popup.subtitulo || ''}
            placeholder="Ex: Use o cupom BEMVINDO10 no carrinho."
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white"
          />
        </div>

        {/* Gatilhos de Exibição */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Gatilho de Exibição (Quando Abrir?)</label>
          <select name="gatilho" defaultValue={popup.gatilho || 'tempo'} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white font-bold cursor-pointer">
            <option value="tempo">Após X Segundos na página</option>
            <option value="imediato">Imediato (Ao carregar a página)</option>
            <option value="saida">Ao tentar sair do site (Exit Intent)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Tempo de Espera (Segundos)</label>
          <input
            name="tempo_exibicao_segundos"
            type="number"
            defaultValue={popup.tempo_exibicao_segundos || 3}
            placeholder="Ex: 3"
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white"
          />
        </div>

        {/* Onde Exibir */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Onde Exibir o Pop-up?</label>
          <select name="onde_exibir" defaultValue={popup.onde_exibir || 'home'} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white cursor-pointer font-bold">
            <option value="home">Somente na Página Inicial (Home)</option>
            <option value="todas">Em todas as páginas da loja</option>
            <option value="carrinho">Somente na página de Carrinho</option>
            <option value="produtos">Somente nas páginas de Produtos</option>
          </select>
        </div>

        {/* Frequência */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Frequência para o Cliente</label>
          <select name="frequencia" defaultValue={popup.frequencia || 'uma_vez_por_sessao'} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white cursor-pointer font-bold">
            <option value="uma_vez_por_sessao">1 vez por sessão (Recomendado)</option>
            <option value="uma_vez_por_dia">1 vez por dia (24h)</option>
            <option value="sempre">Sempre que navegar</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition md:col-span-2 shadow-sm mt-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles size={18} />
          <span>{loading ? 'Salvando Pop-up...' : 'Salvar Pop-up Promocional'}</span>
        </button>
      </form>
    </div>
  );
}
