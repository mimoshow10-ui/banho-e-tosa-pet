import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export default function AdminConfiguracoes() {
  
  // Ação de Servidor para Gerar Token e Puxar produtos do Bling
  async function sincronizarBling(formData: FormData) {
    'use server'
    const clientId = formData.get('client_id') as string;
    const clientSecret = formData.get('client_secret') as string;
    const code = formData.get('code') as string;
    
    if (!clientId || !clientSecret || !code) return;

    console.log("Iniciando troca de código por Token do Bling...");

    try {
      // 1. Trocar o CODE pelo Access Token
      const authResponse = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
          'Accept': '1.0'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code
        })
      });

      const authData = await authResponse.json();
      
      if (authData.error) {
        console.error("Erro na autenticação do Bling:", authData);
        return;
      }

      const accessToken = authData.access_token;
      console.log("Token gerado com sucesso! Autenticação concluída.");

      // TODO: Salvar o accessToken no banco de dados para usarmos quando VOCÊ quiser enviar algo para o Bling.
      
      // Feedback visual para a página de configurações recarregar
      revalidatePath('/admin/configuracoes');
      
    } catch (error) {
      console.error("Erro no processo do Bling:", error);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">Configurações e Integrações</h1>

      {/* Sincronização BLING */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary">Conexão com o Bling</h2>
        <p className="text-sm text-gray-600 mb-6">Conecte sua conta do Bling para poder exportar seus produtos e vendas quando desejar.</p>
        
        <form action={sincronizarBling} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client ID</label>
              <input name="client_id" type="text" required placeholder="Cole o Client ID" className="w-full border border-border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client Secret</label>
              <input name="client_secret" type="password" required placeholder="Cole o Client Secret" className="w-full border border-border rounded-lg p-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Código de Autorização (Code)</label>
            <input name="code" type="password" required placeholder="Cole o ?code= que veio na URL" className="w-full border border-border rounded-lg p-2" />
          </div>
          
          <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition w-fit mt-2">
            Autenticar no Bling (Não importa nada)
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border p-8 mb-6">
        <h2 className="text-xl font-bold mb-6 text-secondary border-b pb-2">Informações Gerais</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome da Loja</label>
            <input type="text" defaultValue="Mimo Show Pet" className="w-full border border-border rounded-lg p-2" />
          </div>
        </div>
      </div>

      {/* INTEGRAÇÃO LOGÍSTICA (Correios / Transportadoras) */}
      <div className="bg-white rounded-xl shadow-sm border border-yellow-300 p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-yellow-500"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary">Logística e Frete (Correios & Transportadoras)</h2>
        <p className="text-sm text-gray-600 mb-6">Ative e configure os meios de entrega disponíveis para os clientes no checkout.</p>
        
        <form className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 p-4 border border-border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
              <input type="checkbox" defaultChecked className="w-5 h-5 text-primary rounded focus:ring-primary" />
              <div>
                <p className="font-bold text-gray-800">Correios (PAC e Sedex)</p>
                <p className="text-sm text-gray-500">Cálculo automático pelo CEP de origem.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
              <input type="checkbox" defaultChecked className="w-5 h-5 text-primary rounded focus:ring-primary" />
              <div>
                <p className="font-bold text-gray-800">Transportadoras Privadas (ex: Jadlog, Total Express)</p>
                <p className="text-sm text-gray-500">Requer integração com Melhor Envio ou Kangu.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
              <input type="checkbox" defaultChecked className="w-5 h-5 text-primary rounded focus:ring-primary" />
              <div>
                <p className="font-bold text-gray-800">Retirada no Local</p>
                <p className="text-sm text-gray-500">Cliente retira os produtos direto no pet shop.</p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">CEP de Origem (Remetente)</label>
              <input type="text" placeholder="Ex: 01000-000" className="w-full border border-border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Token de API (Melhor Envio / Correios)</label>
              <input type="password" placeholder="Insira o Token" className="w-full border border-border rounded-lg p-2" />
            </div>
          </div>

          <button type="button" className="bg-primary text-secondary px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 transition w-fit mt-2">
            Salvar Configurações de Frete
          </button>
        </form>
      </div>
    </div>
  );
}
