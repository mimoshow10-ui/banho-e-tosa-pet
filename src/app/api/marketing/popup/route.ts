import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: config } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'marketing_popup')
      .single();

    return NextResponse.json({ popup: config?.valor || null });
  } catch {
    return NextResponse.json({ popup: null });
  }
}
