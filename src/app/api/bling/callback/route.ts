import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/admin/configuracoes?erro=Nenhum código retornado pelo Bling', request.url));
  }

  try {
    const { data: config } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').single();
    
    if (!config?.valor?.client_id || !config?.valor?.client_secret) {
      return NextResponse.redirect(new URL('/admin/configuracoes?erro=Client ID e Secret não configurados no site', request.url));
    }

    const { client_id, client_secret } = config.valor;

    const authResponse = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
        'Accept': '1.0'
      },
      body: new URLSearchParams({ grant_type: 'authorization_code', code: code })
    });

    const authData = await authResponse.json();
    
    if (authData.error) {
      return NextResponse.redirect(new URL('/admin/configuracoes?erro=Código expirou. Tente autorizar novamente.', request.url));
    }

    await supabase.from('configuracoes').upsert({
      chave: 'bling_tokens',
      valor: {
        access_token: authData.access_token,
        refresh_token: authData.refresh_token
      }
    }, { onConflict: 'chave' });

    return NextResponse.redirect(new URL('/admin/configuracoes?msg=Autenticação 100% Automática Concluída! O Token foi salvo.', request.url));

  } catch (error) {
    return NextResponse.redirect(new URL('/admin/configuracoes?erro=Erro fatal no servidor ao processar o Bling', request.url));
  }
}
