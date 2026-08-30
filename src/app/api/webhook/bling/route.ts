import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // O Bling envia um payload quando você clica em "Exportar Produtos" na Multiloja
    // Vamos iterar sobre os produtos recebidos
    const produtosBling = body.retorno?.produtos || body.produtos || [];

    if (!produtosBling.length) {
      return NextResponse.json({ error: 'Nenhum produto recebido do Bling' }, { status: 400 });
    }

    console.log(`Recebendo exportação de ${produtosBling.length} produtos do Bling...`);

    for (const item of produtosBling) {
      const prod = item.produto || item;
      
      const slug = prod.nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // Insere ou atualiza o produto no Supabase (se o bling_id já existir, ele atualiza)
      await supabase
        .from('produtos')
        .upsert({
          bling_id: prod.codigo || prod.id,
          nome: prod.nome,
          preco: parseFloat(prod.preco || 0),
          estoque: parseInt(prod.estoqueAtual || prod.estoque || 0),
          slug: slug
        }, { onConflict: 'bling_id' });
    }

    return NextResponse.json({ status: 'success', message: 'Produtos exportados com sucesso para o banco de dados!' });
    
  } catch (error) {
    console.error("Erro na integração com o Bling:", error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}
