import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tema, tipo } = body;

    const temaTexto = (tema || '').trim();
    const estilo = tipo || 'desconto';

    // Construção do Prompt para a Inteligência Artificial (Pollinations/Flux)
    // Traduz/Adapta o tema do usuário para gerar uma arte realista e temática
    let promptIngles = '';

    if (temaTexto) {
      promptIngles = `HD high quality commercial promotional banner background for pet shop store, theme: ${temaTexto}, pet accessories and products, beautiful studio photography, vibrant colorful layout, 8k resolution`;
    } else if (estilo === 'frete') {
      promptIngles = `HD commercial promotional banner for pet shop free delivery shipping, delivery package box with pet items, vibrant background, professional studio photo`;
    } else if (estilo === 'acessorios') {
      promptIngles = `HD commercial banner with colorful pet bowties, collars, bandanas, pet fashion grooming accessories, clean studio background`;
    } else {
      promptIngles = `HD commercial banner for pet shop discount sale coupon, colorful pets accessories display, special offer banner background`;
    }

    const seed = Math.floor(Math.random() * 9000000) + 100000;
    const urlIA = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptIngles)}?width=1200&height=600&nologo=true&seed=${seed}&model=flux`;

    return NextResponse.json({
      sucesso: true,
      url: urlIA,
      mensagem: `Arte gerada com I.A. com sucesso para o tema: "${temaTexto || 'Promoção Pet Shop'}"`,
    });
  } catch (err: any) {
    return NextResponse.json({ erro: err.message || 'Erro ao gerar banner com I.A.' }, { status: 500 });
  }
}
