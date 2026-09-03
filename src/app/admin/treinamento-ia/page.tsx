import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Bot, Sparkles, Save, HelpCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function salvarTreinamento(formData: FormData) {
  'use server';

  const instrucoes = formData.get('instrucoes') as string;
  const faq = formData.get('faq') as string;
  const apiKey = formData.get('api_key') as string;

  const payload = {
    instrucoes,
    faq,
    api_key: apiKey
  };

  const { data: existente } = await supabase
    .from('configuracoes')
    .select('id')
    .eq('chave', 'treinamento_ia')
    .single();

  if (existente) {
    await supabase.from('configuracoes').update({ valor: payload }).eq('chave', 'treinamento_ia');
  } else {
    await supabase.from('configuracoes').insert({ chave: 'treinamento_ia', valor: payload });
  }

  revalidatePath('/admin/treinamento-ia');
  revalidatePath('/produto/[slug]');
  redirect('/admin/treinamento-ia?msg=Treinamento da IA salvo com sucesso!');
}

export default async function TreinamentoIAPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const params = await searchParams;

  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'treinamento_ia')
    .single();

  const valor = config?.valor || {
    instrucoes: 'Somos a Banho e Tosa Pet. Responda sempre de forma gentil, profissional e voltada a tirar dúvidas dos clientes de pet shop e estética animal.',
    faq: 'P: Qual o prazo de envio?\nR: Postamos os pedidos em até 24h úteis após a confirmação.\n\nP: Os adesivos grudam bem?\nR: Sim! Nossos adesivos em EVA usam cola especial própria para fixação nos pelos sem machucar o animal.',
    api_key: ''
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
            <Bot size={32} className="text-purple-600" />
            Treinamento do Robô assistente (IA)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure o conhecimento, tom de voz e respostas do assistente virtual da loja.
          </p>
        </div>
      </div>

      {params.msg && (
        <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl font-bold text-sm">
          ✅ {params.msg}
        </div>
      )}

      <form action={salvarTreinamento} className="bg-white p-8 rounded-2xl shadow-sm border border-border space-y-6">
        
        {/* Instruções Gerais */}
        <div>
          <label className="block text-sm font-bold text-secondary mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-purple-600" />
            Instruções Principais (Tom de Voz e Regras da Loja)
          </label>
          <textarea
            name="instrucoes"
            rows={4}
            defaultValue={valor.instrucoes}
            placeholder="Ex: Responda de forma amigável, destacando que nossos produtos são fabricados em EVA atóxico..."
            className="w-full border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Como a IA deve se comportar e apresentar a empresa para os clientes na página do produto.
          </p>
        </div>

        {/* Base de Conhecimento e Perguntas Frequentes */}
        <div>
          <label className="block text-sm font-bold text-secondary mb-2 flex items-center gap-2">
            <HelpCircle size={16} className="text-purple-600" />
            Perguntas & Respostas Frequentes (FAQ de Treinamento)
          </label>
          <textarea
            name="faq"
            rows={6}
            defaultValue={valor.faq}
            placeholder="P: Como aplicar os laços?\nR: Nossos laços já vêm com anilha elástica de silicone..."
            className="w-full border border-border rounded-xl p-3 text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Digite perguntas e respostas em formato livre. O robô usará estas informações para responder os clientes.
          </p>
        </div>

        {/* Chave de API OpenAI (Opcional) */}
        <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100">
          <label className="block text-xs font-bold text-purple-900 mb-1">
            Chave de API OpenAI (Opcional - GPT-3.5/4)
          </label>
          <input
            name="api_key"
            type="password"
            defaultValue={valor.api_key || ''}
            placeholder="sk-..."
            className="w-full border border-purple-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          />
          <p className="text-[11px] text-purple-700 mt-1">
            Se preenchida, o assistente usará o modelo GPT da OpenAI. Caso fique em branco, utilizará a inteligência integrada padrão do sistema sem custo extra.
          </p>
        </div>

        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl transition flex items-center gap-2 text-sm shadow-md"
        >
          <Save size={18} />
          Salvar Treinamento da IA
        </button>
      </form>
    </div>
  );
}
