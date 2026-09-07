'use server'

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function salvarTopBar(formData: FormData) {
  try {
    const texto = formData.get('texto') as string;
    const visibilidade = formData.get('visibilidade') as string;
    const cor = formData.get('cor') as string || 'bg-primary';

    const { error } = await supabase.from('configuracoes').upsert(
      { chave: 'marketing_topbar', valor: { texto, visibilidade, cor } },
      { onConflict: 'chave' }
    );

    if (error) return { sucesso: false, erro: 'Erro ao salvar Top Bar: ' + error.message };

    revalidatePath('/', 'layout');
    revalidatePath('/admin/marketing');
    return { sucesso: true, mensagem: 'Top Bar atualizado com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao processar alteração do Top Bar.' };
  }
}

export async function salvarBanners(formData: FormData) {
  try {
    const itemsFiltrados: Array<{ url: string; link_url: string }> = [];

    const bannersJsonStr = formData.get('banners_json') as string;
    if (bannersJsonStr) {
      try {
        const itemsExistentes = JSON.parse(bannersJsonStr);
        if (Array.isArray(itemsExistentes)) {
          itemsFiltrados.push(...itemsExistentes.map(item => ({
            url: typeof item === 'string' ? item : item.url,
            link_url: typeof item === 'string' ? '' : (item.link_url || '')
          })));
        }
      } catch (e) {}
    }

    for (let i = 0; i < 10; i++) {
      const file = formData.get(`banner_file_${i}`) as File;
      const linkUrl = (formData.get(`banner_file_link_${i}`) as string) || '';

      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `banner_${Date.now()}_${i}.${ext}`;
        
        const { data } = await supabase.storage
          .from('produtos-fotos')
          .upload(`banners/${fileName}`, buffer, {
            contentType: file.type,
            upsert: true
          });

        if (data) {
          const { data: pubData } = supabase.storage.from('produtos-fotos').getPublicUrl(`banners/${fileName}`);
          itemsFiltrados.push({
            url: pubData.publicUrl,
            link_url: linkUrl
          });
        }
      }
    }

    const urlsList = itemsFiltrados.map(b => b.url);

    const { error } = await supabase.from('configuracoes').upsert(
      { chave: 'marketing_banners', valor: { items: itemsFiltrados, urls: urlsList } },
      { onConflict: 'chave' }
    );

    if (error) return { sucesso: false, erro: 'Erro ao salvar Banners: ' + error.message };

    revalidatePath('/');
    revalidatePath('/admin/marketing');
    return { sucesso: true, mensagem: 'Carrossel de banners e ordens salvos com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao processar banners.' };
  }
}

export async function salvarPopup(formData: FormData) {
  try {
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

    const popupFile = formData.get('popup_file') as File;
    if (popupFile && popupFile.size > 0) {
      const buffer = await popupFile.arrayBuffer();
      const ext = popupFile.name.split('.').pop() || 'jpg';
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

    if (error) return { sucesso: false, erro: 'Erro ao salvar Pop-up: ' + error.message };

    revalidatePath('/', 'layout');
    revalidatePath('/admin/marketing');
    return { sucesso: true, mensagem: 'Pop-up Promocional salvo com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao processar Pop-up.' };
  }
}

export async function salvarEmailMarketingConfig(formData: FormData) {
  try {
    const ativo = formData.get('ativo') === 'on';
    const desconto_valor = parseFloat(formData.get('desconto_valor') as string || '10');
    const desconto_tipo = (formData.get('desconto_tipo') as string) || 'percentual';
    const validade_dias = parseInt(formData.get('validade_dias') as string || '15');
    const assunto = (formData.get('assunto') as string) || '';
    const mensagem = (formData.get('mensagem') as string) || '';
    let banner_url = (formData.get('banner_url_atual') as string) || '';

    const bannerFile = formData.get('banner_file') as File;
    if (bannerFile && bannerFile.size > 0) {
      const buffer = await bannerFile.arrayBuffer();
      const ext = bannerFile.name.split('.').pop() || 'jpg';
      const fileName = `email_banner_${Date.now()}.${ext}`;

      const { data } = await supabase.storage
        .from('produtos-fotos')
        .upload(`email-marketing/${fileName}`, buffer, {
          contentType: bannerFile.type,
          upsert: true
        });

      if (data) {
        const { data: pubData } = supabase.storage.from('produtos-fotos').getPublicUrl(`email-marketing/${fileName}`);
        banner_url = pubData.publicUrl;
      }
    }

    const payload = {
      ativo,
      desconto_valor,
      desconto_tipo,
      validade_dias,
      banner_url,
      assunto,
      mensagem
    };

    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'email_pos_venda_config',
      valor: payload
    }, { onConflict: 'chave' });

    if (error) return { sucesso: false, erro: 'Erro ao salvar E-mail Marketing: ' + error.message };

    revalidatePath('/admin/marketing');
    return { sucesso: true, mensagem: 'Configurações de E-mail & Cupom salvas com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao processar E-mail Marketing.' };
  }
}

export async function dispararEmailTeste(formData: FormData) {
  try {
    const cliente_nome = (formData.get('cliente_nome') as string) || 'Cliente Teste';
    const cliente_email = (formData.get('cliente_email') as string) || '';

    const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'email_pos_venda_config').single();
    const config = cfg?.valor || { desconto_valor: 10, desconto_tipo: 'percentual', validade_dias: 15 };

    const diasValidade = Number(config.validade_dias || 15);
    const dataEnvio = new Date();
    const dataValidade = new Date(Date.now() + diasValidade * 86400 * 1000);

    const codigoCupom = `OBRIGADO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const descontoTexto = config.desconto_tipo === 'percentual' ? `${config.desconto_valor}% OFF` : `R$ ${config.desconto_valor} OFF`;

    const { data: cuponsCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'cupons_db').single();
    let listaCupons = cuponsCfg?.valor || [];

    const novoCupom = {
      id: `cupom-${Date.now()}`,
      nome_interno: `Cupom Pós-Venda (${cliente_nome})`,
      codigo: codigoCupom,
      tipo_desconto: config.desconto_tipo,
      valor_desconto: config.desconto_valor,
      data_inicio: dataEnvio.toISOString(),
      data_fim: dataValidade.toISOString(),
      ativo: true,
      usos_realizados: 0,
      limite_usos_total: 1,
      permitir_produtos_promocionais: true,
      exclusivo_email: true,
      origem: 'email_marketing',
      tipo_elegibilidade: 'todos',
      criado_em: dataEnvio.toISOString()
    };

    listaCupons.unshift(novoCupom);
    await supabase.from('configuracoes').upsert({ chave: 'cupons_db', valor: listaCupons }, { onConflict: 'chave' });

    const { data: logCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'emails_enviados_log').single();
    let logLista = logCfg?.valor || [];

    const novoLog = {
      id: `log-${Date.now()}`,
      cliente_nome,
      cliente_email,
      pedido_id: `#TESTE-${Math.floor(1000 + Math.random() * 9000)}`,
      cupom_codigo: codigoCupom,
      desconto_texto: descontoTexto,
      data_envio: dataEnvio.toISOString(),
      validade_ate: dataValidade.toISOString(),
      status: 'ENVIADO'
    };

    logLista.unshift(novoLog);
    await supabase.from('configuracoes').upsert({ chave: 'emails_enviados_log', valor: logLista }, { onConflict: 'chave' });

    revalidatePath('/admin/marketing');
    revalidatePath('/admin/cupons');
    return { sucesso: true, mensagem: `E-mail de teste disparado com sucesso! Cupom ${codigoCupom} emitido.` };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao disparar e-mail de teste.' };
  }
}
