import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: vincular filho ao pai
export async function POST(req: NextRequest) {
  const { paiId, filhoId } = await req.json();
  if (!paiId || !filhoId) {
    return NextResponse.json({ error: 'paiId e filhoId obrigatórios' }, { status: 400 });
  }

  // Verifica se o pai já é filho de outro (não pode ser pai e filho ao mesmo tempo)
  const { data: pai } = await supabase.from('produtos').select('parent_id').eq('id', paiId).single();
  const paiEfetivo = pai?.parent_id || paiId;

  // Vincula o filho ao pai efetivo
  const { error } = await supabase.from('produtos').update({ parent_id: paiEfetivo }).eq('id', filhoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE: desvincular filho
export async function DELETE(req: NextRequest) {
  const { filhoId } = await req.json();
  if (!filhoId) {
    return NextResponse.json({ error: 'filhoId obrigatório' }, { status: 400 });
  }

  const { error } = await supabase.from('produtos').update({ parent_id: null }).eq('id', filhoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
