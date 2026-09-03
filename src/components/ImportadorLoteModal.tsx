'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, X, PackagePlus } from 'lucide-react';

export default function ImportadorLoteModal() {
  const [aberto, setAberto] = useState(false);
  const [skusTexto, setSkusTexto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

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

    setCarregando(true);
    setResultado(null);

    try {
      const res = await fetch('/api/admin/importar-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textoCsv: skusTexto }),
      });

      const data = await res.json();
      setResultado(data);
    } catch {
      setResultado({ erro: 'Falha de comunicação com o servidor.' });
    } finally {
      setCarregando(false);
    }
  }

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
              onClick={() => setAberto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div>
              <h2 className="text-2xl font-bold text-secondary flex items-center gap-2">
                <PackagePlus className="text-primary" />
                Importação de Produtos em Lote
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Cole a lista de SKUs do Bling ou envie um arquivo CSV/TXT para cadastrar múltiplos produtos de uma só vez.
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
                accept=".csv, .txt"
                onChange={lerArquivoCSV}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-orange-600 cursor-pointer"
              />
            </div>

            {/* Opção 2: Área de Texto para Múltiplos SKUs */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                Cole a lista de SKUs (Separados por vírgula, espaço ou quebra de linha):
              </label>
              <textarea
                rows={6}
                value={skusTexto}
                onChange={(e) => setSkusTexto(e.target.value)}
                placeholder="Exemplo:&#10;MS5153-H7&#10;SKU-GRAVATA-01&#10;SKU-LACINHO-P&#10;SKU-BANDANA-G"
                className="w-full border border-gray-300 rounded-2xl p-3 text-xs font-mono font-bold text-gray-800 bg-white focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Botão de Disparo */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancelar
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
                    <span>Processando Lote...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Iniciar Importação em Lote</span>
                  </>
                )}
              </button>
            </div>

            {/* Resultado da Importação */}
            {resultado && (
              <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in">
                {resultado.erro ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span>{resultado.erro}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <CheckCircle2 size={20} className="text-green-600" />
                        <span>Lote Concluído! Total: {resultado.total} SKUs</span>
                      </div>
                      <div className="flex gap-2 text-xs font-black">
                        <span className="bg-green-600 text-white px-2.5 py-1 rounded-full">{resultado.sucessos} Sucessos</span>
                        {resultado.erros > 0 && <span className="bg-red-600 text-white px-2.5 py-1 rounded-full">{resultado.erros} Erros</span>}
                      </div>
                    </div>

                    {/* Detalhamento por Item */}
                    {resultado.resultados && (
                      <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200 rounded-2xl p-3 bg-gray-50 text-xs">
                        {resultado.resultados.map((r: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-100">
                            <span className="font-mono font-bold text-gray-800">{r.sku}</span>
                            <span className={`font-bold flex items-center gap-1 ${r.status === 'sucesso' ? 'text-green-600' : 'text-red-500'}`}>
                              {r.status === 'sucesso' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                              {r.mensagem}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
