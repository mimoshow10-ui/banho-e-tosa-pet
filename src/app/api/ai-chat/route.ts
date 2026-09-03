import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { pergunta, produto } = await req.json();

    if (!pergunta || !produto) {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
    }

    // Puxar treinamento da IA salvo no banco
    const { data: config } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'treinamento_ia')
      .single();

    const treinamento = config?.valor || {};
    const instrucoes = treinamento.instrucoes || 'Responda de forma gentil e prestativa.';
    const faq = treinamento.faq || '';
    const apiKey = treinamento.api_key || process.env.OPENAI_API_KEY;

    const q = pergunta.toLowerCase();
    const nome = produto.nome || 'Produto';
    const precoVal = produto.preco_promocional || produto.preco;
    const preco = precoVal ? `R$ ${Number(precoVal).toFixed(2).replace('.', ',')}` : '';
    const descClean = (produto.descricao_curta || produto.descricao || '').replace(/<[^>]*>?/gm, '');

    // Se houver chave OpenAI configurada no painel ou .env
    if (apiKey) {
      try {
        const promptSystem = `${instrucoes}\n\nConhecimento Adicional da Loja (FAQ):\n${faq}\n\nProduto Atual:\nNome: ${nome}\nPreço: ${preco}\nDescrição: ${descClean}\n\nResponda a dúvida do cliente em até 3 frases.`;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: promptSystem },
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
        // Fallback para motor local
      }
    }

    // Motor Inteligente Local (Treinado com o FAQ salvo)
    let resposta = '';

    // Verificar se a pergunta bate com o FAQ cadastrado
    if (faq) {
      const linhas = faq.split('\n');
      for (let i = 0; i < linhas.length; i++) {
        if (linhas[i].toLowerCase().includes(q)) {
          if (linhas[i + 1] && linhas[i + 1].toLowerCase().startsWith('r:')) {
            resposta = linhas[i + 1].replace(/^r:\s*/i, '');
            break;
          }
        }
      }
    }

    if (!resposta) {
      if (q.includes('frete') || q.includes('entrega') || q.includes('prazo')) {
        resposta = `Enviamos para todo o Brasil! Digite seu CEP no campo de frete acima para calcular o valor e prazo de entrega.`;
      } else if (q.includes('tamanho') || q.includes('medida') || q.includes('porte')) {
        resposta = `O "${nome}" foi projetado especialmente para estética pet. Confira as dimensões na ficha técnica abaixo.`;
      } else if (q.includes('material') || q.includes('eva') || q.includes('qualidade')) {
        resposta = `Este produto utiliza materiais atóxicos, leves e de alta aderência, próprios para estética e banho e tosa.`;
      } else if (descClean.length > 10) {
        resposta = `Sobre "${nome}": ${descClean.slice(0, 180)}...`;
      } else {
        resposta = `O item "${nome}" (${preco}) é excelente para o seu pet! Enviaremos com todo o carinho e embalagem protegida.`;
      }
    }

    return NextResponse.json({ resposta });
  } catch (e: any) {
    return NextResponse.json({ resposta: 'Nosso assistente está processando seu pedido, mas você também pode nos chamar no suporte!' });
  }
}
