'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function salvarSenhaAdmin(formData: FormData) {
  try {
    const novaSenha = (formData.get('nova_senha_admin') as string || '').trim();
    if (!novaSenha) {
      return { sucesso: false, erro: 'Nova senha não pode ser vazia.' };
    }

    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'admin_config',
      valor: {
        senha: novaSenha,
        atualizado_em: new Date().toISOString()
      }
    }, { onConflict: 'chave' });

    if (error) {
      return { sucesso: false, erro: `Erro ao salvar nova senha: ${error.message}` };
    }

    revalidatePath('/admin/configuracoes');
    return { sucesso: true, mensagem: 'Senha Secreta do Sistema atualizada com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao salvar nova senha.' };
  }
}

export async function salvarCredenciais(formData: FormData) {
  try {
    const clientId = formData.get('client_id') as string;
    const clientSecret = formData.get('client_secret') as string;
    if (!clientId || !clientSecret) {
      return { sucesso: false, erro: 'Client ID e Client Secret são obrigatórios.' };
    }

    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'bling_credentials',
      valor: { client_id: clientId, client_secret: clientSecret }
    }, { onConflict: 'chave' });

    if (error) {
      return { sucesso: false, erro: `Erro ao salvar credenciais: ${error.message}` };
    }

    revalidatePath('/admin/configuracoes');
    return { sucesso: true, mensagem: 'Credenciais do Bling salvas com sucesso! Agora basta clicar em Autorizar no Bling.' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao salvar credenciais do Bling.' };
  }
}

export async function salvarMercadoPago(formData: FormData) {
  try {
    const accessToken = (formData.get('mp_access_token') as string || '').trim();
    const publicKey = (formData.get('mp_public_key') as string || '').trim();

    if (!accessToken) {
      return { sucesso: false, erro: 'Access Token do Mercado Pago é obrigatório.' };
    }

    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'mercadopago_config',
      valor: {
        access_token: accessToken,
        public_key: publicKey,
        atualizado_em: new Date().toISOString()
      }
    }, { onConflict: 'chave' });

    if (error) {
      return { sucesso: false, erro: `Erro ao salvar Mercado Pago: ${error.message}` };
    }

    revalidatePath('/admin/configuracoes');
    return { sucesso: true, mensagem: 'Credenciais do Mercado Pago salvas com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao salvar Mercado Pago.' };
  }
}

export async function salvarFreteConfig(formData: FormData) {
  try {
    const cep_origem = (formData.get('cep_origem') as string || '').trim();
    const token_frete = (formData.get('token_frete') as string || '').trim();
    const usar_correios = formData.get('usar_correios') === 'on';
    const usar_transportadoras = formData.get('usar_transportadoras') === 'on';
    const usar_retirada = formData.get('usar_retirada') === 'on';

    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'frete_config',
      valor: {
        cep_origem,
        token_frete,
        usar_correios,
        usar_transportadoras,
        usar_retirada,
        atualizado_em: new Date().toISOString()
      }
    }, { onConflict: 'chave' });

    if (error) {
      return { sucesso: false, erro: `Erro ao salvar frete: ${error.message}` };
    }

    revalidatePath('/admin/configuracoes');
    return { sucesso: true, mensagem: 'Configurações de Logística e Frete salvas com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao salvar frete.' };
  }
}
