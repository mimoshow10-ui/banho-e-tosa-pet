'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, HelpCircle } from 'lucide-react';

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

const SUGESTOES = [
  '🚚 Qual o prazo de entrega?',
  '🛡️ É seguro para o pet?',
  '📦 Tem a pronta entrega?',
  '🏷️ Tem desconto ou promoção?'
];

export default function ProductAiAssistant({ produto }: Props) {
  const [pergunta, setPergunta] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [historico, setHistorico] = useState<Mensagem[]>([
    {
      autor: 'ia',
      texto: `Olá! Sou o assistente virtual da loja. Como posso te ajudar com o "${produto.nome}"?`
    }
  ]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [historico, loading]);

  async function processarPergunta(textoPergunta: string) {
    if (!textoPergunta.trim() || loading) return;

    const textoUsuario = textoPergunta.trim();
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    processarPergunta(pergunta);
  }

  return (
    <div className="border border-purple-200 bg-gradient-to-b from-purple-50/60 to-white rounded-2xl p-4 shadow-xs">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8.5 h-8.5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
          <Bot size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-secondary text-base md:text-lg flex items-center gap-1.5 leading-tight">
            Tire suas dúvidas (IA)
            <Sparkles size={16} className="text-purple-600 animate-pulse" />
          </h3>
          <p className="text-[11px] md:text-xs text-purple-700 font-medium">
            Respostas instantâneas sobre este produto
          </p>
        </div>
      </div>

      {/* Sugestões de Perguntas Rápidas */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
        {SUGESTOES.map((sugestao, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => processarPergunta(sugestao.replace(/^[\p{Emoji}\s]+/u, ''))}
            disabled={loading}
            className="whitespace-nowrap text-[11px] md:text-xs font-semibold bg-white text-purple-800 border border-purple-200 hover:bg-purple-600 hover:text-white px-2.5 py-1 rounded-full transition shadow-2xs cursor-pointer flex items-center gap-1"
          >
            {sugestao}
          </button>
        ))}
      </div>

      {/* Histórico de Conversa */}
      <div
        ref={chatContainerRef}
        className="space-y-2.5 max-h-48 overflow-y-auto mb-3 p-3 bg-white border border-purple-100 rounded-xl"
      >
        {historico.map((m, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 text-xs md:text-sm ${
              m.autor === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-6.5 h-6.5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                m.autor === 'user' ? 'bg-secondary text-white' : 'bg-purple-600 text-white'
              }`}
            >
              {m.autor === 'user' ? <User size={13} /> : <Bot size={13} />}
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
          <div className="flex items-center gap-2 text-xs md:text-sm text-purple-600 font-semibold italic p-1">
            <Sparkles size={14} className="animate-spin" /> Digitando resposta...
          </div>
        )}
      </div>

      {/* Formulário de Pergunta */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={pergunta}
          onChange={e => setPergunta(e.target.value)}
          placeholder="Ex: Serve para cão pequeno?"
          className="flex-1 border border-purple-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium shadow-2xs"
        />
        <button
          type="submit"
          disabled={loading || !pergunta.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs cursor-pointer"
        >
          <span>Enviar</span>
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}

function gerarRespostaLocal(pergunta: string, prod: Props['produto']): string {
  const q = pergunta.toLowerCase();
  const val = prod.preco_promocional || prod.preco;
  const precoStr = `R$ ${Number(val).toFixed(2).replace('.', ',')}`;

  if (q.includes('preço') || q.includes('quanto custa') || q.includes('valor')) {
    return `O valor atual do "${prod.nome}" é ${precoStr}.`;
  }
  if (q.includes('estoque') || q.includes('disponível') || q.includes('pronta')) {
    return `Temos o "${prod.nome}" disponível em estoque para pronta entrega!`;
  }
  if (q.includes('frete') || q.includes('entrega') || q.includes('prazo')) {
    return `Digitando seu CEP no campo de frete acima você calcula o prazo exato de entrega para a sua cidade!`;
  }
  if (q.includes('seguro') || q.includes('material') || q.includes('eva')) {
    return `Todos os nossos produtos são atóxicos e projetados para total segurança no banho e tosa!`;
  }
  return `O "${prod.nome}" (${precoStr}) é um excelente item para estética pet. Se precisar de mais informações, estamos à disposição!`;
}

