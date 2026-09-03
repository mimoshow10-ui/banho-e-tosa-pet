import { NextRequest, NextResponse } from 'next/server';
import { calcularFretesCarrinho } from '@/lib/shipping';
import { ItemCarrinho } from '@/lib/types/checkout';

export async function POST(req: NextRequest) {
  try {
    const { itens, cep } = await req.json();

    if (!cep || !Array.isArray(itens)) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const opcoes = await calcularFretesCarrinho(itens as ItemCarrinho[], cep);
    return NextResponse.json({ opcoes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro ao calcular fretes' }, { status: 500 });
  }
}
