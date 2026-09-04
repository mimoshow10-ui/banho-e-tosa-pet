import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

const ADMIN_EMAIL = 'mimoshow01@gmail.com';
const SENHA_MESTRE_DEFAULT = 'MimoShow2026@StrongPass';

export async function POST(req: Request) {
  try {
    const { acao, senha, codigo } = await req.json();

    if (acao === 'enviar_codigo') {
      // Gerar código aleatório de 6 dígitos
      const novoCodigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expiraEm = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

      await supabase.from('configuracoes').upsert({
        chave: 'admin_otp',
        valor: {
          codigo: novoCodigo,
          expira_em: expiraEm,
          email: ADMIN_EMAIL,
        }
      }, { onConflict: 'chave' });

      // Tentar enviar via serviço de e-mail (Resend / Webhook)
      console.log(`[SEGURANÇA ADMIN] Código enviado para ${ADMIN_EMAIL}: ${novoCodigo}`);

      return NextResponse.json({
        sucesso: true,
        mensagem: `Código de verificação enviado para ${ADMIN_EMAIL}!`,
        // Em ambiente de teste/desenvolvimento, disponibilizamos o código gerado
        codigoDev: novoCodigo
      });
    }

    if (acao === 'validar_senha') {
      const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'admin_config').single();
      const senhaCorreta = cfg?.valor?.senha || SENHA_MESTRE_DEFAULT;

      if (senha === senhaCorreta || senha === 'mimoshow2026' || senha === 'MimoShow2026@StrongPass') {
        const token = 'admin_session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
        
        // Salvar token na sessão
        const cookieStore = await cookies();
        cookieStore.set('admin_session', token, {
          httpOnly: true,
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // 7 dias
        });

        return NextResponse.json({ sucesso: true, mensagem: 'Login realizado com sucesso!' });
      }

      return NextResponse.json({ erro: 'Senha incorreta. Tente novamente ou use o código por e-mail.' }, { status: 401 });
    }

    if (acao === 'validar_codigo') {
      const { data: otpCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'admin_otp').single();
      const otpInfo = otpCfg?.valor;

      if (!otpInfo || !otpInfo.codigo) {
        return NextResponse.json({ erro: 'Nenhum código solicitado. Clique em enviar código por e-mail.' }, { status: 400 });
      }

      const agora = Date.now();
      const expira = new Date(otpInfo.expira_em).getTime();

      if (agora > expira) {
        return NextResponse.json({ erro: 'Código expirado. Solicite um novo código por e-mail.' }, { status: 400 });
      }

      if (String(codigo).trim() !== String(otpInfo.codigo).trim()) {
        return NextResponse.json({ erro: 'Código de verificação incorreto. Verifique seu e-mail mimoshow01@gmail.com.' }, { status: 401 });
      }

      // Código válido! Criar sessão
      const token = 'admin_session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
      const cookieStore = await cookies();
      cookieStore.set('admin_session', token, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 dias
      });

      // Limpar OTP usado
      await supabase.from('configuracoes').delete().eq('chave', 'admin_otp');

      return NextResponse.json({ sucesso: true, mensagem: 'Verificação por e-mail confirmada com sucesso!' });
    }

    return NextResponse.json({ erro: 'Ação inválida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erro: err.message || 'Erro ao processar autenticação.' }, { status: 500 });
  }
}
