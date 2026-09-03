import { supabase } from '@/lib/supabase';

export interface AdminConfig {
  email: string;
  autenticacao_2fa: boolean;
  senha_hash?: string;
  criado_em: string;
}

export async function getAdminConfig(): Promise<AdminConfig> {
  try {
    const { data } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'admin_config')
      .single();

    if (data?.valor) {
      return data.valor;
    }
  } catch {}

  const defaultConfig: AdminConfig = {
    email: 'mimoshow01@gmail.com',
    autenticacao_2fa: true,
    criado_em: new Date().toISOString(),
  };

  try {
    await supabase.from('configuracoes').upsert({
      chave: 'admin_config',
      valor: defaultConfig,
    }, { onConflict: 'chave' });
  } catch {}

  return defaultConfig;
}
