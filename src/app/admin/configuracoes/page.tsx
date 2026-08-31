import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export default function AdminConfiguracoes() {
  
  // Ação de Servidor para Importar um Produto Específico
  async function importarProdutoEspecifico(formData: FormData) {
    'use server'
    const token = formData.get('access_token') as string;
    const sku = formData.get('sku') as string;
    
    if (!token || !sku) return;

    console.log(`Buscando o produto SKU: ${sku} no Bling...`);

    try {
      // Buscar o produto específico no Bling pelo código (SKU)
      const response = await fetch(`https://www.bling.com.br/Api/v3/produtos?codigo=${sku}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const prod = data.data[0];
        
        // Formatar para o nosso banco
        const produtoParaInserir = {
          bling_id: String(prod.id),
          codigo_barras: prod.codigo,
          nome: prod.nome,
          preco: prod.preco,
          slug: prod.nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '-' + Date.now(),
          ativo: prod.situacao === 'A'
        };

        // Salvar no Supabase
        const { error } = await supabase.from('produtos').upsert(produtoParaInserir, { onConflict: 'bling_id' });
        
        if (error) {
          console.error("Erro ao salvar no banco Supabase (verifique as variáveis de ambiente):", error);
        } else {
          console.log(`Produto ${prod.nome} importado com sucesso!`);
        }
      } else {
        console.log("Produto não encontrado no Bling com esse SKU.");
      }

      revalidatePath('/admin/produtos');
      
    } catch (error) {
      console.error("Erro na importação:", error);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">Configurações e Integrações</h1>

      {/* Importação Específica BLING */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200 p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary">Importar Produto do Bling (Por SKU)</h2>
        <p className="text-sm text-gray-600 mb-6">Traga apenas os produtos que você deseja para a vitrine informando o código deles.</p>
        
        <form action={importarProdutoEspecifico} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">SKU (Código no Bling)</label>
              <input name="sku" type="text" required placeholder="Ex: PET-001" className="w-full border border-border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Token de Acesso (Access Token)</label>
              <input name="access_token" type="password" required placeholder="Cole o token do Bling" className="w-full border border-border rounded-lg p-2" />
            </div>
          </div>
          
          <button type="submit" className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition w-fit mt-2">
            Puxar Produto Específico
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
