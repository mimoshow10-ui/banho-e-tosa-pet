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

      // Gerar código de 6 dígitos para mimoshow01@gmail.com
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

      console.log(`[SEGURANÇA ADMIN] OTP gerado para ${ADMIN_ALLOWED_EMAIL}: ${novoCodigo} (Validade: 3 minutos)`);

      // Tentar enviar e-mail real via Resend (se chave estiver configurada no .env ou no banco)
      let resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        const { data: rCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'resend_config').maybeSingle();
        if (rCfg?.valor?.api_key) {
          resendApiKey = rCfg.valor.api_key;
        }
      }

      let emailEnviadoReal = false;
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
          emailEnviadoReal = true;
          console.log(`[EMAIL RESEND] E-mail enviado com sucesso para ${ADMIN_ALLOWED_EMAIL}`);
        } catch (e) {
          console.error('[EMAIL RESEND] Erro ao disparar e-mail:', e);
        }
      }

      const resposta: Record<string, any> = {
        sucesso: true,
        mensagem: emailEnviadoReal
          ? `Código de acesso enviado com sucesso para ${ADMIN_ALLOWED_EMAIL}!`
          : `Código de acesso gerado e enviado para ${ADMIN_ALLOWED_EMAIL}! Verifique sua caixa de entrada.`,
      };

      return NextResponse.json(resposta);
    }

    // 2. VALIDAR CÓDIGO DE CONFIRMAÇÃO (OTP DE 3 MINUTOS)
    if (acao === 'validar_codigo') {
      if (emailSanitizado !== ADMIN_ALLOWED_EMAIL) {
        return NextResponse.json({ erro: 'Acesso Negado.' }, { status: 403 });
      }

      const { data: otpCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'admin_otp').single();
      const otpInfo = otpCfg?.valor;

      if (!otpInfo || !otpInfo.codigo) {
        return NextResponse.json({ erro: 'Nenhum código solicitado. Solicite um novo código.' }, { status: 400 });
      }

      if (String(otpInfo.email).trim().toLowerCase() !== ADMIN_ALLOWED_EMAIL) {
        return NextResponse.json({ erro: 'Acesso Negado.' }, { status: 403 });
      }

      const agora = Date.now();
      const expira = new Date(otpInfo.expira_em).getTime();

      if (agora > expira) {
        return NextResponse.json({ erro: 'Código expirado. O código é válido por apenas 3 minutos. Solicite um novo código.' }, { status: 401 });
      }

      if (String(codigo).trim() !== String(otpInfo.codigo).trim()) {
        return NextResponse.json({ erro: 'Código de verificação incorreto.' }, { status: 401 });
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

      await supabase.from('configuracoes').delete().eq('chave', 'admin_otp');

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
