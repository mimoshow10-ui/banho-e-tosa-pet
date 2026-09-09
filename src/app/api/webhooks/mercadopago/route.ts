import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { aprovarPedidoEGerarEtiqueta } from '@/lib/orderManager';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    let topic = url.searchParams.get('topic') || url.searchParams.get('type');
    let id = url.searchParams.get('id') || url.searchParams.get('data.id');

    const body = await request.json().catch(() => ({}));
    if (!id && body?.data?.id) id = String(body.data.id);
    if (!topic && body?.type) topic = String(body.type);

    console.log(`[WEBHOOK MERCADO PAGO] Notificação recebida: topic=${topic}, id=${id}`);

    if (id) {
      // Puxar token do Mercado Pago
      let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!accessToken) {
        const { data: mpCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'mercadopago_config').maybeSingle();
        accessToken = mpCfg?.valor?.access_token;
      }

      if (accessToken && (topic === 'payment' || topic === 'merchant_order' || !topic)) {
        try {
          const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const payment = await mpRes.json();

          if (payment && payment.status === 'approved') {
            const numeroPedido = payment.external_reference;
            if (numeroPedido) {
              console.log(`[WEBHOOK MERCADO PAGO] Pagamento APROVADO para pedido #${numeroPedido}`);
              await aprovarPedidoEGerarEtiqueta(numeroPedido, payment);
            }
          }
        } catch (mpErr) {
          console.error('[WEBHOOK MERCADO PAGO] Erro ao consultar pagamento no Mercado Pago:', mpErr);
        }
      }

      await supabase.from('configuracoes').upsert({
        chave: `mp_webhook_${Date.now()}`,
        valor: {
          topic,
          id,
          body,
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

