'use server'

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function salvarTopBar(formData: FormData) {
  const texto = formData.get('texto') as string;
  const visibilidade = formData.get('visibilidade') as string;

  const { error } = await supabase.from('configuracoes').upsert(
    { chave: 'marketing_topbar', valor: { texto, visibilidade } },
    { onConflict: 'chave' }
  );

  if (error) {
    redirect('/admin/marketing?erro=Erro ao salvar Top Bar');
  }

  revalidatePath('/', 'layout');
  redirect('/admin/marketing?msg=Top Bar atualizado com sucesso');
}

export async function salvarBanners(formData: FormData) {
  // Extract URLs array
  const urls: string[] = [];
  for (let [key, value] of formData.entries()) {
    if (key.startsWith('banner_url_')) {
      urls.push(value as string);
    }
  }

  const { error } = await supabase.from('configuracoes').upsert(
    { chave: 'marketing_banners', valor: { urls } },
    { onConflict: 'chave' }
  );

  if (error) {
    redirect('/admin/marketing?erro=Erro ao salvar Banners');
  }

  revalidatePath('/');
  redirect('/admin/marketing?msg=Banners atualizados com sucesso');
}
