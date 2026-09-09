import { NextResponse } from 'next/server';
import { aprovarPedidoEGerarEtiqueta } from '@/lib/orderManager';

export async function POST(request: Request) {
  try {
    const { numeroPedido } = await request.json();
    if (!numeroPedido) {
      return NextResponse.json({ erro: 'Número do pedido é obrigatório' }, { status: 400 });
    }

    const res = await aprovarPedidoEGerarEtiqueta(numeroPedido);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ erro: err.message }, { status: 500 });
  }
}
