import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Truck, Plus, CheckCircle, AlertTriangle, ShieldCheck, Settings, Trash2 } from 'lucide-react';
import { Transportadora } from '@/lib/types/checkout';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function salvarTransportadora(formData: FormData) {
  'use server';

  const id = (formData.get('id') as string) || `trans-${Date.now()}`;
  const nome = formData.get('nome') as string;
  const nome_exibicao = formData.get('nome_exibicao') as string;
  const tipo_integracao = formData.get('tipo_integracao') as Transportadora['tipo_integracao'];
  const ativo = formData.get('ativo') === 'on';
  const cep_origem = formData.get('cep_origem') as string;
  const api_key = formData.get('api_key') as string;
  const token = formData.get('token') as string;
  const client_id = formData.get('client_id') as string;
  const client_secret = formData.get('client_secret') as string;
  const prazo_adicional_dias = parseInt(formData.get('prazo_adicional_dias') as string || '0');
  const valor_adicional_reais = parseFloat(formData.get('valor_adicional_reais') as string || '0');
  const desconto_percentual = parseFloat(formData.get('desconto_percentual') as string || '0');
  const instrucoes_retirada = formData.get('instrucoes_retirada') as string;

  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'transportadoras')
    .single();

  let lista: Transportadora[] = config?.valor || [];

  const index = lista.findIndex(t => t.id === id);
  const novaTransportadora: Transportadora = {
    id,
    nome,
    nome_exibicao: nome_exibicao || nome,
    tipo_integracao,
    ativo,
    cep_origem,
    api_key,
    token,
    client_id,
    client_secret,
    prazo_adicional_dias,
    valor_adicional_reais,
    desconto_percentual,
    ordem: index >= 0 ? lista[index].ordem : lista.length + 1,
    instrucoes_retirada,
  };

  if (index >= 0) {
    lista[index] = novaTransportadora;
  } else {
    lista.push(novaTransportadora);
  }

  const { data: existente } = await supabase
    .from('configuracoes')
    .select('id')
    .eq('chave', 'transportadoras')
    .single();

  if (existente) {
    await supabase.from('configuracoes').update({ valor: lista }).eq('chave', 'transportadoras');
  } else {
    await supabase.from('configuracoes').insert({ chave: 'transportadoras', valor: lista });
  }

  revalidatePath('/admin/transportadoras');
  redirect('/admin/transportadoras?msg=Transportadora salva com sucesso!');
}

async function excluirTransportadora(formData: FormData) {
  'use server';

  const id = formData.get('id') as string;

  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'transportadoras')
    .single();

  let lista: Transportadora[] = config?.valor || [];
  lista = lista.filter(t => t.id !== id);

  await supabase.from('configuracoes').update({ valor: lista }).eq('chave', 'transportadoras');

  revalidatePath('/admin/transportadoras');
  redirect('/admin/transportadoras?msg=Transportadora removida!');
}

