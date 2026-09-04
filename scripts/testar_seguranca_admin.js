const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'http://localhost:3000'; // Ou URL local de teste
const ADMIN_EMAIL = 'mimoshow01@gmail.com';

async function rodarBateriaDeTestesSeguranca() {
  console.log('\n====================================================');
  console.log('🛡️ EXECUTANDO BATERIA OBRIGATÓRIA DE TESTES DE SEGURANÇA');
  console.log('====================================================\n');

  let acertos = 0;
  let falhas = 0;

  // --- TESTE A: E-mail mimoshow01@gmail.com ---
  console.log('🔹 TESTE A: Solicitação de OTP para e-mail autorizado (mimoshow01@gmail.com)');
  try {
    const resA = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'enviar_codigo', email: ADMIN_EMAIL })
    });
    const jsonA = await resA.json();
    
    // Verificar no Supabase se o OTP foi gerado
    const { data: otpCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'admin_otp').single();
    const otpCriado = otpCfg?.valor;

    if (resA.ok && otpCriado && otpCriado.email === ADMIN_EMAIL && otpCriado.codigo) {
      console.log(`✅ TESTE A PASSOU! OTP Gerado: ${otpCriado.codigo} | Validade: ${otpCriado.expira_em}`);
      acertos++;
    } else {
      console.error('❌ TESTE A FALHOU!', jsonA);
      falhas++;
    }
  } catch (e) {
    console.error('❌ TESTE A ERRO:', e.message);
    falhas++;
  }

  // --- TESTE B: E-mail Não Autorizado (teste@gmail.com) ---
  console.log('\n🔹 TESTE B: Solicitação de OTP para e-mail não autorizado (teste@gmail.com)');
  try {
    // Limpar OTP prévio do banco
    await supabase.from('configuracoes').delete().eq('chave', 'admin_otp');

    const resB = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'enviar_codigo', email: 'teste@gmail.com' })
    });
    const jsonB = await resB.json();

    // Verificar se NENHUM OTP foi criado para teste@gmail.com no banco
    const { data: otpCfgB } = await supabase.from('configuracoes').select('valor').eq('chave', 'admin_otp').single();

    if (jsonB.sucesso && !otpCfgB?.valor) {
      console.log('✅ TESTE B PASSOU! Resposta genérica enviada e NENHUM OTP foi criado para e-mail não autorizado.');
      acertos++;
    } else {
      console.error('❌ TESTE B FALHOU! OTP foi indevidamente criado:', otpCfgB?.valor);
      falhas++;
    }
  } catch (e) {
    console.error('❌ TESTE B ERRO:', e.message);
    falhas++;
  }

  // --- TESTE C: Tentativa de acessar API admin sem autenticação ---
  console.log('\n🔹 TESTE C: Tentativa de chamar API administrativa sem sessão');
  try {
    const resC = await fetch(`${BASE_URL}/api/admin/produtos/edicao-em-massa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produto_ids: [], acao: 'desativar' })
    });

    if (resC.status === 403 || resC.status === 401) {
      console.log(`✅ TESTE C PASSOU! Backend respondeu HTTP ${resC.status} ACESSO NEGADO.`);
      acertos++;
    } else {
      console.error(`❌ TESTE C FALHOU! Esperado 403, recebido HTTP ${resC.status}`);
      falhas++;
    }
  } catch (e) {
    console.error('❌ TESTE C ERRO:', e.message);
    falhas++;
  }

  // --- TESTE D: Tentativa de alterar o e-mail no payload ---
  console.log('\n🔹 TESTE D: Tentativa de validar OTP alterando o e-mail no payload para hacker@gmail.com');
  try {
    // Solicitar OTP válido para mimoshow01@gmail.com
    await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'enviar_codigo', email: ADMIN_EMAIL })
    });
    const { data: otpCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'admin_otp').single();
    const codigoValido = otpCfg?.valor?.codigo;

    // Submeter o código válido mas tentando alterar o e-mail no payload
    const resD = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'validar_codigo', email: 'hacker@gmail.com', codigo: codigoValido })
    });

    if (resD.status === 403) {
      console.log('✅ TESTE D PASSOU! Backend detectou alteração de e-mail e rejeitou com HTTP 403.');
      acertos++;
    } else {
      console.error(`❌ TESTE D FALHOU! Requisicao aceita indevidamente. Status: ${resD.status}`);
      falhas++;
    }
  } catch (e) {
    console.error('❌ TESTE D ERRO:', e.message);
    falhas++;
  }

  // --- TESTE E: mimoshow01@gmail.com + OTP correto dentro de 3 minutos ---
  console.log('\n🔹 TESTE E: Autenticação com mimoshow01@gmail.com + OTP correto dentro dos 3 minutos');
  try {
    await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'enviar_codigo', email: ADMIN_EMAIL })
    });
    const { data: otpCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'admin_otp').single();
    const codigoValido = otpCfg?.valor?.codigo;

    const resE = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'validar_codigo', email: ADMIN_EMAIL, codigo: codigoValido })
    });
    const jsonE = await resE.json();

    if (resE.ok && jsonE.sucesso) {
      console.log('✅ TESTE E PASSOU! Acesso autorizado com sucesso e sessão administrativa criada.');
      acertos++;
    } else {
      console.error('❌ TESTE E FALHOU!', jsonE);
      falhas++;
    }
  } catch (e) {
    console.error('❌ TESTE E ERRO:', e.message);
    falhas++;
  }

  // --- TESTE F: mimoshow01@gmail.com + OTP expirado (simulando > 3 minutos) ---
  console.log('\n🔹 TESTE F: Autenticação com OTP expirado (> 3 minutos)');
  try {
    // Inserir um OTP expirado há 4 minutos no banco
    const codigoExpirado = '999888';
    const tempoExpirado = new Date(Date.now() - 4 * 60 * 1000).toISOString();
    await supabase.from('configuracoes').upsert({
      chave: 'admin_otp',
      valor: {
        codigo: codigoExpirado,
        expira_em: tempoExpirado,
        email: ADMIN_EMAIL,
      }
    }, { onConflict: 'chave' });

    const resF = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'validar_codigo', email: ADMIN_EMAIL, codigo: codigoExpirado })
    });

    if (resF.status === 401) {
      console.log('✅ TESTE F PASSOU! Backend rejeitou o OTP expirado (> 3 min) com HTTP 401.');
      acertos++;
    } else {
      console.error(`❌ TESTE F FALHOU! Status retornado: ${resF.status}`);
      falhas++;
    }
  } catch (e) {
    console.error('❌ TESTE F ERRO:', e.message);
    falhas++;
  }

  console.log('\n====================================================');
  console.log('📊 RESULTADO DA BATERIA DE TESTES DE SEGURANÇA:');
  console.log(`✅ TESTES COM SUCESSO: ${acertos}/6`);
  console.log(`❌ TESTES COM FALHA:   ${falhas}/6`);
  console.log('====================================================\n');
}

rodarBateriaDeTestesSeguranca();
