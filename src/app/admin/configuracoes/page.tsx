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

  async function importarProdutoEspecifico(formData: FormData) {
    'use server'
    const sku = formData.get('sku') as string;
    if (!sku) return;

    let redirectTo = '';

    try {
      const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
      const token = cfg?.valor?.access_token;
      
      if (!token) {
        redirectTo = `/admin/configuracoes?erro=Token do Bling não encontrado. Faça a autorização primeiro.`;
      } else {
        const response = await fetch(`https://www.bling.com.br/Api/v3/produtos?codigo=${sku}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
          redirectTo = `/admin/configuracoes?erro=Produto SKU ${sku} não encontrado no Bling.`;
        } else {
          const prod = data.data[0];
          const produtoParaInserir = {
            bling_id: String(prod.id),
            codigo_barras: prod.codigo,
            nome: prod.nome,
            preco: prod.preco,
            slug: prod.nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '-' + Date.now(),
            ativo: prod.situacao === 'A'
          };

          const { error } = await supabase.from('produtos').upsert(produtoParaInserir, { onConflict: 'bling_id' });
          
          if (error) {
            redirectTo = `/admin/configuracoes?erro=A Vercel não conseguiu salvar no Banco de Dados.`;
          } else {
            redirectTo = `/admin/configuracoes?msg=Sucesso! O produto ${prod.nome} foi importado!`;
          }
        }
      }
    } catch (error) {
      redirectTo = `/admin/configuracoes?erro=Erro fatal.`;
    }

    if (redirectTo) {
      revalidatePath('/admin/produtos');
      redirect(redirectTo);
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
