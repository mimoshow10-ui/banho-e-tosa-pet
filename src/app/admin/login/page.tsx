'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, KeyRound, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [aba, setAba] = useState<'senha' | 'email'>('senha');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [codigoDevExibido, setCodigoDevExibido] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  async function handleEnviarCodigo() {
    setCarregando(true);
    setMensagem(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'enviar_codigo' }),
      });
      const data = await res.json();
      if (res.ok) {
        setCodigoEnviado(true);
        if (data.codigoDev) setCodigoDevExibido(data.codigoDev);
        setMensagem({ tipo: 'sucesso', texto: data.mensagem || 'Código enviado para mimoshow01@gmail.com!' });
      } else {
        setMensagem({ tipo: 'erro', texto: data.erro || 'Erro ao enviar código.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Falha de comunicação com o servidor.' });
    } finally {
      setCarregando(false);
    }
  }

  async function handleLoginSenha(e: React.FormEvent) {
    e.preventDefault();
    if (!senha.trim()) return;

    setCarregando(true);
    setMensagem(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'validar_senha', senha }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Acesso autorizado! Redirecionando...' });
        setTimeout(() => {
          router.push('/admin');
          router.refresh();
        }, 1000);
      } else {
        setMensagem({ tipo: 'erro', texto: data.erro || 'Senha incorreta.' });
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
        body: JSON.stringify({ acao: 'validar_codigo', codigo }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'E-mail confirmado! Redirecionando...' });
        setTimeout(() => {
          router.push('/admin');
          router.refresh();
        }, 1000);
      } else {
        setMensagem({ tipo: 'erro', texto: data.erro || 'Código de confirmação incorreto.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Falha de comunicação com o servidor.' });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-secondary to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-800/20">
        
        {/* Topo do Modal de Login */}
        <div className="bg-secondary p-6 text-white text-center relative border-b border-blue-900">
          <div className="w-20 h-20 mx-auto relative mb-2">
            <Image
              src="/logo-luxo.jpg"
              alt="Banho & Tosa Pet"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-heading font-black tracking-tight text-white flex items-center justify-center gap-2">
            <ShieldCheck className="text-primary" size={20} />
            Área Administrativa
          </h1>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            Autenticação Oficial • <strong>mimoshow01@gmail.com</strong>
          </p>
        </div>

        {/* Corpo do Form de Login */}
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

          {/* Notificação Dev / OTP de Teste */}
          {codigoDevExibido && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
              🔑 <strong>Código de Verificação Gerado:</strong> <span className="font-mono font-black text-sm text-primary">{codigoDevExibido}</span> (Enviado para mimoshow01@gmail.com)
            </div>
          )}

          {/* Tabs de Seleção de Método */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
            <button
              type="button"
              onClick={() => { setAba('senha'); setMensagem(null); }}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                aba === 'senha'
                  ? 'bg-white text-secondary shadow-xs'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <KeyRound size={14} />
              <span>Senha Forte</span>
            </button>

            <button
              type="button"
              onClick={() => { setAba('email'); setMensagem(null); }}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                aba === 'email'
                  ? 'bg-white text-secondary shadow-xs'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mail size={14} />
              <span>Código por E-mail</span>
            </button>
          </div>

          {/* OPÇÃO 1: Login por Senha Forte */}
          {aba === 'senha' && (
            <form onSubmit={handleLoginSenha} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Senha Administrativa Forte
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite a senha de administrador..."
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-primary hover:bg-orange-600 text-white font-black py-3 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {carregando ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Painel</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* OPÇÃO 2: Login por Código no E-mail */}
          {aba === 'email' && (
            <div className="space-y-4">
              {!codigoEnviado ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-900 font-medium">
                    📧 Enviaremos um <strong>código de 6 dígitos</strong> para o e-mail de segurança oficial: <strong>mimoshow01@gmail.com</strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleEnviarCodigo}
                    disabled={carregando}
                    className="w-full bg-secondary hover:bg-blue-900 text-white font-black py-3 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {carregando ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Mail size={14} />
                        <span>Enviar Código de Confirmação por E-mail</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLoginCodigo} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Código de Confirmação (6 Dígitos)
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
                    disabled={carregando}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {carregando ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Validando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Confirmar e Acessar Painel</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleEnviarCodigo}
                    disabled={carregando}
                    className="w-full text-xs text-gray-500 font-bold hover:underline text-center block cursor-pointer"
                  >
                    Reenviar código para mimoshow01@gmail.com
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-medium">
            Banho & Tosa Pet • Proteção de Acesso Administrativo
          </p>
        </div>

      </div>
    </div>
  );
}
