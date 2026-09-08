import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = url.searchParams.get('id') || url.searchParams.get('data.id');

    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const resourceId = id || body?.data?.id || body?.id;
    const notificationType = topic || body?.type || body?.topic;

    console.log(`[WEBHOOK MERCADO PAGO] Notificação recebida: type=${notificationType}, id=${resourceId}`);

    if (resourceId) {
      // Buscar token do Mercado Pago
      const { data: mpCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'mercadopago_config').maybeSingle();
      const accessToken = mpCfg?.valor?.access_token;

      if (accessToken) {
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

            if (extRef) {
              const { data: dbData } = await supabase.from('configuracoes').select('valor').eq('chave', 'pedidos_db').maybeSingle();
              let pedidos: any[] = dbData?.valor || [];
              const idx = pedidos.findIndex(p => String(p.numero_pedido) === String(extRef) || String(p.id) === String(extRef));

              if (idx !== -1) {
                const pedido = pedidos[idx];

                if (mpStatus === 'approved') {
                  pedido.status = 'PAGAMENTO_APROVADO';
                  pedido.atualizado_em = new Date().toISOString();

                  pedidos[idx] = pedido;
                  await supabase.from('configuracoes').upsert({ chave: 'pedidos_db', valor: pedidos }, { onConflict: 'chave' });
                }
              }
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
