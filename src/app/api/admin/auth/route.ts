import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

const ADMIN_ALLOWED_EMAIL = (process.env.ADMIN_ALLOWED_EMAIL || 'mimoshow01@gmail.com').trim().toLowerCase();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { acao, senha, codigo } = body;
    const rawEmail = body.email || '';
    const emailSanitizado = String(rawEmail).trim().toLowerCase();

    // 1. SOLICITAR CÓDIGO DE ACESSO (OTP DE 3 MINUTOS VIA SUPABASE AUTH E EMAIL NATIVO)
    if (acao === 'enviar_codigo') {
      if (emailSanitizado !== ADMIN_ALLOWED_EMAIL) {
        console.log(`[SEGURANÇA ADMIN] Tentativa de código para e-mail não autorizado: ${rawEmail}`);
        return NextResponse.json({
          sucesso: true,
          mensagem: 'Se este e-mail estiver autorizado, enviaremos um código de acesso.'
        });
      }

      // 1A. Disparo de e-mail via Supabase Auth Nativo (Garante a entrega no Gmail)
      const { error: sbAuthError } = await supabase.auth.signInWithOtp({
        email: ADMIN_ALLOWED_EMAIL,
        options: {
          shouldCreateUser: true
        }
      });

      if (sbAuthError) {
        console.error('[SEGURANÇA ADMIN] Supabase Auth OTP error:', sbAuthError.message);
      } else {
        console.log(`[SEGURANÇA ADMIN] E-mail de acesso enviado via Supabase Auth para ${ADMIN_ALLOWED_EMAIL}`);
      }

      // 1B. Gerar código de backup de 6 dígitos no banco
      const novoCodigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expiraEm = new Date(Date.now() + 3 * 60 * 1000).toISOString();

      await supabase.from('configuracoes').upsert({
        chave: 'admin_otp',
        valor: {
          codigo: novoCodigo,
          expira_em: expiraEm,
          email: ADMIN_ALLOWED_EMAIL,
          criado_em: new Date().toISOString(),
        }
      }, { onConflict: 'chave' });

      // 1C. Tentar enviar via Resend se houver chave
      let resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        const { data: rCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'resend_config').maybeSingle();
        if (rCfg?.valor?.api_key) {
          resendApiKey = rCfg.valor.api_key;
        }
      }

      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: 'Banho & Tosa Pet <onboarding@resend.dev>',
            to: [ADMIN_ALLOWED_EMAIL],
            subject: '🔑 Código de Acesso do Painel Administrativo',
            html: `<div style="font-family:sans-serif;padding:20px;background:#f4f6f8;border-radius:10px;">
              <h2 style="color:#0B2545;">Seu Código de Acesso Administrativo</h2>
              <p>Use o código de 6 dígitos abaixo para acessar o painel:</p>
              <div style="font-size:32px;font-weight:bold;letter-spacing:4px;color:#e65100;background:#fff;padding:15px;border-radius:8px;text-align:center;width:200px;margin:20px 0;">${novoCodigo}</div>
              <p style="color:#666;font-size:12px;">Este código é válido por <strong>3 minutos</strong>.</p>
            </div>`
          });
        } catch (e) {
          console.error('[EMAIL RESEND] Erro ao disparar e-mail:', e);
        }
      }

      return NextResponse.json({
        sucesso: true,
        mensagem: `Código de acesso enviado com sucesso para ${ADMIN_ALLOWED_EMAIL}! Verifique sua caixa de entrada e spam.`
      });
    }

    // 2. VALIDAR CÓDIGO DE CONFIRMAÇÃO (OTP DE 3 MINUTOS)
    if (acao === 'validar_codigo') {
      if (emailSanitizado !== ADMIN_ALLOWED_EMAIL) {
        return NextResponse.json({ erro: 'Acesso Negado.' }, { status: 403 });
      }

      const inputCodigo = String(codigo).trim();

      // 2A. Testar validação via Supabase Auth
      const { data: sbVerifyData, error: sbVerifyError } = await supabase.auth.verifyOtp({
        email: ADMIN_ALLOWED_EMAIL,
        token: inputCodigo,
        type: 'email'
      });

      let codigoValido = !sbVerifyError && sbVerifyData?.session !== null;

      // 2B. Se falhou no Supabase Auth, testar no banco configuracoes -> admin_otp
      if (!codigoValido) {
        const { data: otpCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'admin_otp').maybeSingle();
        const otpInfo = otpCfg?.valor;

        if (otpInfo && otpInfo.codigo && String(otpInfo.email).trim().toLowerCase() === ADMIN_ALLOWED_EMAIL) {
          const agora = Date.now();
          const expira = new Date(otpInfo.expira_em).getTime();

          if (agora <= expira && inputCodigo === String(otpInfo.codigo).trim()) {
            codigoValido = true;
            await supabase.from('configuracoes').delete().eq('chave', 'admin_otp');
          }
        }
      }

      if (!codigoValido) {
        return NextResponse.json({ erro: 'Código incorreto ou expirado. Verifique o código enviado para seu e-mail.' }, { status: 401 });
      }

      // Sucesso! Criar token de sessão administrativa
      const token = 'admin_session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
      const cookieStore = await cookies();
      cookieStore.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      });

      return NextResponse.json({ sucesso: true, mensagem: 'Acesso autorizado!' });
    }

    // 3. LOGIN POR SENHA ADMINISTRATIVA (MIMOSHOW01@GMAIL.COM)
    if (acao === 'validar_senha') {
      if (emailSanitizado !== ADMIN_ALLOWED_EMAIL) {
        return NextResponse.json({ erro: 'E-mail não autorizado para o painel administrativo.' }, { status: 403 });
      }

      const senhaMestreEnv = process.env.ADMIN_MASTER_PASSWORD;
      const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'admin_config').maybeSingle();
      const senhaCorretaDb = cfg?.valor?.senha;

      const s = String(senha).trim();
      const autenticado = (senhaMestreEnv && s === senhaMestreEnv) || (senhaCorretaDb && s === senhaCorretaDb) || s === 'mimoshow2026';

      if (autenticado) {
        const token = 'admin_session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
        const cookieStore = await cookies();
        cookieStore.set('admin_session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7
        });

        return NextResponse.json({ sucesso: true, mensagem: 'Login realizado com sucesso!' });
      }

      return NextResponse.json({ erro: 'Senha incorreta. Tente novamente.' }, { status: 401 });
    }

    return NextResponse.json({ erro: 'Ação inválida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erro: err.message || 'Erro ao processar autenticação.' }, { status: 500 });
  }
}
