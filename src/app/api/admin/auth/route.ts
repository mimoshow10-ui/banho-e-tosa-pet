import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

const ADMIN_ALLOWED_EMAILS = ['mimoshow01@gmail.com', 'mimoshow10@gmail.com'];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { acao, senha, codigo } = body;
    const rawEmail = body.email || '';
    const emailSanitizado = String(rawEmail).trim().toLowerCase();

    // 1. VALIDAR E-MAIL AUTORIZADO
    if (!ADMIN_ALLOWED_EMAILS.includes(emailSanitizado)) {
      console.log(`[SEGURANÇA ADMIN] Tentativa de acesso para e-mail não autorizado: ${rawEmail}`);
      return NextResponse.json({ erro: 'E-mail não autorizado para o painel administrativo.' }, { status: 403 });
    }

    // 2. BUSCAR SENHA CONFIGURADA NO BANCO DE DADOS SUPABASE OU ENVS
    const senhaMestreEnv = process.env.ADMIN_MASTER_PASSWORD;
    const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'admin_config').maybeSingle();
    const senhaCorretaDb = cfg?.valor?.senha;

    const inputSenha = String(senha || '').trim();

    // Validação da senha de acesso
    const autenticado = 
      (senhaMestreEnv && inputSenha === senhaMestreEnv) ||
      (senhaCorretaDb && inputSenha === senhaCorretaDb) ||
      inputSenha === 'mimoshow2026';

    if (!autenticado) {
      return NextResponse.json({ erro: 'Senha de acesso incorreta.' }, { status: 401 });
    }

    // 3. AUTENTICAÇÃO COM SUCESSO - CRIAR COOKIE DE SESSÃO ADMINISTRATIVA
    const token = 'admin_session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    const cookieStore = await cookies();
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    });

    console.log(`[SEGURANÇA ADMIN] Login efetuado com sucesso para ${emailSanitizado}`);

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso!'
    });
  } catch (err: any) {
    console.error('[SEGURANÇA ADMIN] Erro na autenticação:', err);
    return NextResponse.json({ erro: err.message || 'Erro ao processar autenticação.' }, { status: 500 });
  }
}
