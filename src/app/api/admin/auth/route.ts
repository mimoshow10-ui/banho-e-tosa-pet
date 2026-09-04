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

    // 1. SOLICITAR CÓDIGO DE ACESSO (OTP DE 3 MINUTOS)
    if (acao === 'enviar_codigo') {
      if (emailSanitizado !== ADMIN_ALLOWED_EMAIL) {
        console.log(`[SEGURANÇA ADMIN] Tentativa de código para e-mail não autorizado: ${rawEmail}`);
        return NextResponse.json({
          sucesso: true,
          mensagem: 'Se este e-mail estiver autorizado, enviaremos um código de acesso.'
        });
      }

      // 1A. Gerar código estrito de 6 dígitos numéricos (SEM LINKS)
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

      // 1C. Tentar enviar via Resend ou Nodemailer com o modelo "Acesso Banho e Tosa Pet"
      let resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        const { data: rCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'resend_config').maybeSingle();
        if (rCfg?.valor?.api_key) {
          resendApiKey = rCfg.valor.api_key;
        }
      }

      const emailHtmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 30px; background: #0B2545; color: #ffffff; border-radius: 20px; max-width: 480px; margin: 0 auto; text-align: center;">
          <h1 style="color: #FFB703; font-size: 24px; margin-bottom: 6px; font-weight: 900;">Banho e Tosa Pet</h1>
          <h2 style="color: #ffffff; font-size: 18px; font-weight: bold; margin-top: 0;">Acesso Banho e Tosa Pet</h2>
          <p style="color: #E0E1DD; font-size: 14px; margin-top: 15px;">Digite o código de verificação abaixo para acessar o seu painel:</p>
          <div style="font-size: 40px; font-weight: 900; letter-spacing: 8px; color: #0B2545; background: #ffffff; padding: 16px 28px; border-radius: 14px; display: inline-block; margin: 25px 0; border: 3px solid #FFB703;">${novoCodigo}</div>
          <p style="color: #A3CEF1; font-size: 12px; margin-bottom: 0;">Este código de acesso é válido por <strong>3 minutos</strong>.</p>
        </div>
      `;

      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: 'Banho e Tosa Pet <onboarding@resend.dev>',
            to: [ADMIN_ALLOWED_EMAIL],
            subject: 'Acesso Banho e Tosa Pet',
            html: emailHtmlContent
          });
          console.log(`[EMAIL RESEND] E-mail enviado com o assunto "Acesso Banho e Tosa Pet" para ${ADMIN_ALLOWED_EMAIL}`);
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

      let codigoValido = false;
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

    return NextResponse.json({ erro: 'Ação inválida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erro: err.message || 'Erro ao processar autenticação.' }, { status: 500 });
  }
}
