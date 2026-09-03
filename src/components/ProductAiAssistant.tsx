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
    marca?: string | null;
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
        body: JSON.stringify({
          pergunta: textoUsuario,
          produto
        })
      });

      if (res.ok) {
        const data = await res.json();
        setHistorico(prev => [...prev, { autor: 'ia', texto: data.resposta }]);
      } else {
        // Fallback local se a rota falhar
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
    <div className="border border-purple-200 bg-gradient-to-b from-purple-50/50 to-white rounded-2xl p-5 shadow-sm mt-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-sm">
          <Bot size={18} />
        </div>
        <div>
          <h3 className="font-bold text-secondary text-sm flex items-center gap-1.5">
            Pergunte sobre este Produto
            <Sparkles size={14} className="text-purple-600 animate-pulse" />
          </h3>
          <p className="text-xs text-gray-500">Nossa IA responde suas dúvidas sobre este item em segundos.</p>
        </div>
      </div>

      {/* Histórico de Conversa */}
      <div className="space-y-3 max-h-60 overflow-y-auto mb-4 p-3 bg-white border border-purple-100 rounded-xl">
        {historico.map((m, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 text-xs ${
              m.autor === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${
                m.autor === 'user' ? 'bg-secondary text-white' : 'bg-purple-600 text-white'
              }`}
            >
              {m.autor === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>
            <div
              className={`p-2.5 rounded-xl max-w-[80%] leading-relaxed ${
                m.autor === 'user'
                  ? 'bg-secondary text-white rounded-tr-none'
                  : 'bg-purple-50 text-gray-800 border border-purple-100 rounded-tl-none'
              }`}
            >
              {m.texto}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-purple-600 italic p-1">
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
          placeholder="Ex: Do que é feito? Serve para pet pequeno?"
          className="flex-1 border border-purple-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
        />
        <button
          type="submit"
          disabled={loading || !pergunta.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
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
  const desc = (prod.descricao || prod.descricao_curta || '').toLowerCase();

  if (q.includes('preço') || q.includes('quanto custa') || q.includes('valor')) {
    const val = prod.preco_promocional || prod.preco;
    return `O preço atual do "${prod.nome}" é R$ ${Number(val).toFixed(2).replace('.', ',')}.`;
  }

  if (q.includes('estoque') || q.includes('tem disponível') || q.includes('pronta entrega')) {
    return prod.estoque && prod.estoque > 0
      ? `Sim! Temos ${prod.estoque} unidades disponíveis em estoque para envio imediato.`
      : `No momento este produto está com poucas unidades em estoque. Garanta o seu antes que acabe!`;
  }

  if (q.includes('tamanho') || q.includes('medida') || q.includes('dimensao')) {
    if (prod.tamanhos && prod.tamanhos.length > 0) {
      return `Os tamanhos disponíveis para este produto são: ${prod.tamanhos.join(', ')}.`;
    }
    return `As especificações de tamanho encontram-se descritas na ficha técnica do produto.`;
  }

  if (desc) {
    if (q.includes('material') || q.includes('do que é feito') || q.includes('eva') || q.includes('tecido')) {
      if (desc.includes('eva')) return `Este produto é produzido em EVA de alta qualidade, super leve e seguro para o pet.`;
      if (desc.includes('cetim') || desc.includes('fita')) return `Produzido com materiais confortáveis e acabamento especial para uso pet.`;
    }
  }

  return `O "${prod.nome}" é perfeito para o seu pet! Ele é enviado em embalagem protegida com envio rápido. Caso precise de mais detalhes específicos, pode nos chamar também no chat!`;
}
