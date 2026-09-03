'use client'

import { useState } from 'react';
import { Truck } from 'lucide-react';

export default function FreteCalculator() {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ prazo: string; valor: string } | null>(null);
  const [erro, setErro] = useState('');

  async function calcular() {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setErro('CEP inválido.');
      return;
    }

    setLoading(true);
    setErro('');
    setResultado(null);

    try {
      const r = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await r.json();

      if (dados.erro) {
        setErro('CEP não encontrado.');
        setLoading(false);
        return;
      }

      await new Promise(res => setTimeout(res, 400));
      const uf = dados.uf;
      const sudesteSul = ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'];
      
      if (sudesteSul.includes(uf)) {
        setResultado({ prazo: '3 a 7 dias úteis', valor: 'Grátis acima de R$ 99 | Ou R$ 15,90' });
      } else {
        setResultado({ prazo: '7 a 15 dias úteis', valor: 'Grátis acima de R$ 149 | Ou R$ 24,90' });
      }
    } catch {
      setErro('Erro ao consultar o CEP.');
    }

    setLoading(false);
  }

  return (
    <div className="border border-border rounded-xl p-3 bg-gray-50/70">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-secondary flex items-center gap-1.5 text-xs">
          <Truck size={14} className="text-primary" />
          Calcular Frete e Prazo
        </h4>
        <a
          href="https://buscacepinter.correios.com.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-blue-500 hover:underline"
        >
          Não sei meu CEP
        </a>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={cep}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 8);
            setCep(v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v);
            setResultado(null);
            setErro('');
          }}
          placeholder="00000-000"
          maxLength={9}
          className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          onKeyDown={e => e.key === 'Enter' && calcular()}
        />
        <button
          type="button"
          onClick={calcular}
          disabled={loading}
          className="bg-secondary text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-blue-900 transition disabled:opacity-50"
        >
          {loading ? '...' : 'OK'}
        </button>
      </div>

      {erro && <p className="text-red-500 text-[11px] mt-1">{erro}</p>}

      {resultado && (
        <div className="mt-2 bg-white border border-green-200 rounded-lg p-2 text-xs">
          <p className="text-[10px] text-gray-400">Previsão de entrega: <strong className="text-secondary">{resultado.prazo}</strong></p>
          <p className="text-[10px] text-gray-400">Frete: <strong className="text-primary">{resultado.valor}</strong></p>
        </div>
      )}
    </div>
  );
}
