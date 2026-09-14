import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const produtosBling = body.retorno?.produtos || body.produtos || [];

    if (!produtosBling.length) {
      return NextResponse.json({ error: 'Nenhum produto recebido do Bling' }, { status: 400 });
    }

    console.log(`Recebendo exportação de ${produtosBling.length} produtos do Bling...`);

    for (const item of produtosBling) {
      const prod = item.produto || item;
      const prodId = String(prod.codigo || prod.id);
      const baseSlug = (prod.nome || 'produto').toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const { data: prodExistente } = await supabase.from('produtos').select('id').eq('bling_id', prodId).maybeSingle();
      const finalBlingId = prodExistente ? null : prodId;
      const slugUnique = `${baseSlug}-${prodId}-${Date.now()}`;

      await supabase
        .from('produtos')
        .insert([{
          bling_id: finalBlingId,
          codigo_barras: prod.codigo || null,
          nome: prod.nome,
          preco: parseFloat(prod.preco || 0),
          estoque: parseInt(prod.estoqueAtual || prod.estoque || 0),
          slug: slugUnique
        }]);
    }

    return NextResponse.json({ status: 'success', message: 'Produtos exportados com sucesso para o banco de dados!' });
    
  } catch (error) {
    console.error("Erro na integração com o Bling:", error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}
