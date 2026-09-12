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
  const q = pergunta.toLowerCase().trim();
  const nome = prod.nome || 'Produto';
  const val = prod.preco_promocional || prod.preco;
  const precoStr = `R$ ${Number(val).toFixed(2).replace('.', ',')}`;
  const descClean = (prod.descricao_curta || prod.descricao || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

  const qtdMatch = (nome + ' ' + descClean).match(/(?:kit|pct|pacote|jogo)?\s*(?:c\/|com)?\s*(\d+)\s*(?:unidades|unidade|un|peças|pcs|laços|gravatas|adesivos|pares|par)?/i);
  const quantidade = qtdMatch ? qtdMatch[1] : null;

  const matMatch = (nome + ' ' + descClean).match(/(eva glitter|eva|cetim|feltro|silicone|algodão|tecido|pelúcia|couro|nylon)/i);
  const material = matMatch ? matMatch[1].toUpperCase() : null;

  const fixMatch = (nome + ' ' + descClean).match(/(adesivo|autocolante|elástico|elastico|anilha|fita de cetim|fita|presilha|tic-tac|velcro)/i);
  const fixacao = fixMatch ? fixMatch[1].toLowerCase() : null;

  if (q.includes('quantos') || q.includes('quantidade') || q.includes('vem') || q.includes('pacote') || q.includes('kit') || q.includes('unidade')) {
    if (quantidade) {
      return `Este produto ("${nome}") vem com ${quantidade} unidade(s) na embalagem! 📦`;
    }
    return `O item "${nome}" refere-se à quantidade do anúncio/opção selecionada. Você pode escolher a quantidade no carrinho! 📦`;
  }

  if (q.includes('material') || q.includes('feito') || q.includes('eva') || q.includes('glitter') || q.includes('atóxico') || q.includes('atoxico')) {
    if (material) {
      return `O "${nome}" é fabricado em ${material}, garantindo um produto super leve, durável e 100% atóxico. 🛡️`;
    }
    return `O "${nome}" é fabricado com materiais atóxicos de excelente qualidade para banho e tosa. 🛡️`;
  }

  if (q.includes('como usar') || q.includes('como aplicar') || q.includes('fixar') || q.includes('prender') || q.includes('adesivo') || q.includes('elástico')) {
    if (fixacao === 'adesivo' || fixacao === 'autocolante') {
      return `O "${nome}" é autocolante! Retire a fita de proteção e aplique diretamente nos pelos limpos e secos do pet. ✨`;
    }
    if (fixacao === 'elástico' || fixacao === 'elastico' || fixacao === 'anilha') {
      return `O "${nome}" acompanha anilha elástica de silicone para fixação prática no pelo do pet! 🎀`;
    }
    return `Aplique o "${nome}" sobre a pelagem limpa e seca do pet para um acabamento perfeito ao finalizar o banho e tosa! ✨`;
  }

  if (q.includes('preço') || q.includes('quanto custa') || q.includes('valor') || q.includes('promoção') || q.includes('desconto')) {
    return `O valor atual do "${nome}" é de ${precoStr}. ✨`;
  }

  if (q.includes('frete') || q.includes('entrega') || q.includes('prazo') || q.includes('envio')) {
    return `Postamos nos Correios/transportadora em até 24h úteis! Digite seu CEP no campo de frete acima para ver prazos exatos! 🚚`;
  }

  if (descClean.length > 20) {
    return `Sobre "${nome}": ${descClean.slice(0, 160)}... Preço: ${precoStr}.`;
  }

  return `O "${nome}" (${precoStr}) é um excelente item para estética pet. ${material ? `Fabricado em ${material}. ` : ''}Estamos à disposição para dúvidas! 🐾`;
}


