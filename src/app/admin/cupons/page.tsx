import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Ticket, Plus, CheckCircle, Tag, Calendar, DollarSign, Percent, ShieldCheck, Trash2 } from 'lucide-react';
import { Cupom } from '@/lib/types/coupon';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function salvarCupom(formData: FormData) {
  'use server';

  const id = (formData.get('id') as string) || `cupom-${Date.now()}`;
  const nome_interno = formData.get('nome_interno') as string;
  const codigoRaw = formData.get('codigo') as string;
  const codigo = codigoRaw.trim().toUpperCase().replace(/\s+/g, '');
  const tipo_desconto = formData.get('tipo_desconto') as Cupom['tipo_desconto'];
  const valor_desconto = parseFloat(formData.get('valor_desconto') as string || '0');
  const desconto_maximo_reais = formData.get('desconto_maximo_reais') ? parseFloat(formData.get('desconto_maximo_reais') as string) : null;
  const compra_minima_reais = formData.get('compra_minima_reais') ? parseFloat(formData.get('compra_minima_reais') as string) : null;
  const data_inicio = formData.get('data_inicio') as string || null;
  const data_fim = formData.get('data_fim') as string || null;
  const ativo = formData.get('ativo') === 'on';
  const limite_usos_total = formData.get('limite_usos_total') ? parseInt(formData.get('limite_usos_total') as string) : null;
  const permitir_produtos_promocionais = formData.get('permitir_produtos_promocionais') === 'on';
  const permitir_acumulo = formData.get('permitir_acumulo') === 'on';
  const tipo_elegibilidade = (formData.get('tipo_elegibilidade') as Cupom['tipo_elegibilidade']) || 'todos';

  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'cupons_db')
    .single();

  let lista: Cupom[] = config?.valor || [];

  const index = lista.findIndex(c => c.id === id);
  const novoCupom: Cupom = {
    id,
    nome_interno,
    codigo,
    tipo_desconto,
    valor_desconto,
    desconto_maximo_reais,
    compra_minima_reais,
    data_inicio,
    data_fim,
    ativo,
    limite_usos_total,
    usos_realizados: index >= 0 ? lista[index].usos_realizados || 0 : 0,
    permitir_produtos_promocionais,
    permitir_acumulo,
    tipo_elegibilidade,
    criado_em: index >= 0 ? lista[index].criado_em : new Date().toISOString(),
  };

  if (index >= 0) {
    lista[index] = novoCupom;
  } else {
    lista.push(novoCupom);
  }

  const { data: existente } = await supabase
    .from('configuracoes')
    .select('id')
    .eq('chave', 'cupons_db')
    .single();

  if (existente) {
    await supabase.from('configuracoes').update({ valor: lista }).eq('chave', 'cupons_db');
  } else {
    await supabase.from('configuracoes').insert({ chave: 'cupons_db', valor: lista });
  }

  revalidatePath('/admin/cupons');
  redirect('/admin/cupons?msg=Cupom salvo com sucesso!');
}

async function excluirCupom(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;

  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'cupons_db')
    .single();

  let lista: Cupom[] = config?.valor || [];
  lista = lista.filter(c => c.id !== id);

  await supabase.from('configuracoes').update({ valor: lista }).eq('chave', 'cupons_db');

  revalidatePath('/admin/cupons');
  redirect('/admin/cupons?msg=Cupom removido!');
}

