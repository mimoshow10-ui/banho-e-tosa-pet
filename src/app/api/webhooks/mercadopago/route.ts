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

    const resourceId = id || body?.data?.id || body?.id;
    const notificationType = topic || body?.type || body?.topic;

    console.log(`[WEBHOOK MERCADO PAGO] Notificação recebida: type=${notificationType}, id=${resourceId}`);

    if (resourceId) {
      // Buscar token do Mercado Pago
      let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!accessToken) {
        const { data: mpCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'mercadopago_config').maybeSingle();
        accessToken = mpCfg?.valor?.access_token;
      }

      if (accessToken && (notificationType === 'payment' || notificationType === 'merchant_order' || !notificationType)) {
        try {
          const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          });

          if (mpRes.ok) {
            const paymentData = await mpRes.json();
            const mpStatus = paymentData.status; // 'approved', 'pending', etc.
            const extRef = paymentData.external_reference; // ex: '10295'

            if (extRef && mpStatus === 'approved') {
              console.log(`[WEBHOOK MERCADO PAGO] Pagamento APROVADO para pedido #${extRef}`);
              await aprovarPedidoEGerarEtiqueta(extRef, paymentData);
            }
          }
        } catch (e) {
          console.error('[WEBHOOK MP FETCH ERROR]', e);
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err: any) {
    console.error('[WEBHOOK MERCADO PAGO] Erro no processamento:', err);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

