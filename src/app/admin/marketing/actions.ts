'use server'

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function salvarTopBar(formData: FormData) {
  const texto = formData.get('texto') as string;
  const visibilidade = formData.get('visibilidade') as string;
  const cor = formData.get('cor') as string || 'bg-primary';

  const { error } = await supabase.from('configuracoes').upsert(
    { chave: 'marketing_topbar', valor: { texto, visibilidade, cor } },
    { onConflict: 'chave' }
  );

  if (error) redirect('/admin/marketing?erro=Erro ao salvar Top Bar');

  revalidatePath('/', 'layout');
  redirect('/admin/marketing?msg=Top Bar atualizado com sucesso');
}

export async function salvarBanners(formData: FormData) {
  const urlsFiltradas: string[] = [];

  // Mantém as URLs antigas que não foram apagadas
  const antigasStr = formData.get('urls_antigas') as string;
  if (antigasStr) {
    try {
      const antigas = JSON.parse(antigasStr);
      urlsFiltradas.push(...antigas);
    } catch(e) {}
  }

  // Faz upload dos novos arquivos
  for (let i = 0; i < 10; i++) {
    const file = formData.get(\anner_file_\\) as File;
    if (file && file.size > 0) {
      const buffer = await file.arrayBuffer();
      const ext = file.name.split('.').pop();
      const fileName = \anner_\_\.\\;
      
      const { data, error } = await supabase.storage
        .from('produtos-fotos')
        .upload(\anners/\\, buffer, {
          contentType: file.type,
          upsert: true
        });

      if (data) {
        const { data: pubData } = supabase.storage.from('produtos-fotos').getPublicUrl(\anners/\\);
        urlsFiltradas.push(pubData.publicUrl);
      }
    }
  }

  const { error } = await supabase.from('configuracoes').upsert(
    { chave: 'marketing_banners', valor: { urls: urlsFiltradas } },
    { onConflict: 'chave' }
  );

  if (error) redirect('/admin/marketing?erro=Erro ao salvar Banners');

  revalidatePath('/');
  redirect('/admin/marketing?msg=Banners atualizados com sucesso');
}
