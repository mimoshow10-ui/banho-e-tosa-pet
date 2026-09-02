import { supabase } from '@/lib/supabase';
import { salvarTopBar } from './actions';
import BannersForm from './BannersForm';

export const dynamic = 'force-dynamic';

export default async function AdminMarketing({ searchParams }: { searchParams: { msg?: string, erro?: string } }) {
  const { data: configs } = await supabase.from('configuracoes').select('*');
  
  const topbar = configs?.find(c => c.chave === 'marketing_topbar')?.valor || { texto: 'Frete grátis acima de R', visibilidade: 'todas', cor: 'bg-primary' };
  const banners = configs?.find(c => c.chave === 'marketing_banners')?.valor?.urls || ['/banner-pet.jpg'];

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">Marketing e Promoções</h1>

      {searchParams.msg && <div className="mb-4 bg-green-100 text-green-800 p-4 rounded-lg font-bold">{searchParams.msg}</div>}
      {searchParams.erro && <div className="mb-4 bg-red-100 text-red-800 p-4 rounded-lg font-bold">{searchParams.erro}</div>}

      <div className="flex flex-col gap-8">
        
        {/* TOP BAR */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-8">
          <div className="flex items-center gap-2 mb-6 border-b pb-2">
            <h2 className="text-xl font-bold text-secondary">Barra de Aviso do Topo (Top Bar)</h2>
          </div>
          
          <form action={salvarTopBar} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Frase da Barra</label>
              <input type="text" name="texto" defaultValue={topbar.texto} className="w-full border border-border rounded p-2 text-sm bg-white" required />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold mb-1">Onde exibir?</label>
                <select name="visibilidade" defaultValue={topbar.visibilidade} className="w-full border border-border rounded p-2 text-sm bg-white">
                  <option value="todas">Em todas as páginas</option>
                  <option value="home">Somente na Página Inicial (Home)</option>
                  <option value="nenhuma">Desativar (Esconder barra)</option>
                </select>
              </div>
              <div className="w-48">
                <label className="block text-sm font-bold mb-1">Cor de Fundo</label>
                <select name="cor" defaultValue={topbar.cor} className="w-full border border-border rounded p-2 text-sm bg-white">
                  <option value="bg-primary">Laranja Padrão</option>
                  <option value="bg-secondary">Azul Escuro</option>
                  <option value="bg-green-600">Verde</option>
                  <option value="bg-red-600">Vermelho</option>
                  <option value="bg-black">Preto</option>
                </select>
              </div>
            </div>

            <button type="submit" className="bg-primary text-white py-2 px-6 rounded-lg font-bold hover:bg-orange-600 transition self-start mt-2">
              Salvar Barra do Topo
            </button>
          </form>
        </div>

        {/* BANNERS PRINCIPAIS */}
        <BannersForm urlsAtuais={banners} />
      </div>
    </div>
  );
}
