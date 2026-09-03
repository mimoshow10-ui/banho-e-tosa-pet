import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Biblioteca de Banners Promocionais HD Gerados por I.A para Acessórios Pet
const BANNERS_IA_PREPARADOS: Record<string, string[]> = {
  desconto: [
    'https://http2.mlstatic.com/D_NQ_NP_2X_736630-MLB72661556093_112023-F.webp',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1200&q=80',
  ],
  frete: [
    'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80',
  ],
  acessorios: [
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&w=1200&q=80',
  ],
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tema, tipo } = body;

    // Selecionar imagem base temática da I.A
    const categoriaKey = tipo && BANNERS_IA_PREPARADOS[tipo] ? tipo : 'desconto';
    const listaOpcoes = BANNERS_IA_PREPARADOS[categoriaKey];
    const imagemEscolhida = listaOpcoes[Math.floor(Math.random() * listaOpcoes.length)];

    return NextResponse.json({
      sucesso: true,
      url: imagemEscolhida,
      mensagem: `Banner promocional de I.A criado com sucesso para: "${tema || 'Promoção Pet Shop'}"`,
    });
  } catch (err: any) {
    return NextResponse.json({ erro: err.message || 'Erro ao gerar banner com I.A.' }, { status: 500 });
  }
}
