import { NextResponse } from 'next/server';
import { getCupons } from '@/lib/coupons';

export async function GET() {
  try {
    const todos = await getCupons();
    const agora = Date.now();

    // Retorna apenas cupons ativos e dentro do prazo
    const cupons = todos.filter(c => {
      if (!c.ativo) return false;
      if (c.data_inicio && new Date(c.data_inicio).getTime() > agora) return false;
      if (c.data_fim && new Date(c.data_fim).getTime() < agora) return false;
      if (c.limite_usos_total && c.usos_realizados >= c.limite_usos_total) return false;
      return true;
    });

    return NextResponse.json({ cupons });
  } catch (e: any) {
    return NextResponse.json({ cupons: [] });
  }
}
