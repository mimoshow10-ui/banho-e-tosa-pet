import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import CategoriasClient from './CategoriasClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function addGrupo(formData: FormData) {
  'use server';
  const nome = (formData.get('nome') as string || '').trim();
  if (!nome) return;
  const slug = nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, '');

  await supabase.from('categorias').insert([{
    nome,
    slug,
    parent_id: null
  }]);

  revalidatePath('/admin/categorias');
  revalidatePath('/');
  redirect('/admin/categorias?msg=Grupo principal criado com sucesso!');
}

async function addSubgrupo(formData: FormData) {
  'use server';
  const nome = (formData.get('nome') as string || '').trim();
  const group_id = formData.get('group_id') as string;
  if (!nome || !group_id) return;
  const slug = nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, '');

  await supabase.from('categorias').insert([{
    nome,
    slug,
    parent_id: group_id
  }]);

  revalidatePath('/admin/categorias');
  revalidatePath('/');
  redirect('/admin/categorias?msg=Subgrupo criado com sucesso!');
}

async function editarCategoria(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const nome = (formData.get('nome') as string || '').trim();
  const parent_id = formData.get('parent_id') ? (formData.get('parent_id') as string) : null;
  if (!id || !nome) return;

  const slug = nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, '');

  const payload: any = { nome, slug };
  if (parent_id !== undefined && parent_id !== '') {
    payload.parent_id = parent_id || null;
  }

  await supabase.from('categorias').update(payload).eq('id', id);

  revalidatePath('/admin/categorias');
  revalidatePath('/');
  redirect('/admin/categorias?msg=Categoria atualizada com sucesso!');
}

async function excluirCategoria(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  if (!id) return;

  // Verificar se possui subgrupos vinculados antes de excluir
  const { data: subgrupos } = await supabase.from('categorias').select('id').eq('parent_id', id);
  if (subgrupos && subgrupos.length > 0) {
    redirect('/admin/categorias?erro=Não é possível excluir um grupo que possui subgrupos vinculados.');
  }

  await supabase.from('categorias').delete().eq('id', id);
  revalidatePath('/admin/categorias');
  revalidatePath('/');
  redirect('/admin/categorias?msg=Categoria removida com sucesso!');
}

export default async function AdminGruposSubgruposPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const params = await searchParams;

  const { data: categorias } = await supabase.from('categorias').select('*').order('nome');

  return (
    <div className="max-w-6xl space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
            <Layers size={32} className="text-primary" />
            Grupos e Subgrupos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie os Grupos principais da sua loja e seus respectivos Subgrupos em estrutura hierárquica (Estilo Loja Integrada).
          </p>
        </div>
      </div>

      {params.msg && (
        <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-2xl font-bold text-sm flex items-center gap-2">
          <CheckCircle2 size={18} />
          {params.msg}
        </div>
      )}

      {params.erro && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-2xl font-bold text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          {params.erro}
        </div>
      )}

      <CategoriasClient
        categorias={categorias || []}
        addGrupoAction={addGrupo}
        addSubgrupoAction={addSubgrupo}
        editarCategoriaAction={editarCategoria}
        excluirCategoriaAction={excluirCategoria}
      />
    </div>
  );
}
