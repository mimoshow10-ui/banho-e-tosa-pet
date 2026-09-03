import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import ImportBlingForm from '@/components/ImportBlingForm';
import ImportadorLoteModal from '@/components/ImportadorLoteModal';
import TabelaProdutosComEdicaoEmMassa from '@/components/TabelaProdutosComEdicaoEmMassa';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminProdutos(props: { searchParams: Promise<{ msg?: string; erro?: string; q?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams.q || '';

  let query = supabase.from('produtos').select('*, categorias(nome)').order('nome');
  if (q) {
    query = query.or(`nome.ilike.%${q}%,codigo_barras.ilike.%${q}%`);
  }
  const { data: produtos, error } = await query;
  const { data: categorias } = await supabase.from('categorias').select('id, nome').order('nome');

  // Descobrir quais produtos são PAI (têm filhos)
  const { data: filhos } = await supabase.from('produtos').select('parent_id').not('parent_id', 'is', null);
  const paiIds = new Set((filhos || []).map((f: any) => f.parent_id));

  return (
    <div className="flex flex-col gap-6 font-sans">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative font-bold text-xs">
          <strong>Erro do Supabase:</strong> {error.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-heading font-bold text-secondary">Produtos</h1>
            <span className="bg-orange-100 text-primary border border-orange-200 text-xs font-black px-3 py-1 rounded-full shadow-2xs">
              📦 Total: {produtos?.length || 0} produto(s)
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Gerencie os anúncios, preços, estoques e edições em massa da loja.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ImportadorLoteModal />
          <Link 
            href="/admin/produtos/novo" 
            className="bg-primary text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-orange-600 transition text-xs font-bold shadow-xs"
          >
            <Plus size={18} />
            <span>Novo Produto</span>
          </Link>
        </div>
      </div>

      {searchParams.msg && (
        <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-2xl font-bold text-xs">
          ✅ {searchParams.msg}
        </div>
      )}

      {searchParams.erro && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-2xl font-bold text-xs">
          ❌ ERRO: {searchParams.erro}
        </div>
      )}

      {/* Bloco de Importação do Bling Individual */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <h3 className="font-bold text-secondary text-sm mb-1">Importar SKU do Bling</h3>
            <p className="text-xs text-gray-500 mb-3">Digite o código SKU exato para buscar e cadastrar produto individual.</p>
            <ImportBlingForm />
          </div>
        </div>
      </div>

      {/* Bloco de Busca / Filtro */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <form action="/admin/produtos" method="GET" className="flex w-full gap-2">
          <input 
            type="text" 
            name="q" 
            defaultValue={q} 
            placeholder="Pesquisar por Nome ou SKU..." 
            className="flex-1 border border-gray-300 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary" 
          />
          <button type="submit" className="bg-gray-100 text-gray-700 font-bold py-2.5 px-6 rounded-xl hover:bg-gray-200 transition shadow-2xs text-xs border border-gray-300 cursor-pointer">
            Filtrar
          </button>
          {q && (
            <Link href="/admin/produtos" className="bg-red-100 text-red-600 font-bold py-2.5 px-4 rounded-xl hover:bg-red-200 transition shadow-2xs text-xs border border-red-200">
              Limpar
            </Link>
          )}
        </form>
      </div>

      {/* Tabela Interativa de Produtos com Seleção e Edição em Massa */}
      <TabelaProdutosComEdicaoEmMassa
        produtos={produtos || []}
        categorias={categorias || []}
        paiIds={paiIds}
      />
    </div>
  );
}
