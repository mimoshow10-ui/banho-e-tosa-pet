import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const ADMIN_ALLOWED_EMAILS = ['mimoshow01@gmail.com', 'mimoshow10@gmail.com'];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { acao, codigo } = body;
    const rawEmail = body.email || '';
    const emailSanitizado = String(rawEmail).trim().toLowerCase();

    // 1. SOLICITAR CÓDIGO DE ACESSO (OTP DE 3 MINUTOS PARA AMBOS OS E-MAILS)
    if (acao === 'enviar_codigo') {
      if (!ADMIN_ALLOWED_EMAILS.includes(emailSanitizado)) {
        console.log(`[SEGURANÇA ADMIN] Tentativa de código para e-mail não autorizado: ${rawEmail}`);
        return NextResponse.json({
          sucesso: true,
          mensagem: 'Se este e-mail estiver autorizado, enviaremos um código de acesso.'
        });
      }

      // 1A. Gerar código estrito de 6 dígitos numéricos
      const novoCodigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expiraEm = new Date(Date.now() + 3 * 60 * 1000).toISOString();

      await supabase.from('configuracoes').upsert({
        chave: 'admin_otp',
        valor: {
          codigo: novoCodigo,
          expira_em: expiraEm,
          emails: ADMIN_ALLOWED_EMAILS,
          criado_em: new Date().toISOString(),
        }
      }, { onConflict: 'chave' });

      // 1B. Buscar credenciais de e-mail (Resend ou SMTP) no ambiente ou no banco Supabase
      let resendApiKey = process.env.RESEND_API_KEY;
      let smtpConfig: any = null;

      const { data: rCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'resend_config').maybeSingle();
      if (rCfg?.valor?.api_key) {
        resendApiKey = rCfg.valor.api_key;
      }

      const { data: sCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'smtp_config').maybeSingle();
      if (sCfg?.valor?.host) {
        smtpConfig = sCfg.valor;
      } else if (process.env.SMTP_HOST) {
        smtpConfig = {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        };
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

      let enviado = false;

      // 1C. Tentar envio via Resend
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: 'Banho e Tosa Pet <onboarding@resend.dev>',
            to: ADMIN_ALLOWED_EMAILS,
            subject: 'Acesso Banho e Tosa Pet',
            html: emailHtmlContent
          });
          enviado = true;
          console.log(`[EMAIL RESEND] E-mail enviado para ${ADMIN_ALLOWED_EMAILS.join(' e ')}`);
        } catch (e) {
          console.error('[EMAIL RESEND] Erro ao disparar e-mail:', e);
        }
      }

      // 1D. Tentar envio via Nodemailer SMTP se Resend não enviou
      if (!enviado && smtpConfig) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port || 587,
            secure: smtpConfig.port === 465,
            auth: {
              user: smtpConfig.user,
              pass: smtpConfig.pass,
            },
          });

          await transporter.sendMail({
            from: `"Banho e Tosa Pet" <${smtpConfig.user || 'contato@banhoetosapet.com'}>`,
            to: ADMIN_ALLOWED_EMAILS,
            subject: 'Acesso Banho e Tosa Pet',
            html: emailHtmlContent
          });
          enviado = true;
          console.log(`[EMAIL SMTP] E-mail enviado via SMTP para ${ADMIN_ALLOWED_EMAILS.join(' e ')}`);
        } catch (e) {
          console.error('[EMAIL SMTP] Erro ao disparar via SMTP:', e);
        }
      }

      if (!enviado) {
        console.warn('[SEGURANÇA ADMIN] Nenhuma chave de e-mail (Resend/SMTP) configurada no servidor Vercel/Supabase.');
        return NextResponse.json({
          sucesso: false,
          erro: 'O servidor de e-mail (Resend/SMTP) não possui uma Chave de API configurada na Vercel/Supabase para fazer a entrega no Gmail. Configure RESEND_API_KEY nas variáveis de ambiente da Vercel.'
        }, { status: 500 });
      }

      return NextResponse.json({
        sucesso: true,
        mensagem: `Código de acesso enviado com sucesso para mimoshow01@gmail.com e mimoshow10@gmail.com!`
      });
    }

    // 2. VALIDAR CÓDIGO DE CONFIRMAÇÃO (OTP DE 3 MINUTOS)
    if (acao === 'validar_codigo') {
      if (!ADMIN_ALLOWED_EMAILS.includes(emailSanitizado)) {
        return NextResponse.json({ erro: 'Acesso Negado.' }, { status: 403 });
      }

      const inputCodigo = String(codigo).trim();

      let codigoValido = false;
      const { data: otpCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'admin_otp').maybeSingle();
      const otpInfo = otpCfg?.valor;

      if (otpInfo && otpInfo.codigo) {
        const agora = Date.now();
        const expira = new Date(otpInfo.expira_em).getTime();

        if (agora <= expira && inputCodigo === String(otpInfo.codigo).trim()) {
          codigoValido = true;
          await supabase.from('configuracoes').delete().eq('chave', 'admin_otp');
        }
      }

      if (!codigoValido) {
        return NextResponse.json({ erro: 'Código incorreto ou expirado. Verifique o e-mail recebido.' }, { status: 401 });
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
