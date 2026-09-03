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
    const file = formData.get(`banner_file_${i}`) as File;
    if (file && file.size > 0) {
      const buffer = await file.arrayBuffer();
      const ext = file.name.split('.').pop();
      const fileName = `banner_${Date.now()}_${i}.${ext}`;
      
      const { data, error } = await supabase.storage
        .from('produtos-fotos')
        .upload(`banners/${fileName}`, buffer, {
          contentType: file.type,
          upsert: true
        });

      if (data) {
        const { data: pubData } = supabase.storage.from('produtos-fotos').getPublicUrl(`banners/${fileName}`);
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

export async function salvarPopup(formData: FormData) {
  const ativo = formData.get('ativo') === 'on';
  const imagem_url_input = formData.get('imagem_url') as string;
  const link_destino = formData.get('link_destino') as string;
  const titulo = formData.get('titulo') as string;
  const subtitulo = formData.get('subtitulo') as string;
  const gatilho = formData.get('gatilho') as string || 'tempo';
  const tempo_exibicao_segundos = parseInt(formData.get('tempo_exibicao_segundos') as string || '3');
  const onde_exibir = formData.get('onde_exibir') as string || 'home';
  const frequencia = formData.get('frequencia') as string || 'uma_vez_por_sessao';

  let imagem_url = imagem_url_input;

  // Upload de arquivo de imagem do Pop-up se enviado
  const popupFile = formData.get('popup_file') as File;
  if (popupFile && popupFile.size > 0) {
    const buffer = await popupFile.arrayBuffer();
    const ext = popupFile.name.split('.').pop();
    const fileName = `popup_${Date.now()}.${ext}`;

    const { data } = await supabase.storage
      .from('produtos-fotos')
      .upload(`popups/${fileName}`, buffer, {
        contentType: popupFile.type,
        upsert: true
      });

    if (data) {
      const { data: pubData } = supabase.storage.from('produtos-fotos').getPublicUrl(`popups/${fileName}`);
      imagem_url = pubData.publicUrl;
    }
  }

  const payload = {
    ativo,
    imagem_url: imagem_url || '',
    link_destino: link_destino || '',
    titulo: titulo || '',
    subtitulo: subtitulo || '',
    gatilho,
    tempo_exibicao_segundos,
    onde_exibir,
    frequencia,
  };

  const { error } = await supabase.from('configuracoes').upsert(
    { chave: 'marketing_popup', valor: payload },
    { onConflict: 'chave' }
  );

  if (error) redirect('/admin/marketing?erro=Erro ao salvar Pop-up Promocional');

  revalidatePath('/', 'layout');
  redirect('/admin/marketing?msg=Pop-up Promocional salvo com sucesso!');
}
