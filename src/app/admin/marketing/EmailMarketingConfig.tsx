'use client';

import { useState } from 'react';
import {
  Mail,
  Tag,
  Calendar,
  Upload,
  Image as ImageIcon,
  Send,
  CheckCircle2,
  Sparkles,
  Percent,
  Clock,
  User,
  Eye,
  Check,
  AlertCircle,
  Layers,
} from 'lucide-react';

interface EmailConfig {
  ativo: boolean;
  desconto_valor: number;
  desconto_tipo: 'percentual' | 'fixo';
  validade_dias: number;
  banner_url: string;
  assunto: string;
  mensagem: string;
}

interface EmailLog {
  id: string;
  cliente_nome: string;
  cliente_email: string;
  pedido_id: string;
  cupom_codigo: string;
  desconto_texto: string;
  data_envio: string;
  validade_ate: string;
  status: string;
}

interface Props {
  config: EmailConfig;
  logs: EmailLog[];
  salvarConfigAction: (formData: FormData) => Promise<void>;
  dispararTesteAction: (formData: FormData) => Promise<void>;
}

export default function EmailMarketingConfig({
  config,
  logs,
  salvarConfigAction,
  dispararTesteAction,
}: Props) {
  const [ativo, setAtivo] = useState(config?.ativo ?? true);
  const [descontoValor, setDescontoValor] = useState(config?.desconto_valor?.toString() || '10');
  const [descontoTipo, setDescontoTipo] = useState<'percentual' | 'fixo'>(config?.desconto_tipo || 'percentual');
  const [validadeDias, setValidadeDias] = useState(config?.validade_dias?.toString() || '15');
  const [bannerUrl, setBannerUrl] = useState(config?.banner_url || '');
  const [assunto, setAssunto] = useState(
    config?.assunto || 'Obrigado por sua compra na Mimo Show Pet! Ganhe 10% OFF na próxima compra 🐾'
  );
  const [mensagem, setMensagem] = useState(
    config?.mensagem ||
      'Ficamos muito felizes em atender você e seu pet! Como forma de agradecimento, preparamos um presente exclusivo para seu próximo pedido.'
  );

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  // Calcula a data de validade de exemplo
  const exValidadeDate = new Date(Date.now() + (parseInt(validadeDias || '15') * 86400 * 1000));
  const exValidadeStr = exValidadeDate.toLocaleDateString('pt-BR');

  const [loadingTest, setLoadingTest] = useState(false);
  const [testMsg, setTestMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewFile(url);
    }
  }

  async function handleSaveConfig(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      await salvarConfigAction(formData);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDispararTeste(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingTest(true);
    setTestMsg(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res: any = await dispararTesteAction(formData);
      if (res?.sucesso) {
        setTestMsg({ tipo: 'sucesso', texto: res.mensagem || 'E-mail de teste enviado com sucesso!' });
        setTimeout(() => {
          setTestModalOpen(false);
          setTestMsg(null);
          window.location.reload();
        }, 1500);
      } else {
        setTestMsg({ tipo: 'erro', texto: res?.erro || 'Falha ao disparar e-mail de teste.' });
      }
    } catch (err: any) {
      setTestMsg({ tipo: 'erro', texto: err.message || 'Erro de comunicação ao enviar e-mail.' });
    } finally {
      setLoadingTest(false);
    }
  }

  return (
    <div className="space-y-8 font-sans">
      {/* ── SEÇÃO 1: CONFIGURAÇÃO DE E-MAIL PÓS-VENDA & CUPOM ── */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-gray-200 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                Pós-Venda Automático
              </span>
              <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
                <Mail size={22} className="text-primary" />
                E-mail de Agradecimento com Cupom de Desconto
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Configure o envio automático de e-mail de agradecimento, cupom de desconto com validade e arte promocional.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(!previewOpen)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Eye size={15} />
              <span>{previewOpen ? 'Ocultar Prévia' : 'Pré-visualizar E-mail'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTestModalOpen(true)}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={15} />
              <span>Testar Envio / Disparo</span>
            </button>
          </div>
        </div>

        {/* Form de Configuração */}
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Campo 1: Desconto do Cupom */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Percent size={14} className="text-primary" />
                Valor do Desconto do Cupom *
              </label>
              <div className="flex gap-2">
                <input
                  name="desconto_valor"
                  type="number"
                  step="0.01"
                  required
                  value={descontoValor}
                  onChange={(e) => setDescontoValor(e.target.value)}
                  placeholder="Ex: 10"
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <select
                  name="desconto_tipo"
                  value={descontoTipo}
                  onChange={(e) => setDescontoTipo(e.target.value as any)}
                  className="border border-gray-300 rounded-xl p-3 text-xs font-bold bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="percentual">% OFF</option>
                  <option value="fixo">R$ OFF</option>
                </select>
              </div>
            </div>

            {/* Campo 2: Período de Validade (dias) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Clock size={14} className="text-orange-500" />
                Validade do Cupom (Dias após envio) *
              </label>
              <input
                name="validade_dias"
                type="number"
                required
                min="1"
                max="365"
                value={validadeDias}
                onChange={(e) => setValidadeDias(e.target.value)}
                placeholder="Ex: 15"
                className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Se enviado hoje, será válido até <strong className="text-primary">{exValidadeStr}</strong> ({validadeDias} dias).
              </p>
            </div>

            {/* Campo 3: Status Ativo */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Envio Automático Pós-Venda
              </label>
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="ativo_posvenda"
                  name="ativo"
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
                <label htmlFor="ativo_posvenda" className="text-xs font-bold text-secondary cursor-pointer">
                  Disparar automaticamente ao confirmar pedido
                </label>
              </div>
            </div>
          </div>

          {/* Campo 4: Upload da Arte do Banner */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <ImageIcon size={16} className="text-purple-600" />
                Arte Promocional / Banner do E-mail
              </label>
              <span className="text-[11px] text-gray-500 font-medium">Recomendado: 600 x 300 px (PNG, JPG, WebP)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2">
                <input
                  name="banner_file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-white cursor-pointer"
                />
                <input type="hidden" name="banner_url_atual" value={bannerUrl} />
              </div>

              {(previewFile || bannerUrl) ? (
                <div className="relative h-20 rounded-xl overflow-hidden border border-gray-300 shadow-2xs">
                  <img
                    src={previewFile || bannerUrl}
                    alt="Arte do E-mail"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    Arte Atual
                  </span>
                </div>
              ) : (
                <div className="h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 font-medium">
                  Sem arte selecionada
                </div>
              )}
            </div>
          </div>

          {/* Campo 5: Assunto e Texto do E-mail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Assunto do E-mail *
              </label>
              <input
                name="assunto"
                required
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Assunto da mensagem..."
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mensagem de Agradecimento *
              </label>
              <textarea
                name="mensagem"
                required
                rows={3}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Texto de agradecimento..."
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full md:w-auto bg-primary hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-2xl transition shadow-sm cursor-pointer"
            >
              Salvar Configurações de E-mail & Cupom
            </button>
          </div>
        </form>
      </div>

      {/* 👁️ PRE-VISUALIZAÇÃO DO E-MAIL EM TEMPO REAL */}
      {previewOpen && (
        <div className="bg-gradient-to-b from-slate-100 to-gray-200 p-6 md:p-8 rounded-3xl border border-gray-300 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-700 flex items-center gap-2">
              <Eye size={16} className="text-primary" />
              Prévia Visual do E-mail de Agradecimento
            </h3>
            <span className="text-xs text-gray-500 font-mono">Formato HTML Responsivo</span>
          </div>

          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            {/* Header / Banner do E-mail */}
            {(previewFile || bannerUrl) ? (
              <img
                src={previewFile || bannerUrl}
                alt="Banner E-mail"
                className="w-full max-h-52 object-cover"
              />
            ) : (
              <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 py-6 px-6 text-white text-center">
                <Sparkles size={32} className="mx-auto text-yellow-300 mb-1 animate-pulse" />
                <h2 className="text-xl font-black">Obrigado por sua Compra!</h2>
                <p className="text-xs text-orange-100">Mimo Show Pet Shop</p>
              </div>
            )}

            <div className="p-6 space-y-5 text-gray-800 text-sm">
              <div className="space-y-2">
                <h3 className="font-bold text-base text-gray-900">{assunto}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{mensagem}</p>
              </div>

              {/* Caixa do Número do Pedido & Rastreamento */}
              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-300 text-center space-y-1.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  📦 NÚMERO DO SEU PEDIDO
                </span>
                <span className="font-mono font-black text-xl text-slate-900 tracking-wide block">
                  #PED-10842
                </span>
                <p className="text-[11px] text-slate-600">
                  Você pode acompanhar o andamento da entrega a qualquer momento em nosso site.
                </p>
                <div className="pt-1">
                  <span className="inline-block bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-2xs">
                    🔍 Rastrear / Acompanhar Pedido #PED-10842
                  </span>
                </div>
              </div>

              {/* Caixa de Destaque do Cupom */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-2xl border-2 border-dashed border-orange-400 text-center space-y-2">
                <span className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-md uppercase tracking-wide">
                  {descontoValor}{descontoTipo === 'percentual' ? '% OFF' : ' R$ OFF'} NA PRÓXIMA COMPRA
                </span>

                <div className="py-1">
                  <span className="font-mono font-black text-xl text-orange-900 tracking-wider bg-white px-4 py-1.5 rounded-xl border border-orange-200 inline-block shadow-2xs">
                    OBRIGADO-DEMO10
                  </span>
                </div>

                <p className="text-[11px] text-gray-600 font-medium">
                  ⏰ Cupom exclusivo e por tempo limitado! Válido até <strong className="text-primary">{exValidadeStr}</strong>.
                </p>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  className="bg-primary text-white font-black text-xs uppercase px-6 py-3 rounded-xl shadow-xs"
                >
                  Usar Meu Cupom Agora na Loja →
                </button>
              </div>
            </div>

            <div className="bg-gray-100 px-6 py-3 text-center text-[10px] text-gray-500 border-t border-gray-200">
              Mimo Show Pet Shop © 2026 • Todos os direitos reservados.
            </div>
          </div>
        </div>
      )}

      {/* 📬 SEÇÃO 2: HISTÓRICO DE E-MAILS ENVIADOS AOS CLIENTES */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-gray-200 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
              <Mail size={20} className="text-primary" />
              Histórico de E-mails Enviados aos Clientes
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Registro completo de e-mails automáticos de agradecimento com cupons gerados.
            </p>
          </div>

          <span className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">
            Total: {logs.length} enviado(s)
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-xs text-gray-400 space-y-2">
            <Mail size={32} className="mx-auto text-gray-300" />
            <p className="font-bold text-gray-600">Nenhum e-mail enviado até o momento.</p>
            <p>Clique em "Testar Envio / Disparo" para simular o primeiro envio com cupom de teste!</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-[11px] tracking-wider border-b border-gray-200 font-bold">
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">E-mail</th>
                  <th className="p-3.5">Cupom Emitido</th>
                  <th className="p-3.5">Desconto</th>
                  <th className="p-3.5">Data de Envio</th>
                  <th className="p-3.5">Válido Até</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-orange-50/20 transition">
                    <td className="p-3.5 font-bold text-gray-900 flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      {log.cliente_nome}
                    </td>
                    <td className="p-3.5 text-gray-600">{log.cliente_email}</td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold bg-orange-100 text-orange-900 px-2 py-1 rounded-md border border-orange-200">
                        {log.cupom_codigo}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-primary">{log.desconto_texto}</td>
                    <td className="p-3.5 text-gray-500">
                      {new Date(log.data_envio).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3.5 font-bold text-gray-800">
                      {new Date(log.validade_ate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                        <Check size={11} /> {log.status || 'ENVIADO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🚀 MODAL DE TESTE DE DISPARO DE E-MAIL */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-lg text-secondary flex items-center gap-2">
                <Send size={20} className="text-emerald-600" />
                Testar Envio de E-mail de Agradecimento
              </h3>
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {testMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                  testMsg.tipo === 'sucesso'
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {testMsg.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{testMsg.texto}</span>
              </div>
            )}

            <form onSubmit={handleDispararTeste} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Cliente (Teste) *</label>
                <input
                  name="cliente_nome"
                  required
                  defaultValue="Cliente Teste"
                  placeholder="Ex: João da Silva"
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">E-mail do Cliente *</label>
                <input
                  name="cliente_email"
                  type="email"
                  required
                  defaultValue="mimoshow10@gmail.com"
                  placeholder="Ex: cliente@email.com"
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Número do Pedido (Simulação) *</label>
                <input
                  name="pedido_numero"
                  type="text"
                  required
                  defaultValue="#PED-10842"
                  placeholder="Ex: #PED-10842 ou 10842"
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 text-xs space-y-1 text-gray-600">
                <p>
                  • O sistema vai simular a emissão do cupom de <strong className="text-primary">{descontoValor}{descontoTipo === 'percentual' ? '%' : ' R$'} OFF</strong>.
                </p>
                <p>
                  • Válido por <strong className="text-primary">{validadeDias} dias</strong> ({exValidadeStr}).
                </p>
                <p>• O disparo será registrado imediatamente na tabela de Histórico.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loadingTest}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {loadingTest ? 'Enviando...' : 'Disparar E-mail de Teste'}
                </button>
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-3.5 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
