'use client';

import { useState } from 'react';
import { salvarSenhaAdmin, salvarCredenciais, salvarMercadoPago, salvarFreteConfig } from './actions';
import { CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface Props {
  adminSenhaAtual: string;
  creds: { client_id?: string; client_secret?: string } | null;
  mpCreds: { access_token?: string; public_key?: string } | null;
  freteConfig: {
    cep_origem?: string;
    token_frete?: string;
    usar_correios?: boolean;
    usar_transportadoras?: boolean;
    usar_retirada?: boolean;
  } | null;
}

export default function ConfiguracoesForms({ adminSenhaAtual, creds, mpCreds, freteConfig }: Props) {
  const [mostrarSenhaConfig, setMostrarSenhaConfig] = useState(false);
  const [msgSenha, setMsgSenha] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [msgCreds, setMsgCreds] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [msgMp, setMsgMp] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [msgFrete, setMsgFrete] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [loadingSenha, setLoadingSenha] = useState(false);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [loadingMp, setLoadingMp] = useState(false);
  const [loadingFrete, setLoadingFrete] = useState(false);

  async function handleSalvarSenha(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingSenha(true);
    setMsgSenha(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await salvarSenhaAdmin(formData);
      if (res?.sucesso) {
        setMsgSenha({ tipo: 'sucesso', texto: res.mensagem || 'Senha salva!' });
      } else {
        setMsgSenha({ tipo: 'erro', texto: res?.erro || 'Erro ao salvar senha.' });
      }
    } catch (err: any) {
      setMsgSenha({ tipo: 'erro', texto: err.message || 'Erro de comunicação.' });
    } finally {
      setLoadingSenha(false);
    }
  }

  async function handleSalvarCredenciais(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingCreds(true);
    setMsgCreds(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await salvarCredenciais(formData);
      if (res?.sucesso) {
        setMsgCreds({ tipo: 'sucesso', texto: res.mensagem || 'Credenciais salvas!' });
      } else {
        setMsgCreds({ tipo: 'erro', texto: res?.erro || 'Erro ao salvar credenciais.' });
      }
    } catch (err: any) {
      setMsgCreds({ tipo: 'erro', texto: err.message || 'Erro de comunicação.' });
    } finally {
      setLoadingCreds(false);
    }
  }

  async function handleSalvarMp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingMp(true);
    setMsgMp(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await salvarMercadoPago(formData);
      if (res?.sucesso) {
        setMsgMp({ tipo: 'sucesso', texto: res.mensagem || 'Mercado Pago salvo!' });
      } else {
        setMsgMp({ tipo: 'erro', texto: res?.erro || 'Erro ao salvar Mercado Pago.' });
      }
    } catch (err: any) {
      setMsgMp({ tipo: 'erro', texto: err.message || 'Erro de comunicação.' });
    } finally {
      setLoadingMp(false);
    }
  }

  async function handleSalvarFrete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingFrete(true);
    setMsgFrete(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await salvarFreteConfig(formData);
      if (res?.sucesso) {
        setMsgFrete({ tipo: 'sucesso', texto: res.mensagem || 'Configurações de frete salvas!' });
      } else {
        setMsgFrete({ tipo: 'erro', texto: res?.erro || 'Erro ao salvar frete.' });
      }
    } catch (err: any) {
      setMsgFrete({ tipo: 'erro', texto: err.message || 'Erro de comunicação.' });
    } finally {
      setLoadingFrete(false);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* SEGURANÇA E SENHA SECRETA DE ACESSO AO SISTEMA */}
      <div className="bg-white rounded-xl shadow-sm border border-emerald-300 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary flex items-center gap-2">
          🔒 Segurança do Sistema e Senha Secreta de Acesso
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Defina a senha secreta para login no Painel Administrativo. Em caso de esquecimento, o código de recuperação será enviado para <strong>mimosrtes10@hotmail.com</strong> com cópia para <strong>mimoshow10@hotmail.com</strong>.
        </p>

        {msgSenha && (
          <div className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 mb-4 ${
            msgSenha.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {msgSenha.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{msgSenha.texto}</span>
          </div>
        )}

        <form onSubmit={handleSalvarSenha} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Nova Senha Secreta de Acesso *
            </label>
            <div className="relative">
              <input
                name="nova_senha_admin"
                type={mostrarSenhaConfig ? 'text' : 'password'}
                required
                defaultValue={adminSenhaAtual}
                placeholder="Digite a nova senha secreta"
                className="w-full border border-gray-300 rounded-lg p-3 pr-10 text-sm font-bold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setMostrarSenhaConfig(!mostrarSenhaConfig)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-700 cursor-pointer"
                title={mostrarSenhaConfig ? "Ocultar Senha" : "Mostrar Senha"}
              >
                {mostrarSenhaConfig ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingSenha}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold text-xs shadow-sm cursor-pointer whitespace-nowrap transition disabled:opacity-50 flex items-center gap-2"
          >
            {loadingSenha ? <RefreshCw size={14} className="animate-spin" /> : null}
            <span>{loadingSenha ? 'Salvando...' : '💾 Atualizar Senha Secreta'}</span>
          </button>
        </form>
      </div>

      {/* AUTENTICAÇÃO DO BLING */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary">Autenticação do Bling</h2>
        <p className="text-sm text-gray-600 mb-6">Coloque suas senhas aqui UMA ÚNICA VEZ para o sistema se conectar automaticamente.</p>

        {msgCreds && (
          <div className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 mb-4 ${
            msgCreds.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {msgCreds.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{msgCreds.texto}</span>
          </div>
        )}
        
        <form onSubmit={handleSalvarCredenciais} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client ID</label>
              <input name="client_id" type="text" required defaultValue={creds?.client_id || ''} className="w-full border border-border rounded-lg p-2 font-mono text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client Secret</label>
              <input name="client_secret" type="password" required defaultValue={creds?.client_secret || ''} className="w-full border border-border rounded-lg p-2 font-mono text-sm" />
            </div>
          </div>
          
          <div className="flex gap-4 items-center mt-2 flex-wrap">
            <button
              type="submit"
              disabled={loadingCreds}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 text-xs"
            >
              {loadingCreds ? <RefreshCw size={14} className="animate-spin" /> : null}
              <span>{loadingCreds ? 'Salvando...' : '1. Salvar Credenciais'}</span>
            </button>

            {creds?.client_id && (
              <a 
                href={`https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${creds.client_id}&state=state123`}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition inline-block text-xs"
              >
                2. Autorizar no Bling (Mágico)
              </a>
            )}
          </div>
        </form>
      </div>

      {/* INTEGRAÇÃO MERCADO PAGO */}
      <div className="bg-white rounded-xl shadow-sm border border-sky-300 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-sky-500"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary flex items-center gap-2">
          💳 Gateway de Pagamento (Mercado Pago)
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Insira o seu <strong>Access Token de Produção</strong> do Mercado Pago para receber pagamentos via PIX, Cartão de Crédito e Boleto.
        </p>

        {msgMp && (
          <div className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 mb-4 ${
            msgMp.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {msgMp.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{msgMp.texto}</span>
          </div>
        )}

        <form onSubmit={handleSalvarMp} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Access Token (Começa com APP_USR-...) *
            </label>
            <input
              name="mp_access_token"
              type="password"
              required
              defaultValue={mpCreds?.access_token || ''}
              placeholder="APP_USR-xxxx-xxxx-xxxx-xxxx"
              className="w-full border border-gray-300 rounded-lg p-3 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Public Key (Opcional - Começa com APP_USR-...)
            </label>
            <input
              name="mp_public_key"
              type="text"
              defaultValue={mpCreds?.public_key || ''}
              placeholder="APP_USR-xxxx-xxxx-xxxx-xxxx"
              className="w-full border border-gray-300 rounded-lg p-3 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loadingMp}
              className="bg-sky-600 text-white px-6 py-3 rounded-lg font-bold text-xs hover:bg-sky-700 transition shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loadingMp ? <RefreshCw size={14} className="animate-spin" /> : null}
              <span>{loadingMp ? 'Salvando...' : '💾 Salvar Credenciais do Mercado Pago'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* INTEGRAÇÃO LOGÍSTICA (Correios / Transportadoras) */}
      <div className="bg-white rounded-xl shadow-sm border border-yellow-300 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-yellow-500"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary">Logística e Frete (Correios & Transportadoras)</h2>
        <p className="text-sm text-gray-600 mb-6">Ative e configure os meios de entrega disponíveis para os clientes no checkout.</p>

        {msgFrete && (
          <div className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 mb-4 ${
            msgFrete.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {msgFrete.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{msgFrete.texto}</span>
          </div>
        )}
        
        <form onSubmit={handleSalvarFrete} autoComplete="off" className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 p-4 border border-border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                name="usar_correios"
                defaultChecked={freteConfig ? freteConfig.usar_correios : true}
                className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
              />
              <div>
                <p className="font-bold text-gray-800">Correios (PAC e Sedex)</p>
                <p className="text-sm text-gray-500">Cálculo automático pelo CEP de origem.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                name="usar_transportadoras"
                defaultChecked={freteConfig ? freteConfig.usar_transportadoras : true}
                className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
              />
              <div>
                <p className="font-bold text-gray-800">Transportadoras Privadas (ex: Jadlog, Total Express)</p>
                <p className="text-sm text-gray-500">Requer integração com Melhor Envio ou Kangu.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                name="usar_retirada"
                defaultChecked={freteConfig ? freteConfig.usar_retirada : true}
                className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
              />
              <div>
                <p className="font-bold text-gray-800">Retirada no Local</p>
                <p className="text-sm text-gray-500">Cliente retira os produtos direto no pet shop.</p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">CEP de Origem (Remetente)</label>
              <input
                type="text"
                name="cep_origem"
                autoComplete="off"
                defaultValue={freteConfig?.cep_origem || ''}
                placeholder="Ex: 01000-000"
                className="w-full border border-border rounded-lg p-3 text-sm font-mono font-bold bg-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Token de API (Melhor Envio / Correios)</label>
              <input
                type="text"
                name="token_frete"
                autoComplete="off"
                defaultValue={freteConfig?.token_frete || ''}
                placeholder="Insira o Token de Frete (Opcional)"
                className="w-full border border-border rounded-lg p-3 text-sm font-mono font-bold bg-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingFrete}
            className="bg-primary text-secondary px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 transition w-fit mt-2 cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2 text-xs"
          >
            {loadingFrete ? <RefreshCw size={14} className="animate-spin" /> : null}
            <span>{loadingFrete ? 'Salvando...' : '💾 Salvar Configurações de Frete'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
