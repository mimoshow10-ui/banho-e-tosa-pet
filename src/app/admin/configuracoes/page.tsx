import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export default function AdminConfiguracoes() {
  
  // Ação de Servidor para Puxar produtos do Bling
  async function sincronizarBling(formData: FormData) {
    'use server'
    const token = formData.get('bling_token') as string;
    
    if (!token) return;

    console.log("Iniciando importação do Bling com o token:", token);

    // Estrutura real de como faremos a requisição para a API v3 do Bling:
    /*
    const resposta = await fetch('https://www.bling.com.br/Api/v3/produtos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dados = await resposta.json();

    // Loop para salvar no Supabase
    for (const prod of dados.data) {
      await supabase.from('produtos').upsert({
        bling_id: prod.id,
        nome: prod.nome,
        preco: prod.preco,
        estoque: prod.estoque.saldoVirtual,
        slug: prod.nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      }, { onConflict: 'bling_id' });
    }
    */
    
    // Para teste, vamos inserir um produto de teste fingindo que veio do Bling
    await supabase.from('produtos').insert([{
      nome: 'Produto Importado do Bling - Teste',
      preco: 149.90,
      estoque: 50,
      slug: 'produto-importado-bling-' + Date.now(),
      bling_id: 'BLING-' + Date.now()
    }]);

    revalidatePath('/admin/produtos');
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">Configurações e Integrações</h1>

      {/* Sincronização BLING */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary">Exportação / Importação do Bling</h2>
        <p className="text-sm text-gray-600 mb-6">Puxe todos os seus 5.000 SKUs do Bling direto para o site.</p>
        
        <form action={sincronizarBling} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Token de Acesso do Bling (API v3)</label>
            <input name="bling_token" type="password" required placeholder="Cole seu Token do Bling aqui..." className="w-full border border-border rounded-lg p-2" />
          </div>
          
          <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition w-fit mt-2">
            Iniciar Sincronização com Bling
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
    </div>
  );
}