export default async function AdminCuponsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const params = await searchParams;

  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'cupons_db')
    .single();

  let cupons: Cupom[] = config?.valor || [];

  // Seed inicial padrão se estiver vazio
  if (cupons.length === 0) {
    cupons = [
      {
        id: 'cupom-bemvindo',
        nome_interno: 'Cupom de Boas-Vindas 10%',
        codigo: 'BEMVINDO10',
        tipo_desconto: 'percentual',
        valor_desconto: 10,
        compra_minima_reais: 50,
        desconto_maximo_reais: 30,
        ativo: true,
        usos_realizados: 0,
        permitir_produtos_promocionais: true,
        tipo_elegibilidade: 'todos',
        criado_em: new Date().toISOString(),
      }
    ];

    await supabase.from('configuracoes').upsert({ chave: 'cupons_db', valor: cupons });
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
            <Ticket size={32} className="text-primary" />
            Cupons de Desconto
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cadastre cupons de desconto (percentual, valor fixo ou frete grátis) com regras e limites seguros.
          </p>
        </div>
      </div>

      {params.msg && (
        <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl font-bold text-sm flex items-center gap-2">
          <CheckCircle size={18} />
          {params.msg}
        </div>
      )}

      {/* Tabela de Cupons Cadastrados */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-500 font-bold">
          <span>TOTAL DE CUPONS: {cupons.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider font-bold border-b border-gray-200">
              <tr>
                <th className="p-4">Código</th>
                <th className="p-4">Nome Interno</th>
                <th className="p-4">Tipo & Desconto</th>
                <th className="p-4">Regras</th>
                <th className="p-4">Usos</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {cupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-mono font-black text-secondary text-base">
                    <span className="bg-orange-100 text-primary px-2.5 py-1 rounded-lg border border-orange-200">
                      {c.codigo}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-800">
                    {c.nome_interno}
                  </td>
                  <td className="p-4 font-bold text-gray-700">
                    {c.tipo_desconto === 'percentual' && `${c.valor_desconto}% OFF`}
                    {c.tipo_desconto === 'fixo' && `R$ ${c.valor_desconto.toFixed(2)} OFF`}
                    {c.tipo_desconto === 'frete_gratis' && `Frete Grátis`}
                  </td>
                  <td className="p-4 text-xs text-gray-500 space-y-0.5">
                    {c.compra_minima_reais && <p>Min: R$ {c.compra_minima_reais.toFixed(2)}</p>}
                    {c.desconto_maximo_reais && <p>Teto: R$ {c.desconto_maximo_reais.toFixed(2)}</p>}
                  </td>
                  <td className="p-4 text-xs font-bold text-gray-600">
                    {c.usos_realizados} / {c.limite_usos_total || '∞'}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${c.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {c.ativo ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <form action={excluirCupom}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulário de Cadastro / Edição */}
      <div className="bg-white p-8 rounded-2xl shadow-xs border border-gray-200">
        <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
          <Plus size={20} className="text-primary" />
          Cadastrar Novo Cupom
        </h2>

        <form action={salvarCupom} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nome Interno do Cupom *</label>
            <input name="nome_interno" required placeholder="Ex: Promoção Dia das Crianças" className="w-full border border-gray-300 rounded-xl p-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Código do Cupom (Sem Espaços) *</label>
            <input name="codigo" required placeholder="Ex: CRIANCAS10" className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-mono font-bold uppercase" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Desconto *</label>
            <select name="tipo_desconto" className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white font-bold">
              <option value="percentual">Desconto Percentual (%)</option>
              <option value="fixo">Desconto em Valor Fixo (R$)</option>
              <option value="frete_gratis">Frete Grátis</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Valor do Desconto (% ou R$) *</label>
            <input name="valor_desconto" type="number" step="0.01" required placeholder="Ex: 10 ou 20.00" className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-bold" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Desconto Máximo / Teto (R$) (Opcional)</label>
            <input name="desconto_maximo_reais" type="number" step="0.01" placeholder="Ex: 50.00 (Teto de 20% OFF)" className="w-full border border-gray-300 rounded-xl p-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Compra Mínima no Pedido (R$) (Opcional)</label>
            <input name="compra_minima_reais" type="number" step="0.01" placeholder="Ex: 100.00" className="w-full border border-gray-300 rounded-xl p-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Data / Hora de Início (Opcional)</label>
            <input name="data_inicio" type="datetime-local" className="w-full border border-gray-300 rounded-xl p-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Data / Hora de Validade / Fim (Opcional)</label>
            <input name="data_fim" type="datetime-local" className="w-full border border-gray-300 rounded-xl p-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Limite Total de Usos (Opcional)</label>
            <input name="limite_usos_total" type="number" placeholder="Ex: 100 (Deixar em branco para ilimitado)" className="w-full border border-gray-300 rounded-xl p-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Aplica-se em: *</label>
            <select name="tipo_elegibilidade" className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white">
              <option value="todos">Todos os Produtos da Loja</option>
              <option value="grupos">Grupos Específicos</option>
              <option value="subgrupos">Subgrupos Específicos</option>
              <option value="produtos">Produtos Específicos</option>
              <option value="skus">SKUs / Variações Específicas</option>
            </select>
          </div>

          <div className="flex items-center gap-2 md:col-span-2 pt-2">
            <input id="permitir_produtos_promocionais" name="permitir_produtos_promocionais" type="checkbox" defaultChecked className="w-4 h-4 accent-primary cursor-pointer" />
            <label htmlFor="permitir_produtos_promocionais" className="text-xs font-bold text-gray-700 cursor-pointer">
              Permitir aplicação do cupom sobre produtos que JÁ estão em promoção
            </label>
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <input id="permitir_acumulo" name="permitir_acumulo" type="checkbox" className="w-4 h-4 accent-primary cursor-pointer" />
            <label htmlFor="permitir_acumulo" className="text-xs font-bold text-gray-700 cursor-pointer">
              Permitir somar/acumular este cupom com outros cupons no mesmo pedido
            </label>
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <input id="ativo" name="ativo" type="checkbox" defaultChecked className="w-4 h-4 accent-primary" />
            <label htmlFor="ativo" className="text-sm font-bold text-secondary">Cupom Ativo para Utilização</label>
          </div>

          <button type="submit" className="bg-primary text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition md:col-span-2 shadow-sm mt-2">
            Salvar Cupom de Desconto
          </button>
        </form>
      </div>
    </div>
  );
}
