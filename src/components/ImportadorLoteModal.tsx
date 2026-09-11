'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, X, PackagePlus, Check, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ItemResultado {
  sku: string;
  status: 'sucesso' | 'erro';
  mensagem?: string;
  nome?: string;
}

export default function ImportadorLoteModal() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [skusTexto, setSkusTexto] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Estados de progresso em tempo real
  const [totalItens, setTotalItens] = useState(0);
  const [processadosCount, setProcessadosCount] = useState(0);
  const [sucessosCount, setSucessosCount] = useState(0);
  const [errosCount, setErrosCount] = useState(0);
  const [itensResultado, setItensResultado] = useState<ItemResultado[]>([]);
  const [skuAtual, setSkuAtual] = useState<string>('');

  function lerArquivoCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const conteudo = evt.target?.result as string;
      if (conteudo) {
        setSkusTexto(conteudo);
      }
    };
    reader.readAsText(file);
  }

  async function iniciarImportacao() {
    if (!skusTexto.trim()) return;

    const skusArray = Array.from(
      new Set(
        skusTexto
          .split(/[\r\n,;\t]+/)
          .map(s => s.trim())
          .filter(Boolean)
      )
    );

    if (skusArray.length === 0) return;

    // Resetar estados
    setCarregando(true);
    setTotalItens(skusArray.length);
    setProcessadosCount(0);
    setSucessosCount(0);
    setErrosCount(0);
    setItensResultado([]);

    // Processa os SKUs um a um (ou em pares) para evitar timeout do servidor
    for (let i = 0; i < skusArray.length; i++) {
      const currentSku = skusArray[i];
      setSkuAtual(currentSku);

      try {
        const res = await fetch('/api/admin/importar-lote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skus: [currentSku] }),
        });

        const data = await res.json();
        
        let itemResult: ItemResultado;
        if (data.resultados && data.resultados.length > 0) {
          itemResult = data.resultados[0];
        } else if (data.erro) {
          itemResult = { sku: currentSku, status: 'erro', mensagem: data.erro };
        } else {
          itemResult = { sku: currentSku, status: 'erro', mensagem: 'Resposta desconhecida' };
        }

        setItensResultado(prev => [itemResult, ...prev]);

        if (itemResult.status === 'sucesso') {
          setSucessosCount(prev => prev + 1);
        } else {
          setErrosCount(prev => prev + 1);
        }
      } catch (err: any) {
        const errItem: ItemResultado = {
          sku: currentSku,
          status: 'erro',
          mensagem: err.message || 'Falha de conexão com o servidor'
        };
        setItensResultado(prev => [errItem, ...prev]);
        setErrosCount(prev => prev + 1);
      }

      setProcessadosCount(i + 1);
    }

    setCarregando(false);
    setSkuAtual('');
    router.refresh();
  }

  const porcentagem = totalItens > 0 ? Math.round((processadosCount / totalItens) * 100) : 0;

  return (
    <>
      {/* Botão de Abertura do Modal */}
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="bg-secondary hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition shadow-sm cursor-pointer"
      >
        <PackagePlus size={18} />
        <span>Importar em Lote (CSV / Vários SKUs)</span>
      </button>

      {/* Modal Overlay */}
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Fechar */}
            <button
              type="button"
              disabled={carregando}
              onClick={() => setAberto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition cursor-pointer disabled:opacity-30"
            >
              <X size={20} />
            </button>

            <div>
              <h2 className="text-2xl font-bold text-secondary flex items-center gap-2">
                <PackagePlus className="text-primary" />
                Importação de Produtos em Lote
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Cole a lista de SKUs do Bling ou envie um arquivo CSV/TXT para cadastrar múltiplos produtos em tempo real sem erros de timeout.
              </p>
            </div>

            {/* Opção 1: Upload de Arquivo CSV / TXT */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-300 space-y-2">
              <label className="block text-xs font-bold text-gray-700 flex items-center gap-2 cursor-pointer">
                <FileText size={16} className="text-primary" />
                <span>Carregar arquivo CSV ou TXT (Opcional)</span>
              </label>
              <input
                type="file"
                disabled={carregando}
                accept=".csv, .txt"
                onChange={lerArquivoCSV}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-orange-600 cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* Opção 2: Área de Texto para Múltiplos SKUs */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                Cole a lista de SKUs (Separados por vírgula, espaço ou quebra de linha):
              </label>
              <textarea
                rows={5}
                disabled={carregando}
                value={skusTexto}
                onChange={(e) => setSkusTexto(e.target.value)}
                placeholder="Exemplo:&#10;MS5153-H7&#10;SKU-GRAVATA-01&#10;SKU-LACINHO-P&#10;SKU-BANDANA-G"
                className="w-full border border-gray-300 rounded-2xl p-3 text-xs font-mono font-bold text-gray-800 bg-white focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Barra de Progresso em Tempo Real */}
            {totalItens > 0 && (
              <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                  <span className="flex items-center gap-2">
                    {carregando && <RefreshCw size={14} className="animate-spin text-primary" />}
                    <span>{carregando ? `Processando item ${processadosCount} de ${totalItens}...` : 'Importação Finalizada!'}</span>
                  </span>
                  <span className="font-mono text-primary font-black">{porcentagem}%</span>
                </div>

                {/* Progress bar fill */}
                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300 rounded-full"
                    style={{ width: `${porcentagem}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-1">
                  <div className="flex gap-2">
                    <span className="bg-green-600 text-white px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                      <Check size={12} /> {sucessosCount} Sucessos
                    </span>
                    {errosCount > 0 && (
                      <span className="bg-red-600 text-white px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                        <AlertTriangle size={12} /> {errosCount} Erros
                      </span>
                    )}
                  </div>
                  {skuAtual && (
                    <span className="text-gray-500 text-[11px] font-mono truncate max-w-[200px]">
                      Atual: <strong className="text-secondary">{skuAtual}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Detalhamento em Tempo Real por Item */}
            {itensResultado.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-gray-700">Resultado dos Itens:</h4>
                <div className="max-h-44 overflow-y-auto space-y-1.5 border border-gray-200 rounded-2xl p-3 bg-gray-50 text-xs">
                  {itensResultado.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-100 shadow-2xs">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-gray-800">{r.sku}</span>
                        {r.nome && <span className="text-[10px] text-gray-500 truncate max-w-[300px]">{r.nome}</span>}
                      </div>
                      <span className={`font-bold flex items-center gap-1 text-[11px] ${r.status === 'sucesso' ? 'text-green-600' : 'text-red-500'}`}>
                        {r.status === 'sucesso' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        {r.mensagem || (r.status === 'sucesso' ? 'Importado com Sucesso' : 'Erro')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botão de Disparo */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={carregando}
                onClick={() => setAberto(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
              >
                {carregando ? 'Aguarde...' : 'Fechar'}
              </button>
              
              <button
                type="button"
                onClick={iniciarImportacao}
                disabled={carregando || !skusTexto.trim()}
                className="bg-primary hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {carregando ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Processando ({processadosCount}/{totalItens})...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Iniciar Importação em Lote</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
