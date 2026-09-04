'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('mimoshow01@gmail.com');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) return;

    setCarregando(true);
    setMensagem(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'login', email: email.trim(), senha: senha.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Acesso autorizado! Entrando no painel...' });
        setTimeout(() => {
          router.push('/admin');
          router.refresh();
        }, 500);
      } else {
        setMensagem({ tipo: 'erro', texto: data.erro || 'E-mail ou senha incorretos.' });
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
            Autenticação Administrativa Banho & Tosa Pet
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

          <form onSubmit={handleLogin} className="space-y-4">
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

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Senha Administrativa
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha de acesso"
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
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Entrar no Painel Administrativo</span>
                </>
              )}
            </button>
          </form>

        </div>

        {/* Rodapé */}
        <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-medium">
            Banho & Tosa Pet • Proteção Exclusiva de Acesso Administrativo
          </p>
        </div>

      </div>
    </div>
  );
}
