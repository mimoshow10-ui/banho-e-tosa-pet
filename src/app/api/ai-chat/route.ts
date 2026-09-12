import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { pergunta, produto } = await req.json();

    if (!pergunta || !produto) {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
    }

    // Puxar treinamento da IA salvo no banco (Painel Admin)
    const { data: config } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'treinamento_ia')
      .maybeSingle();

    const treinamento = config?.valor || {};
    const instrucoes = treinamento.instrucoes || 'Somos a Banho & Tosa Pet. Responda sempre de forma gentil, prestativa e objetiva aos clientes.';
    const faq = treinamento.faq || '';
    const apiKey = (treinamento.api_key || process.env.OPENAI_API_KEY || '').trim();

    const q = pergunta.toLowerCase().trim();
    const nome = produto.nome || 'Produto';
    const precoOriginal = Number(produto.preco || 0);
    const precoPromoVal = produto.preco_promocional ? Number(produto.preco_promocional) : null;
    const temPromo = precoPromoVal !== null && precoPromoVal > 0 && precoPromoVal < precoOriginal;
    const precoAtual = temPromo ? precoPromoVal : precoOriginal;
    
    const precoStr = `R$ ${precoAtual.toFixed(2).replace('.', ',')}`;
    const precoDeStr = temPromo ? `R$ ${precoOriginal.toFixed(2).replace('.', ',')}` : '';
    const descClean = (produto.descricao_curta || produto.descricao || '').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
    const estoqueNum = Number(produto.estoque || 0);
    const tamanhosArr = Array.isArray(produto.tamanhos) ? produto.tamanhos.join(', ') : '';

    // Se houver chave OpenAI configurada no painel Admin ou .env
    if (apiKey && apiKey.startsWith('sk-')) {
      try {
        const promptSystem = `${instrucoes}

Contexto das Diretrizes & FAQ da Loja:
${faq}

Dados do Produto Exibido na Tela:
- Nome: ${nome}
- Preço Atual: ${precoStr}${temPromo ? ` (Em promoção de De ${precoDeStr} por ${precoStr})` : ''}
- Estoque disponível: ${estoqueNum > 0 ? `${estoqueNum} unidades` : 'Sob encomenda / em estoque'}
- Tamanhos/Variações: ${tamanhosArr || 'Conforme variação selecionada'}
- Descrição Técnica: ${descClean || 'Produto próprio para banho e tosa e estética pet.'}

REGRAS OBRIGATÓRIAS:
1. Responda diretamente à pergunta do cliente sobre este produto.
2. Mantenha um tom caloroso, amigável e focado no bem-estar animal e banho e tosa.
3. Seja sucinto (máximo 3 frases curtas e claras).
4. Se o cliente perguntar sobre envio/frete, mencione que pode digitar o CEP no campo de frete acima.`;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: promptSystem },
              { role: 'user', content: pergunta }
            ],
            max_tokens: 200,
            temperature: 0.6
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content?.trim();
          if (text) {
            return NextResponse.json({ resposta: text });
          }
        }
      } catch (err) {
        console.error('[AI CHAT API] Erro ao chamar OpenAI:', err);
      }
    }

    // Motor Inteligente Local (Treinado com o FAQ salvo e Dados do Produto na Tela)
    let resposta = '';

    // 1. Tentar encontrar casamento no FAQ de Treinamento cadastrado no Admin
    if (faq) {
      const blocos = faq.split(/\n\s*\n/);
      for (const bloco of blocos) {
        const linhas = bloco.split('\n').map(l => l.trim()).filter(Boolean);
        const linhaPergunta = linhas.find(l => l.toLowerCase().startsWith('p:') || l.toLowerCase().includes('?'));
        const linhaResposta = linhas.find(l => l.toLowerCase().startsWith('r:'));

        if (linhaPergunta && linhaResposta) {
          const pTexto = linhaPergunta.replace(/^p:\s*/i, '').toLowerCase();
          const rTexto = linhaResposta.replace(/^r:\s*/i, '');

          // Se a pergunta do cliente contiver palavras-chave do FAQ
          const palavrasChave = pTexto.split(/\s+/).filter(w => w.length > 3);
          const bateu = palavrasChave.some(p => q.includes(p));

          if (bateu) {
            resposta = rTexto;
            break;
          }
        }
      }
    }

    // 2. Regras de Inteligência Local para o Produto Atual
    if (!resposta) {
      if (q.includes('frete') || q.includes('entrega') || q.includes('prazo') || q.includes('envio') || q.includes('correio') || q.includes('cep')) {
        resposta = `O envio do "${nome}" é rápido! Postamos nos Correios/transportadora em até 24h úteis. Digite seu CEP no campo de frete acima para ver prazos e valores exatos! 🚚`;
      } 
      else if (q.includes('preço') || q.includes('quanto custa') || q.includes('valor') || q.includes('desconto') || q.includes('promoção') || q.includes('promocao')) {
        if (temPromo) {
          resposta = `O "${nome}" está em Super Promoção por apenas ${precoStr} (de ${precoDeStr})! Aproveite antes que a oferta acabe! 🎉`;
        } else {
          resposta = `O valor do "${nome}" é ${precoStr}. Garantimos o melhor preço e qualidade direto da fábrica! ✨`;
        }
      } 
      else if (q.includes('estoque') || q.includes('disponível') || q.includes('disponivel') || q.includes('pronta entrega')) {
        if (estoqueNum > 0) {
          resposta = `Sim! Temos ${estoqueNum} unidade(s) do "${nome}" em estoque para pronta entrega com envio imediato! 📦`;
        } else {
          resposta = `Temos o "${nome}" disponível para envio imediato! Garanta já o seu. 📦`;
        }
      } 
      else if (q.includes('tamanho') || q.includes('medida') || q.includes('porte') || q.includes('gato') || q.includes('cachorro') || q.includes('pequeno') || q.includes('medio') || q.includes('médio') || q.includes('grande')) {
        if (tamanhosArr) {
          resposta = `O "${nome}" possui os seguintes tamanhos: ${tamanhosArr}. Ele é ideal para estética e banho & tosa!`;
        } else {
          resposta = `O "${nome}" tem dimensões pensadas anatomicamente para conforto do pet no banho e tosa. Você pode conferir os detalhes na descrição abaixo! 🐶🐱`;
        }
      } 
      else if (q.includes('material') || q.includes('eva') || q.includes('qualidade') || q.includes('atóxico') || q.includes('atoxico') || q.includes('cola') || q.includes('machuca') || q.includes('seguro')) {
        resposta = `Todos os nossos produtos são 100% atóxicos, leves e desenvolvidos especialmente para segurança dos pets no banho e tosa. Não machucam a pele nem os pelos! 🛡️`;
      } 
      else if (q.includes('como usa') || q.includes('como aplicar') || q.includes('aplicação') || q.includes('fixar') || q.includes('passar')) {
        resposta = `A aplicação do "${nome}" é super simples e rápida! Basta aplicar sobre o pelo limpo e seco do pet para um acabamento perfeito. ✨`;
      }
      else if (descClean.length > 20) {
        const resumo = descClean.slice(0, 160);
        resposta = `Sobre o "${nome}": ${resumo}... É um item de alta qualidade para deixar os pets ainda mais fofos! 💕`;
      } 
      else {
        resposta = `O "${nome}" (${precoStr}) é um dos itens mais amados do nosso catálogo de banho e tosa! Se tiver mais dúvidas, digite aqui ou nos chame no WhatsApp. 🐾`;
      }
    }

    return NextResponse.json({ resposta });
  } catch (e: any) {
    return NextResponse.json({ resposta: 'Nosso assistente de IA está pronto para tirar suas dúvidas! Digite sua pergunta sobre o produto.' });
  }
}

