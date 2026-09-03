import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { pergunta, produto } = await req.json();

    if (!pergunta || !produto) {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
    }

    const q = pergunta.toLowerCase();
    const nome = produto.nome || 'Produto';
    const precoVal = produto.preco_promocional || produto.preco;
    const preco = precoVal ? `R$ ${Number(precoVal).toFixed(2).replace('.', ',')}` : '';
    const descClean = (produto.descricao_curta || produto.descricao || '').replace(/<[^>]*>?/gm, '');

    // Se houver chave OPENAI_API_KEY no .env, faz chamada oficial, caso contrário responde com IA local estruturada
    if (process.env.OPENAI_API_KEY) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `Você é o assistente virtual inteligente do e-commerce 'Banho & Tosa Pet'. Responda a dúvida do cliente sobre o produto "${nome}" que custa ${preco}. Descrição do produto: "${descClean}". Seja gentil, direto e prestativo.`
              },
              { role: 'user', content: pergunta }
            ],
            max_tokens: 150
          })
        });

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          return NextResponse.json({ resposta: text });
        }
      } catch {
        // Fallback para lógica inteligente abaixo se a chave falhar
      }
    }

    // Lógica Inteligente de Resposta
    let resposta = `O item "${nome}" (${preco}) é ótimo para o seu pet! `;

    if (q.includes('frete') || q.includes('entrega') || q.includes('prazo')) {
      resposta = `Enviamos para todo o Brasil! Você pode simular o frete exato e o prazo de entrega inserindo seu CEP no campo de frete acima.`;
    } else if (q.includes('tamanho') || q.includes('medida') || q.includes('porte')) {
      resposta = `O "${nome}" foi projetado para uso pet. Recomendamos conferir as especificações na descrição do item.`;
    } else if (q.includes('material') || q.includes('eva') || q.includes('qualidade')) {
      resposta = `Este produto utiliza materiais atóxicos e seguros para animais, desenvolvidos especialmente para higienização e estética no Banho e Tosa.`;
    } else if (descClean.length > 10) {
      resposta = `Sobre "${nome}": ${descClean.slice(0, 200)}...`;
    }

    return NextResponse.json({ resposta });
  } catch (e: any) {
    return NextResponse.json({ resposta: 'Não consegui processar a pergunta agora, mas nosso suporte está à disposição no WhatsApp!' });
  }
}