export default async function TransportadorasPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; test_success?: string; test_error?: string }>;
}) {
  const params = await searchParams;

  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'transportadoras')
    .single();

  let transportadoras: Transportadora[] = config?.valor || [];

  // Seed inicial padrão se estiver vazio
  if (transportadoras.length === 0) {
    transportadoras = [
      {
        id: 'trans-correios',
        nome: 'Correios (PAC e Sedex)',
        nome_exibicao: 'Entrega Padrão Correios',
        tipo_integracao: 'correios',
        ativo: true,
        cep_origem: '01000-000',
        prazo_adicional_dias: 0,
        valor_adicional_reais: 0,
        desconto_percentual: 0,
        ordem: 1,
      },
      {
        id: 'trans-retirada',
        nome: 'Retirada no Local',
        nome_exibicao: 'Retirar na Loja Física',
        tipo_integracao: 'retirada',
        ativo: true,
        cep_origem: '01000-000',
        prazo_adicional_dias: 0,
        valor_adicional_reais: 0,
        desconto_percentual: 0,
        ordem: 2,
        instrucoes_retirada: 'Retire gratuitamente em nossa loja. Traga o documento de identificação e o número do pedido.',
      }
    ];

    await supabase.from('configuracoes').upsert({ chave: 'transportadoras', valor: transportadoras });
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
            <Truck size={32} className="text-primary" />
            Entregas e Transportadoras
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cadastre serviços de frete, regras de cálculo e opção de retirada no local para o checkout.
          </p>
        </div>
      </div>

      {params.msg && (
        <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl font-bold text-sm flex items-center gap-2">
          <CheckCircle size={18} />
          {params.msg}
        </div>
      )}

      {/* Lista de Transportadoras Cadastradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {transportadoras.map((trans) => (
          <div key={trans.id} className="bg-white p-6 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-secondary text-lg flex items-center gap-2">
                    {trans.nome}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trans.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {trans.ativo ? 'ATIVA' : 'INATIVA'}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">Exibição: <strong>"{trans.nome_exibicao}"</strong></p>
                </div>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg uppercase">
                  {trans.tipo_integracao}
                </span>
              </div>

              <div className="text-xs text-gray-600 space-y-1 my-3 bg-gray-50 p-3 rounded-xl">
                <p>📍 <strong>CEP Origem:</strong> {trans.cep_origem || 'Não informado'}</p>
                {trans.prazo_adicional_dias > 0 && <p>⏱️ <strong>+ {trans.prazo_adicional_dias} dias</strong> no prazo final</p>}
                {trans.valor_adicional_reais > 0 && <p>💵 <strong>+ R$ {trans.valor_adicional_reais.toFixed(2)}</strong> na taxa</p>}
                {trans.tipo_integracao === 'retirada' && <p>🏪 <strong>Custo:</strong> R$ 0,00 (Gratuito)</p>}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100 justify-end">
              <form action={excluirTransportadora}>
                <input type="hidden" name="id" value={trans.id} />
                <button type="submit" className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Excluir">
                  <Trash2 size={16} />
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* Formulário de Cadastro / Edição com trava de Autopreenchimento */}
      <div className="bg-white p-8 rounded-2xl shadow-xs border border-border">
        <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
          <Plus size={20} className="text-primary" />
          Cadastrar / Editar Transportadora
        </h2>

        <form action={salvarTransportadora} autoComplete="off" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nome Interno</label>
            <input name="nome" required placeholder="Ex: Correios PAC" autoComplete="off" className="w-full border border-border rounded-xl p-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nome de Exibição no Checkout</label>
            <input name="nome_exibicao" placeholder="Ex: Entrega Padrão (5 a 7 dias)" autoComplete="off" className="w-full border border-border rounded-xl p-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Integração</label>
            <select name="tipo_integracao" className="w-full border border-border rounded-xl p-2.5 text-sm bg-white font-bold">
              <option value="correios">Correios (PAC / Sedex)</option>
              <option value="retirada">Retirada no Local (Custo R$ 0)</option>
              <option value="motoboy">Motoboy Express Local</option>
              <option value="jadlog">Jadlog / Transportadora Padrão</option>
              <option value="melhorenvio">Melhor Envio API</option>
              <option value="frenet">Frenet API</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">CEP de Origem do Remetente (Ex: 01000-000)</label>
            <input
              name="cep_origem"
              type="text"
              placeholder="01000-000"
              defaultValue="01000-000"
              autoComplete="off"
              className="w-full border border-border rounded-xl p-2.5 text-sm font-bold text-secondary"
            />
          </div>

          <div className="md:col-span-2 border-t border-border pt-4">
            <h3 className="text-sm font-bold text-secondary mb-2 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-green-600" />
              Credenciais da API (Protegidas)
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Chave da API / API Key (Opcional)</label>
            <input name="api_key" type="password" placeholder="••••••••••••" autoComplete="new-password" className="w-full border border-border rounded-xl p-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Token de API (Melhor Envio / Correios)</label>
            <input name="token" type="password" placeholder="Token da API..." autoComplete="new-password" className="w-full border border-border rounded-xl p-2.5 text-sm" />
          </div>

          <div className="md:col-span-2 border-t border-border pt-4">
            <h3 className="text-sm font-bold text-secondary mb-2 flex items-center gap-1.5">
              <Settings size={16} className="text-blue-600" />
              Ajustes Finos de Prazo e Valor
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Prazo Adicional (Dias Úteis)</label>
            <input name="prazo_adicional_dias" type="number" defaultValue="0" className="w-full border border-border rounded-xl p-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Valor Adicional (R$)</label>
            <input name="valor_adicional_reais" type="number" step="0.01" defaultValue="0.00" className="w-full border border-border rounded-xl p-2.5 text-sm" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Instruções para Retirada no Local (Se aplicável)</label>
            <textarea name="instrucoes_retirada" placeholder="Ex: Retirada de Segunda a Sexta das 09h às 18h com documento." className="w-full border border-border rounded-xl p-2.5 text-sm" />
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <input id="ativo" name="ativo" type="checkbox" defaultChecked className="w-4 h-4 accent-primary" />
            <label htmlFor="ativo" className="text-sm font-bold text-secondary">Integração Ativa no Checkout</label>
          </div>

          <button type="submit" className="bg-primary text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition md:col-span-2 shadow-sm mt-2">
            Salvar Integração de Frete
          </button>
        </form>
      </div>
    </div>
  );
}
