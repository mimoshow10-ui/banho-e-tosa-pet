import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Folder, FolderPlus, Layers, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function addGrupo(formData: FormData) {
  'use server';
  const nome = formData.get('nome') as string;
  const slug = nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  await supabase.from('categorias').insert([{
    nome,
    slug,
    parent_id: null
  }]);

  revalidatePath('/admin/categorias');
  redirect('/admin/categorias?msg=Grupo criado com sucesso!');
}

async function addSubgrupo(formData: FormData) {
  'use server';
  const nome = formData.get('nome') as string;
  const group_id = formData.get('group_id') as string;
  const slug = nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (!group_id) return;

  await supabase.from('categorias').insert([{
    nome,
    slug,
    parent_id: group_id
  }]);

  revalidatePath('/admin/categorias');
  redirect('/admin/categorias?msg=Subgrupo criado com sucesso!');
}

async function excluirCategoria(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  if (!id) return;

  // Verificar se tem subgrupos vinculados antes de excluir
  const { data: subgrupos } = await supabase.from('categorias').select('id').eq('parent_id', id);
  if (subgrupos && subgrupos.length > 0) {
    redirect('/admin/categorias?erro=Não é possível excluir um grupo que possui subgrupos vinculados.');
  }

  await supabase.from('categorias').delete().eq('id', id);
  revalidatePath('/admin/categorias');
  redirect('/admin/categorias?msg=Item removido com sucesso!');
}

export default async function AdminGruposSubgruposPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const params = await searchParams;

  const { data: categorias } = await supabase.from('categorias').select('*').order('nome');

  const grupos = categorias?.filter(c => !c.parent_id) || [];
  const subgrupos = categorias?.filter(c => c.parent_id) || [];

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
            <Layers size={32} className="text-primary" />
            Grupos e Subgrupos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie os Grupos principais da loja e seus respetivos Subgrupos de forma independente.
          </p>
        </div>
      </div>

      {params.msg && (
        <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl font-bold text-sm">
          ✅ {params.msg}
        </div>
      )}

      {params.erro && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-xl font-bold text-sm">
          ⚠️ {params.erro}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ── BLOCO 1: GRUPOS ── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
              <Folder className="text-primary" size={22} />
              1. Grupos (Principais)
            </h2>
            <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2.5 py-1 rounded-full">
              {grupos.length} Grupos
            </span>
          </div>

          {/* Form Novo Grupo */}
          <form action={addGrupo} className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wide">Cadastrar Novo Grupo</h3>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Grupo *</label>
              <input
                name="nome"
                type="text"
                required
                placeholder="Ex: Adesivos Pet"
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-xs"
            >
              Salvar Grupo
            </button>
          </form>

          {/* Lista de Grupos */}
          <div>
            <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wide mb-3">Lista de Grupos Cadastrados</h3>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
              {grupos.map((grupo) => (
                <div key={grupo.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition text-sm">
                  <div>
                    <span className="font-bold text-secondary">{grupo.nome}</span>
                    <span className="text-xs text-gray-400 block font-mono">/categoria/{grupo.slug}</span>
                  </div>
                  <form action={excluirCategoria}>
                    <input type="hidden" name="id" value={grupo.id} />
                    <button type="submit" className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir Grupo">
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BLOCO 2: SUBGRUPOS ── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
              <FolderPlus className="text-purple-600" size={22} />
              2. Subgrupos
            </h2>
            <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full">
              {subgrupos.length} Subgrupos
            </span>
          </div>

          {/* Form Novo Subgrupo */}
          <form action={addSubgrupo} className="space-y-4 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
            <h3 className="font-bold text-xs text-purple-900 uppercase tracking-wide">Cadastrar Novo Subgrupo</h3>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Subgrupo *</label>
              <input
                name="nome"
                type="text"
                required
                placeholder="Ex: Piercings"
                className="w-full border border-purple-200 rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Pertence ao Grupo: *</label>
              <select
                name="group_id"
                required
                className="w-full border border-purple-200 rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-secondary"
              >
                <option value="">Selecione o Grupo pai...</option>
                {grupos.map(g => (
                  <option key={g.id} value={g.id}>{g.nome}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-xs"
            >
              Salvar Subgrupo
            </button>
          </form>

          {/* Lista de Subgrupos */}
          <div>
            <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wide mb-3">Lista de Subgrupos Cadastrados</h3>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
              {subgrupos.map((sub) => {
                const pai = grupos.find(g => g.id === sub.parent_id);
                return (
                  <div key={sub.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition text-sm">
                    <div>
                      <span className="font-bold text-purple-900">{sub.nome}</span>
                      <span className="text-xs text-gray-500 block font-medium">
                        Grupo: <strong className="text-secondary">{pai ? pai.nome : 'Sem Grupo'}</strong>
                      </span>
                    </div>
                    <form action={excluirCategoria}>
                      <input type="hidden" name="id" value={sub.id} />
                      <button type="submit" className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir Subgrupo">
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
