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
    const instrucoes = treinamento.instrucoes || 'Somos a Banho & Tosa Pet. Responda sempre de forma gentil, prestativa e altamente específica sobre o produto.';
    const faq = treinamento.faq || '';
    const apiKey = (treinamento.api_key || process.env.OPENAI_API_KEY || '').trim();

    const q = pergunta.toLowerCase().trim();
    const nome = produto.nome || 'Produto';
    const descClean = (produto.descricao_curta || produto.descricao || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    
    const precoOriginal = Number(produto.preco || 0);
    const precoPromoVal = produto.preco_promocional ? Number(produto.preco_promocional) : null;
    const temPromo = precoPromoVal !== null && precoPromoVal > 0 && precoPromoVal < precoOriginal;
    const precoAtual = temPromo ? precoPromoVal : precoOriginal;
    const precoStr = `R$ ${precoAtual.toFixed(2).replace('.', ',')}`;
    const precoDeStr = temPromo ? `R$ ${precoOriginal.toFixed(2).replace('.', ',')}` : '';
    const estoqueNum = Number(produto.estoque || 0);
    const tamanhosArr = Array.isArray(produto.tamanhos) ? produto.tamanhos.join(', ') : '';

    // Se houver chave OpenAI configurada no painel Admin ou .env
    if (apiKey && apiKey.startsWith('sk-')) {
      try {
        const promptSystem = `${instrucoes}

Contexto das Diretrizes & FAQ da Loja:
${faq}

Dados Exatos do Produto Exibido na Tela:
- Nome: ${nome}
- Preço Atual: ${precoStr}${temPromo ? ` (Promoção de De ${precoDeStr} por ${precoStr})` : ''}
- Estoque: ${estoqueNum > 0 ? `${estoqueNum} unidades em estoque` : 'Disponível'}
- Tamanhos/Variações: ${tamanhosArr || 'Conforme opção selecionada'}
- Descrição Completa: ${descClean || 'Produto próprio para banho e tosa e estética pet.'}

REGRAS OBRIGATÓRIAS DE RESPOSTA:
1. Responda DIRETAMENTE e especificamente à dúvida do cliente sobre este produto "${nome}".
2. Use os dados reais acima (ex: quantidade do pacote, material, tipo de fixação, preço).
3. Mantenha tom amigável, positivo e profissional (máximo 3 frases).`;

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
            max_tokens: 220,
            temperature: 0.5
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

    // Motor de Inteligência Local com Extração Específica do Produto
    const resposta = extrairRespostaEspecífica(q, nome, descClean, precoStr, precoDeStr, temPromo, estoqueNum, tamanhosArr, faq);

    return NextResponse.json({ resposta });
  } catch (e: any) {
    return NextResponse.json({ resposta: 'Nosso assistente de IA está pronto para tirar suas dúvidas! Digite sua pergunta sobre o produto.' });
  }
}

function extrairRespostaEspecífica(
  q: string,
  nome: string,
  descClean: string,
  precoStr: string,
  precoDeStr: string,
  temPromo: boolean,
  estoqueNum: number,
  tamanhosArr: string,
  faq: string
): string {
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
        const palavrasChave = pTexto.split(/\s+/).filter(w => w.length > 3);
        
        if (palavrasChave.some(p => q.includes(p))) {
          return rTexto;
        }
      }
    }
  }

  // 2. Extração de Atributos Específicos do Título e da Descrição
  const textoGeral = (nome + ' ' + descClean).toLowerCase();

  // Extrair Quantidade (ex: Kit 10, 50 un, 20 laços, Par)
  const qtdMatch = (nome + ' ' + descClean).match(/(?:kit|pct|pacote|jogo)?\s*(?:c\/|com)?\s*(\d+)\s*(?:unidades|unidade|un|peças|pcs|laços|gravatas|adesivos|pares|par)?/i);
  const quantidade = qtdMatch ? qtdMatch[1] : null;

  // Extrair Material (ex: EVA, EVA Glitter, Cetim, Feltro, Algodão, Tecido)
  const matMatch = (nome + ' ' + descClean).match(/(eva glitter|eva|cetim|feltro|silicone|algodão|tecido|pelúcia|couro|nylon)/i);
  const material = matMatch ? matMatch[1].toUpperCase() : null;

  // Extrair Forma de Fixação (ex: Adesivo, Autocolante, Elástico, Anilha, Fita, Presilha)
  const fixMatch = (nome + ' ' + descClean).match(/(adesivo|autocolante|elástico|elastico|anilha|fita de cetim|fita|presilha|tic-tac|velcro)/i);
  const fixacao = fixMatch ? fixMatch[1].toLowerCase() : null;

  // Extrair Medidas / Dimensões explícitas na descrição
  const medMatch = descClean.match(/(?:medidas?|tamanho|dimensõ?e?s?|largura|comprimento|diâmetro)[:\s]+([^.!?\n]+)/i);
  const medidaDesc = medMatch ? medMatch[1].trim() : null;

  // Extrair Porte / Tipo de Pet
  const porteMatch = (nome + ' ' + descClean).match(/(porte pequeno|porte médio|porte grande|filhotes?|cães e gatos|gatos|cães|cachorros)/i);
  const porte = porteMatch ? porteMatch[1] : null;

  // FRETE / PRAZO DE ENTREGA
  if (q.includes('frete') || q.includes('entrega') || q.includes('prazo') || q.includes('envio') || q.includes('cep') || q.includes('demora')) {
    return `O envio do "${nome}" é realizado em até 24h úteis! Digite seu CEP no campo de frete acima para verificar o valor e o prazo exato para a sua cidade. 🚚`;
  }

  // QUANTIDADE / UNIDADES / QUANTOS VEM
  if (q.includes('quantos') || q.includes('quantidade') || q.includes('vem') || q.includes('pacote') || q.includes('kit') || q.includes('unidade')) {
    if (quantidade) {
      return `Este produto ("${nome}") vem com ${quantidade} unidade(s) na embalagem! 📦`;
    }
    return `O item "${nome}" refere-se à quantidade descrita no título/opção selecionada. Você pode definir a quantidade desejada ao adicionar ao carrinho! 📦`;
  }

  // MATERIAL / COMPOSIÇÃO / DO QUE É FEITO / SEGURANÇA
  if (q.includes('material') || q.includes('feito') || q.includes('eva') || q.includes('glitter') || q.includes('qualidade') || q.includes('atóxico') || q.includes('atoxico') || q.includes('machuca') || q.includes('seguro')) {
    if (material) {
      return `O "${nome}" é produzido em ${material}, sendo extremamente leve, resistente e 100% atóxico seguro para a pele e pelos dos pets. 🛡️`;
    }
    return `O "${nome}" é fabricado com matérias-primas atóxicas de primeira qualidade, testadas para garantir total segurança e conforto no banho e tosa! 🛡️`;
  }

  // MODO DE FIXAÇÃO / COMO USAR / COMO APLICAR / ADESIVO OU ELÁSTICO
  if (q.includes('como usar') || q.includes('como aplicar') || q.includes('fixar') || q.includes('prender') || q.includes('cola') || q.includes('elástico') || q.includes('elastico') || q.includes('adesivo')) {
    if (fixacao === 'adesivo' || fixacao === 'autocolante') {
      return `O "${nome}" possui fixação autocolante! Basta remover a película de proteção e aplicar suavemente nos pelos limpos e secos do pet. Adere perfeitamente sem machucar! ✨`;
    }
    if (fixacao === 'elástico' || fixacao === 'elastico' || fixacao === 'anilha') {
      return `O "${nome}" já vem equipado com anilha elástica de silicone ultra-flexível, permitindo prender no pelo do animal de forma super rápida e segura! 🎀`;
    }
    if (fixacao === 'fita' || fixacao === 'fita de cetim') {
      return `O "${nome}" acompanha fita macia para uma amarração charmosa e confortável no pescoço do pet! 🎀`;
    }
    return `A aplicação do "${nome}" é prática e rápida! Aplique sobre a pelagem limpa e seca do pet para um acabamento perfeito ao finalizar a tosa. ✨`;
  }

  // TAMANHO / MEDIDAS / PORTE
  if (q.includes('tamanho') || q.includes('medida') || q.includes('dimens') || q.includes('largura') || q.includes('comprimento') || q.includes('porte') || q.includes('pequeno') || q.includes('medio') || q.includes('médio') || q.includes('grande')) {
    if (medidaDesc) {
      return `As especificações de medida do "${nome}" são: ${medidaDesc}. 📐`;
    }
    if (tamanhosArr) {
      return `O "${nome}" possui as opções de tamanho: ${tamanhosArr}. 📐`;
    }
    if (porte) {
      return `O "${nome}" foi desenvolvido especialmente para ${porte}, garantindo caimento anatômico e muito conforto. 🐶🐱`;
    }
    return `O "${nome}" possui proporções desenvolvidas especialmente para estética de cães e gatos. Confira a ficha técnica detalhada abaixo na página! 📐`;
  }

  // PREÇO / PROMOÇÃO / DESCONTO
  if (q.includes('preço') || q.includes('preco') || q.includes('quanto custa') || q.includes('valor') || q.includes('desconto') || q.includes('promoção') || q.includes('promocao')) {
    if (temPromo) {
      return `O "${nome}" está em Super Promoção por apenas ${precoStr} (de ${precoDeStr})! Aproveite a oferta por tempo limitado! 🎉`;
    }
    return `O valor do "${nome}" é ${precoStr}, garantindo o melhor custo-benefício direto da fábrica! ✨`;
  }

  // ESTOQUE / DISPONIBILIDADE
  if (q.includes('estoque') || q.includes('disponível') || q.includes('disponivel') || q.includes('pronta entrega')) {
    if (estoqueNum > 0) {
      return `Sim! Temos ${estoqueNum} unidade(s) do "${nome}" em estoque para pronta entrega com postagem rápida! 📦`;
    }
    return `Temos o "${nome}" disponível em estoque para pronta entrega! 📦`;
  }

  // CASAMENTO POR FRASES DA DESCRIÇÃO TÉCNICA
  const frases = descClean.split(/[.!?\n]/).map(f => f.trim()).filter(f => f.length > 12);
  const palavrasDaPergunta = q.split(/\s+/).filter(w => w.length > 3 && !['sobre', 'como', 'qual', 'quanto', 'este', 'esse', 'produto', 'serve'].includes(w));
  
  if (palavrasDaPergunta.length > 0) {
    const fraseBateu = frases.find(frase => {
      const fLower = frase.toLowerCase();
      return palavrasDaPergunta.some(p => fLower.includes(p));
    });
    if (fraseBateu) {
      return `Sobre "${nome}": ${fraseBateu}.`;
    }
  }

  // RESUMO ESPECÍFICO DO PRODUTO (DEFAULT DETALHADO)
  if (descClean.length > 20) {
    const trecho = descClean.slice(0, 160);
    return `O "${nome}" é um produto profissional de estética pet (${precoStr}). ${trecho}... ${quantidade ? `Pacote com ${quantidade} un.` : ''} Ideal para encantar os tutores! 💕`;
  }

  return `O "${nome}" (${precoStr}) é um dos destaques do nosso catálogo para banho e tosa! ${material ? `Fabricado em ${material}. ` : ''}Qualquer dúvida específica, estamos à disposição! 🐾`;
}


