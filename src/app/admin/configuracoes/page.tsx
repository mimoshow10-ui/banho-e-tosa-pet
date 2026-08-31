import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export default async function AdminConfiguracoes({ searchParams }: { searchParams: { msg?: string, erro?: string } }) {
  
  async function importarDireto(formData: FormData) {
    'use server'
    const clientId = formData.get('client_id') as string;
    const clientSecret = formData.get('client_secret') as string;
    const code = formData.get('code') as string;
    const sku = formData.get('sku') as string;
    
    if (!clientId || !clientSecret || !code || !sku) return;

    let redirectTo = '';

    try {
      // 1. Troca o código pelo Token na hora
      const authResponse = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
          'Accept': '1.0'
        },
        body: new URLSearchParams({ grant_type: 'authorization_code', code: code })
      });

      const authData = await authResponse.json();
      
      if (authData.error) {
        redirectTo = `/admin/configuracoes?erro=Código Expirado ou Inválido. Gere um novo Link de Convite no Bling.`;
      } else {
        const token = authData.access_token;

        // 2. Busca o Produto
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

          // 3. Tenta salvar no Supabase
          const { error } = await supabase.from('produtos').upsert(produtoParaInserir, { onConflict: 'bling_id' });
          
          if (error) {
            redirectTo = `/admin/configuracoes?erro=O produto foi puxado do Bling, mas a Vercel não conseguiu salvar no Banco de Dados. Verifique as chaves do Supabase na Vercel!`;
          } else {
            redirectTo = `/admin/configuracoes?msg=Sucesso! O produto ${prod.nome} foi importado para a vitrine!`;
          }
        }
      }
    } catch (error) {
      redirectTo = `/admin/configuracoes?erro=Erro fatal na comunicação com o Bling.`;
    }

    if (redirectTo) {
      revalidatePath('/admin/produtos');
      redirect(redirectTo);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">Configurações e Integrações</h1>

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

      <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary">Importação Direta (Modo Turbo)</h2>
        <p className="text-sm text-gray-600 mb-6">Essa versão ignora o banco de dados na autenticação e puxa o produto na hora.</p>
        
        <form action={importarDireto} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client ID</label>
              <input name="client_id" type="text" required className="w-full border border-border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client Secret</label>
              <input name="client_secret" type="password" required className="w-full border border-border rounded-lg p-2" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código (URL)</label>
              <input name="code" type="password" required className="w-full border border-border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU do Produto</label>
              <input name="sku" type="text" required placeholder="Ex: kit29" className="w-full border border-border rounded-lg p-2" />
            </div>
          </div>
          
          <button type="submit" className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition w-fit mt-2">
            Puxar Produto Imediatamente
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
