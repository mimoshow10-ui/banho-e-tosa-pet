import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('🔥 Webhook do Bling Recebido:', JSON.stringify(payload, null, 2));

    // Na API V3, o Bling envia o ID do produto ou do estoque alterado
    // Exemplo: { data: { id: 12345, idLoja: 987, tipo: 'produtos' } }

    if (payload?.data?.tipo === 'produtos') {
      console.log('✅ Produto sincronizado do painel multiloja do Bling!');
      // Aqui entrará a lógica de buscar os detalhes completos no Bling via API 
      // usando o ID recebido, e dar um INSERT/UPDATE no nosso Supabase.
    }

    if (payload?.data?.tipo === 'estoques') {
      console.log('📦 Atualização de estoque recebida!');
      // Atualiza a coluna estoque da tabela produtos no Supabase
    }

    // IMPORTANTE: O Bling exige que a gente devolva STATUS 200 rápido, 
    // senão ele acha que o site caiu e pausa as sincronizações.
    return NextResponse.json({ message: 'Webhook processado com sucesso', received: true }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro no Webhook do Bling:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'A rota do Bling está ativa e escutando!' });
}
