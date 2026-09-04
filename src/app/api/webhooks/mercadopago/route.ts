import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = url.searchParams.get('id') || url.searchParams.get('data.id');

    console.log(`[WEBHOOK MERCADO PAGO] Notificação recebida: topic=${topic}, id=${id}`);

    if (id) {
      // Registrar log da notificação no banco de dados para rastreamento
      await supabase.from('configuracoes').upsert({
        chave: `mp_webhook_${Date.now()}`,
        valor: {
          topic,
          id,
          recebido_em: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err: any) {
    console.error('[WEBHOOK MERCADO PAGO] Erro no processamento:', err);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
