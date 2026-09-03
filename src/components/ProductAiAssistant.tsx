'use client';

import { useState } from 'react';
import { Bot, Send, Sparkles, User } from 'lucide-react';

interface Props {
  produto: {
    nome: string;
    preco: number;
    preco_promocional?: number | null;
    descricao?: string | null;
    descricao_curta?: string | null;
    estoque?: number | null;
    tamanhos?: string[] | null;
  };
}

interface Mensagem {
  autor: 'user' | 'ia';
  texto: string;
}

export default function ProductAiAssistant({ produto }: Props) {
  const [pergunta, setPergunta] = useState('');
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<Mensagem[]>([
    {
      autor: 'ia',
      texto: `Olá! Sou o assistente virtual da loja. Como posso te ajudar com o "${produto.nome}"?`
    }
  ]);

  async function enviarPergunta(e: React.FormEvent) {
    e.preventDefault();
    if (!pergunta.trim() || loading) return;

    const textoUsuario = pergunta.trim();
    setPergunta('');
    setHistorico(prev => [...prev, { autor: 'user', texto: textoUsuario }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: textoUsuario, produto })
      });

      if (res.ok) {
        const data = await res.json();
        setHistorico(prev => [...prev, { autor: 'ia', texto: data.resposta }]);
      } else {
        const respostaLocal = gerarRespostaLocal(textoUsuario, produto);
        setHistorico(prev => [...prev, { autor: 'ia', texto: respostaLocal }]);
      }
    } catch {
      const respostaLocal = gerarRespostaLocal(textoUsuario, produto);
      setHistorico(prev => [...prev, { autor: 'ia', texto: respostaLocal }]);
    }

    setLoading(false);
  }

  return (
    <div className="border border-purple-200 bg-gradient-to-b from-purple-50/50 to-white rounded-2xl p-4 shadow-xs">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
          <Bot size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-secondary text-base md:text-lg flex items-center gap-1.5 leading-tight">
            Pergunte sobre o produto (IA)
            <Sparkles size={16} className="text-purple-600 animate-pulse" />
          </h3>
        </div>
      </div>

      {/* Histórico de Conversa com Fontes Ampliadas */}
      <div className="space-y-2.5 max-h-44 overflow-y-auto mb-3 p-3 bg-white border border-purple-100 rounded-xl">
        {historico.map((m, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 text-xs md:text-sm ${
              m.autor === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                m.autor === 'user' ? 'bg-secondary text-white' : 'bg-purple-600 text-white'
              }`}
            >
              {m.autor === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>
            <div
              className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                m.autor === 'user'
                  ? 'bg-secondary text-white rounded-tr-none font-medium'
                  : 'bg-purple-50 text-gray-800 border border-purple-100 rounded-tl-none font-medium'
              }`}
            >
              {m.texto}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs md:text-sm text-purple-600 italic">
            <Sparkles size={14} className="animate-spin" /> Pensando na resposta...
          </div>
        )}
      </div>

      {/* Formulário de Pergunta */}
      <form onSubmit={enviarPergunta} className="flex gap-2">
        <input
          type="text"
          value={pergunta}
          onChange={e => setPergunta(e.target.value)}
          placeholder="Ex: Serve para pet pequeno?"
          className="flex-1 border border-purple-200 rounded-xl px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium"
        />
        <button
          type="submit"
          disabled={loading || !pergunta.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
        >
          <span>Perguntar</span>
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}

function gerarRespostaLocal(pergunta: string, prod: Props['produto']): string {
  const q = pergunta.toLowerCase();
  const val = prod.preco_promocional || prod.preco;

  if (q.includes('preço') || q.includes('quanto custa') || q.includes('valor')) {
    return `O preço atual é R$ ${Number(val).toFixed(2).replace('.', ',')}.`;
  }
  if (q.includes('estoque') || q.includes('disponível')) {
    return `Temos unidades em estoque com envio rápido!`;
  }
  return `O "${prod.nome}" é seguro e próprio para estética pet!`;
}
