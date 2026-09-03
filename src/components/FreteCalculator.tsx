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
      setErro('CEP inválido. Digite 8 números.');
      return;
    }

    setLoading(true);
    setErro('');
    setResultado(null);

    try {
      // Validar CEP via ViaCEP
      const r = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await r.json();

      if (dados.erro) {
        setErro('CEP não encontrado. Verifique e tente novamente.');
        setLoading(false);
        return;
      }

      // Simulação de frete (integração real com Correios pode ser feita depois)
      await new Promise(res => setTimeout(res, 600));

      // Lógica simples: Sul/Sudeste = mais barato e rápido, outros = mais caro e demorado
      const uf = dados.uf;
      const sudesteSul = ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'];
      
      if (sudesteSul.includes(uf)) {
        setResultado({ prazo: '3 a 7 dias úteis', valor: 'Grátis acima de R$ 99 | Ou R$ 15,90' });
      } else {
        setResultado({ prazo: '7 a 15 dias úteis', valor: 'Grátis acima de R$ 149 | Ou R$ 24,90' });
      }
    } catch {
      setErro('Erro ao consultar o CEP. Tente novamente.');
    }

    setLoading(false);
  }

  return (
    <div className="border border-border rounded-xl p-4 bg-gray-50">
      <h4 className="font-bold text-secondary mb-3 flex items-center gap-2 text-sm">
        <Truck size={16} className="text-primary" />
        Calcular Frete
      </h4>
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
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          onKeyDown={e => e.key === 'Enter' && calcular()}
        />
        <button
          type="button"
          onClick={calcular}
          disabled={loading}
          className="bg-secondary text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-blue-900 transition disabled:opacity-50"
        >
          {loading ? '...' : 'OK'}
        </button>
      </div>

      {erro && <p className="text-red-500 text-xs mt-2">{erro}</p>}

      {resultado && (
        <div className="mt-3 bg-white border border-green-200 rounded-lg p-3">
          <p className="text-xs text-gray-500">Previsão de entrega:</p>
          <p className="font-bold text-secondary text-sm">{resultado.prazo}</p>
          <p className="text-xs text-gray-500 mt-1">Frete:</p>
          <p className="font-bold text-primary text-sm">{resultado.valor}</p>
        </div>
      )}

      <a
        href={`https://buscacepinter.correios.com.br/`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-500 hover:underline mt-2 inline-block"
      >
        Não sei meu CEP
      </a>
    </div>
  );
}
