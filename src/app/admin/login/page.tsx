'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, KeyRound, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('mimoshow01@gmail.com');
  const [codigo, setCodigo] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [tempoRestante, setTempoRestante] = useState(180); // 3 minutos

  useEffect(() => {
    let interval: any = null;
    if (codigoEnviado && tempoRestante > 0) {
      interval = setInterval(() => {
        setTempoRestante((prev) => prev - 1);
      }, 1000);
    } else if (tempoRestante <= 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [codigoEnviado, tempoRestante]);

  function formatarTempo(segundos: number) {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  }

  async function handleEnviarCodigo(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email.trim()) return;

    setCarregando(true);
    setMensagem(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'enviar_codigo', email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setCodigoEnviado(true);
        setTempoRestante(180);
        setMensagem({ tipo: 'sucesso', texto: data.mensagem || 'Código de acesso enviado para o seu e-mail!' });
      } else {
        setMensagem({ tipo: 'erro', texto: data.erro || 'Erro ao enviar código de acesso.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Falha de comunicação com o servidor.' });
    } finally {
      setCarregando(false);
    }
  }

  async function handleLoginCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return;

    setCarregando(true);
    setMensagem(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'validar_codigo', email: email.trim(), codigo: codigo.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Acesso autorizado! Entrando no painel...' });
        setTimeout(() => {
          router.push('/admin');
          router.refresh();
        }, 600);
      } else {
        setMensagem({ tipo: 'erro', texto: data.erro || 'Código incorreto ou expirado.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Falha de comunicação com o servidor.' });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-[#0B2545] to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-800/20">
        
        {/* Topo do Modal de Login */}
        <div className="bg-[#0B2545] p-6 text-white text-center relative border-b border-blue-900">
          <div className="w-20 h-20 mx-auto relative mb-2">
            <Image
              src="/logo-luxo.jpg"
              alt="Banho & Tosa Pet"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-heading font-black tracking-tight text-white flex items-center justify-center gap-2">
            <ShieldCheck className="text-amber-400" size={20} />
            Painel Administrativo
          </h1>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            Acesso Autorizado: mimoshow01@gmail.com & mimoshow10@gmail.com
          </p>
        </div>

        {/* Corpo do Form */}
        <div className="p-6 space-y-5">

          {/* Feedback Toast */}
          {mensagem && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between border ${
                mensagem.tipo === 'sucesso'
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{mensagem.texto}</span>
              </div>
            </div>
          )}

          {!codigoEnviado ? (
            <form onSubmit={handleEnviarCodigo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  E-mail do Administrador Autorizado
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mimoshow01@gmail.com ou mimoshow10@gmail.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-[#0B2545] hover:bg-blue-900 text-white font-black py-3.5 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {carregando ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Enviando Código por E-mail...</span>
                  </>
                ) : (
                  <>
                    <Mail size={14} />
                    <span>Solicitar Código de Acesso por E-mail</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginCodigo} className="space-y-4">
              
              {/* Cronômetro de 3 Minutos */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-primary" />
                  Validade do Código:
                </span>
                <span className={`font-mono text-sm font-black ${tempoRestante < 30 ? 'text-red-600 animate-pulse' : 'text-blue-950'}`}>
                  {formatarTempo(tempoRestante)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Digite o Código de 6 Dígitos Recebido por E-mail
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ex: 849201"
                    maxLength={6}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl text-sm font-mono font-bold text-center tracking-widest text-gray-800 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={carregando || tempoRestante <= 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {carregando ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Validando Código...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Confirmar e Entrar no Painel</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setCodigoEnviado(false)}
                  className="text-gray-500 hover:underline font-bold"
                >
                  Alterar e-mail
                </button>

                <button
                  type="button"
                  onClick={(e) => handleEnviarCodigo(e)}
                  disabled={carregando}
                  className="text-primary hover:underline font-black flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>Reenviar Código por E-mail</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Rodapé */}
        <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-medium">
            Banho & Tosa Pet • Proteção Exclusiva de Acesso por E-mail (3 minutos)
          </p>
        </div>

      </div>
    </div>
  );
}
