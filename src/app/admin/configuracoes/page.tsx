import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminConfiguracoes({ searchParams }: { searchParams: { msg?: string, erro?: string } }) {
  
  // Buscar credenciais salvas
  let creds = null;
  let dbError = null;
  try {
    const { data, error } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').single();
    if (error) dbError = error.message;
    creds = data?.valor;
  } catch (err) {
    dbError = String(err);
  }

  // Buscar credenciais do Mercado Pago salvas
  let mpCreds = null;
  try {
    const { data } = await supabase.from('configuracoes').select('*').eq('chave', 'mercadopago_config').maybeSingle();
    mpCreds = data?.valor;
  } catch {}

  async function salvarCredenciais(formData: FormData) {
    'use server'
    const clientId = formData.get('client_id') as string;
    const clientSecret = formData.get('client_secret') as string;
    if (!clientId || !clientSecret) return;
    
    try {
      const { error } = await supabase.from('configuracoes').upsert({
        chave: 'bling_credentials',
        valor: { client_id: clientId, client_secret: clientSecret }
      }, { onConflict: 'chave' });
      
      revalidatePath('/admin/configuracoes');

      if (error) {
        redirect(`/admin/configuracoes?erro=O banco de dados recusou salvar. Erro: ${error.message}`);
      } else {
        redirect('/admin/configuracoes?msg=Credenciais Salvas! Agora basta clicar em Autorizar no Bling.');
      }
    } catch (err) {
      redirect(`/admin/configuracoes?erro=Erro fatal de conexão (URL inválida ou banco offline): ${String(err)}`);
    }
  }

  // Buscar configurações de frete salvas
  let freteConfig = null;
  try {
    const { data: cfgFrete } = await supabase.from('configuracoes').select('*').eq('chave', 'frete_config').maybeSingle();
    freteConfig = cfgFrete?.valor;
  } catch {}

  async function salvarFreteConfig(formData: FormData) {
    'use server'
    const cep_origem = (formData.get('cep_origem') as string || '').trim();
    const token_frete = (formData.get('token_frete') as string || '').trim();
    const usar_correios = formData.get('usar_correios') === 'on';
    const usar_transportadoras = formData.get('usar_transportadoras') === 'on';
    const usar_retirada = formData.get('usar_retirada') === 'on';

    try {
      const { error } = await supabase.from('configuracoes').upsert({
        chave: 'frete_config',
        valor: {
          cep_origem,
          token_frete,
          usar_correios,
          usar_transportadoras,
          usar_retirada,
          atualizado_em: new Date().toISOString()
        }
      }, { onConflict: 'chave' });

      revalidatePath('/admin/configuracoes');

      if (error) {
        redirect(`/admin/configuracoes?erro=Erro ao salvar frete: ${error.message}`);
      } else {
        redirect('/admin/configuracoes?msg=Configurações de Logística e Frete salvas com sucesso!');
      }
    } catch (err) {
      redirect(`/admin/configuracoes?erro=Erro ao salvar frete: ${String(err)}`);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">Configurações e Integrações</h1>

      {dbError && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg font-bold mb-6">
          ❌ FALHA GRAVE DE CONEXÃO COM A VERCEL: {dbError}
        </div>
      )}

      {searchParams.msg && (
        <div className="bg-green-100 text-green-800 p-4 rounded-lg font-bold mb-6">
          ✅ {searchParams.msg}
        </div>
      )}

      {searchParams.erro && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg font-bold mb-6">
          ❌ ERRO: {searchParams.erro}
        </div>
      )}

      {/* SEGURANÇA E SENHA SECRETA DE ACESSO AO SISTEMA */}
      <div className="bg-white rounded-xl shadow-sm border border-emerald-300 p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary flex items-center gap-2">
          🔒 Segurança do Sistema e Senha Secreta de Acesso
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Defina a senha secreta para login no Painel Administrativo. Em caso de esquecimento, o código de recuperação será enviado para <strong>mimosrtes10@hotmail.com</strong> com cópia para <strong>mimoshow10@hotmail.com</strong>.
        </p>

        <form action={salvarSenhaAdmin} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Nova Senha Secreta de Acesso *
            </label>
            <input
              name="nova_senha_admin"
              type="text"
              required
              defaultValue={adminSenhaAtual}
              placeholder="Digite a nova senha secreta"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm font-bold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold text-xs shadow-sm cursor-pointer whitespace-nowrap transition"
          >
            💾 Atualizar Senha Secreta
          </button>
        </form>
      </div>

      {/* Passo 1: Salvar Senhas */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary">Autenticação do Bling</h2>
        <p className="text-sm text-gray-600 mb-6">Coloque suas senhas aqui UMA ÚNICA VEZ para o sistema se conectar automaticamente.</p>
        
        <form action={salvarCredenciais} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client ID</label>
              <input name="client_id" type="text" required defaultValue={creds?.client_id} className="w-full border border-border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client Secret</label>
              <input name="client_secret" type="password" required defaultValue={creds?.client_secret} className="w-full border border-border rounded-lg p-2" />
            </div>
          </div>
          
          <div className="flex gap-4 items-center mt-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
              1. Salvar Credenciais
            </button>

            {creds?.client_id && (
              <a 
                href={`https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${creds.client_id}&state=state123`}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition inline-block"
              >
                2. Autorizar no Bling (Mágico)
              </a>
            )}
          </div>
        </form>
      </div>

      {/* INTEGRAÇÃO MERCADO PAGO */}
      <div className="bg-white rounded-xl shadow-sm border border-sky-300 p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-sky-500"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary flex items-center gap-2">
          💳 Gateway de Pagamento (Mercado Pago)
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Insira o seu <strong>Access Token de Produção</strong> do Mercado Pago para receber pagamentos via PIX, Cartão de Crédito e Boleto.
        </p>

        <form action={salvarMercadoPago} className="flex flex-col gap-4">
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
              className="bg-sky-600 text-white px-6 py-3 rounded-lg font-bold text-xs hover:bg-sky-700 transition shadow-md cursor-pointer"
            >
              💾 Salvar Credenciais do Mercado Pago
            </button>
          </div>
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
        
        <form action={salvarFreteConfig} autoComplete="off" className="flex flex-col gap-6">
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

          <button type="submit" className="bg-primary text-secondary px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 transition w-fit mt-2 cursor-pointer shadow-sm">
            💾 Salvar Configurações de Frete
          </button>
        </form>
      </div>
    </div>
  );
}
