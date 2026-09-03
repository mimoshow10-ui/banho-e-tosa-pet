import { supabase } from '@/lib/supabase';
import { salvarTopBar, salvarPopup } from './actions';
import BannersForm from './BannersForm';
import PopupImageFieldWithAI from '@/components/PopupImageFieldWithAI';
import { Megaphone, Layout, Sparkles, Sliders, Image as ImageIcon, Info, Upload, CheckCircle2, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminMarketing({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const params = await searchParams;

  const { data: configs } = await supabase.from('configuracoes').select('*');

  const topbar = configs?.find(c => c.chave === 'marketing_topbar')?.valor || { texto: 'Frete grátis acima de R$ 99,00', visibilidade: 'todas', cor: 'bg-primary' };
  const banners = configs?.find(c => c.chave === 'marketing_banners')?.valor?.urls || ['/banner-pet.jpg'];
  const popup = configs?.find(c => c.chave === 'marketing_popup')?.valor || {
    ativo: false,
    imagem_url: '',
    link_destino: '',
    titulo: 'Ganhe 10% OFF na Primeira Compra!',
    subtitulo: 'Use o cupom BEMVINDO10 no seu carrinho.',
    gatilho: 'tempo',
    tempo_exibicao_segundos: 3,
    onde_exibir: 'home',
    frequencia: 'uma_vez_por_sessao'
  };

  return (
    <div className="max-w-5xl space-y-8 font-sans">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
            <Megaphone size={32} className="text-primary" />
            Marketing, Banners e Pop-ups
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie avisos de topo, carrossel de banners e pop-ups promocionais com guia de dimensões para designers.
          </p>
        </div>
      </div>

      {params.msg && (
        <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl font-bold text-sm flex items-center gap-2">
          <CheckCircle2 size={18} />
          {params.msg}
        </div>
      )}

      {params.erro && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-xl font-bold text-sm">
          ⚠️ {params.erro}
        </div>
      )}

      {/* ── GUIA DE TAMANHOS DE BANNERS PARA O DESIGNER ── */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex items-center gap-2 border-b border-purple-700/60 pb-3">
          <Info size={22} className="text-amber-300" />
          <h2 className="text-lg font-bold">Guia de Dimensões Recomendadas para o Designer</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-1">
            <span className="bg-amber-400 text-purple-950 font-black px-2 py-0.5 rounded text-[10px] uppercase block w-fit mb-1">
              💻 Carrossel Desktop (Oficial)
            </span>
            <p className="text-base font-mono font-bold text-amber-200">1920 x 300 px</p>
            <p className="text-purple-200">Proporção 16:2.5 (Slim Elegante). Formatos: PNG, JPG ou WebP até 500 KB.</p>
          </div>

          <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-1">
            <span className="bg-amber-400 text-purple-950 font-black px-2 py-0.5 rounded text-[10px] uppercase block w-fit mb-1">
              📱 Carrossel Mobile (Oficial)
            </span>
            <p className="text-base font-mono font-bold text-amber-200">800 x 600 px</p>
            <p className="text-purple-200">Proporção 4:3 retangular para ótima visualização em celulares.</p>
          </div>

          <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-1">
            <span className="bg-amber-400 text-purple-950 font-black px-2 py-0.5 rounded text-[10px] uppercase block w-fit mb-1">
              🖼️ Pop-up Promocional (Oficial)
            </span>
            <p className="text-base font-mono font-bold text-amber-200">800 x 800 px</p>
            <p className="text-purple-200">Ou 600 x 800 px (Vertical 3:4) para janelas modais promocionais.</p>
          </div>

        </div>
      </div>

      <div className="space-y-8">
        
        {/* ── TOP BAR (BARRA DE AVISO DO TOPO) ── */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Layout size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-secondary">1. Barra de Aviso do Topo (Top Bar)</h2>
          </div>
          
          <form action={salvarTopBar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Frase de Destaque da Barra *</label>
              <input
                type="text"
                name="texto"
                defaultValue={topbar.texto}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Onde Exibir?</label>
              <select name="visibilidade" defaultValue={topbar.visibilidade} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white font-bold">
                <option value="todas">Em todas as páginas</option>
                <option value="home">Somente na Página Inicial (Home)</option>
                <option value="nenhuma">Desativar (Esconder barra)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Cor de Fundo da Barra</label>
              <select name="cor" defaultValue={topbar.cor} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white font-bold">
                <option value="bg-primary">Laranja Padrão (Tema da Loja)</option>
                <option value="bg-secondary">Azul Marinho Escuro</option>
                <option value="bg-purple-700">Roxo Promocional</option>
                <option value="bg-green-600">Verde Oferta</option>
                <option value="bg-red-600">Vermelho Urgência</option>
                <option value="bg-black">Preto Minimalista</option>
              </select>
            </div>

            <button type="submit" className="bg-primary text-white py-2.5 px-6 rounded-xl font-bold hover:bg-orange-600 transition md:col-span-2 shadow-xs w-fit">
              Salvar Barra do Topo
            </button>
          </form>
        </div>

        {/* ── BANNERS DO CARROSSEL ── */}
        <BannersForm urlsAtuais={banners} />

        {/* ── POP-UP PROMOCIONAL MODAL (NOVO) ── */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-purple-600" />
              <h2 className="text-lg font-bold text-secondary">3. Pop-up Promocional Modal</h2>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${popup.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
              {popup.ativo ? 'POP-UP ATIVO' : 'INATIVO'}
            </span>
          </div>

          <form action={salvarPopup} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Status Ativo/Inativo */}
            <div className="flex items-center gap-2 md:col-span-2 bg-purple-50 p-3.5 rounded-xl border border-purple-100">
              <input
                id="popup_ativo"
                name="ativo"
                type="checkbox"
                defaultChecked={popup.ativo}
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
              <label htmlFor="popup_ativo" className="text-sm font-bold text-purple-950 cursor-pointer">
                Ativar Pop-up Promocional na Loja
              </label>
            </div>

            {/* Imagem do Pop-up com Gerador de I.A. */}
            <div className="md:col-span-2">
              <PopupImageFieldWithAI initialUrl={popup.imagem_url || ''} />
            </div>

            {/* Link de Destino ao Clicar no Pop-up */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Link de Destino ao Clicar no Pop-up (Opcional)
              </label>
              <input
                name="link_destino"
                type="text"
                defaultValue={popup.link_destino || ''}
                placeholder="Ex: /categoria/lacinhos ou /produto/nome-do-produto"
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white"
              />
            </div>

            {/* Título e Subtítulo Alternativo */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Título Alternativo (Sem imagem)</label>
              <input
                name="titulo"
                type="text"
                defaultValue={popup.titulo || ''}
                placeholder="Ex: Ganhe 10% OFF na 1ª compra!"
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Subtítulo / Descrição Alternativa</label>
              <input
                name="subtitulo"
                type="text"
                defaultValue={popup.subtitulo || ''}
                placeholder="Ex: Use o cupom BEMVINDO10 no carrinho."
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white"
              />
            </div>

            {/* Gatilhos de Exibição */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Gatilho de Exibição (Quando Abrir?)</label>
              <select name="gatilho" defaultValue={popup.gatilho || 'tempo'} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white font-bold">
                <option value="tempo">Após X Segundos na página</option>
                <option value="imediato">Imediato (Ao carregar a página)</option>
                <option value="saida">Ao tentar sair do site (Exit Intent)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tempo de Espera (Segundos)</label>
              <input
                name="tempo_exibicao_segundos"
                type="number"
                defaultValue={popup.tempo_exibicao_segundos || 3}
                placeholder="Ex: 3"
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white"
              />
            </div>

            {/* Onde Exibir */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Onde Exibir o Pop-up?</label>
              <select name="onde_exibir" defaultValue={popup.onde_exibir || 'home'} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white">
                <option value="home">Somente na Página Inicial (Home)</option>
                <option value="todas">Em todas as páginas da loja</option>
                <option value="carrinho">Somente na página de Carrinho</option>
                <option value="produtos">Somente nas páginas de Produtos</option>
              </select>
            </div>

            {/* Frequência */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Frequência para o Cliente</label>
              <select name="frequencia" defaultValue={popup.frequencia || 'uma_vez_por_sessao'} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white">
                <option value="uma_vez_por_sessao">1 vez por sessão (Recomendado)</option>
                <option value="uma_vez_por_dia">1 vez por dia (24h)</option>
                <option value="sempre">Sempre que navegar</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition md:col-span-2 shadow-sm mt-2 text-sm flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              Salvar Pop-up Promocional
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
