import { NextRequest, NextResponse } from 'next/server';
import { validarCupomNoServidor } from '@/lib/coupons';

export async function POST(req: NextRequest) {
  try {
    const { codigo, itens, valorFrete } = await req.json();

    if (!codigo || !Array.isArray(itens)) {
      return NextResponse.json({ valido: false, erro: 'Dados incompletos' }, { status: 400 });
    }

    const resultado = await validarCupomNoServidor(codigo, itens, valorFrete || 0);
    return NextResponse.json(resultado);
  } catch (e: any) {
    return NextResponse.json({ valido: false, erro: e.message || 'Erro ao validar cupom.' }, { status: 500 });
  }
}
