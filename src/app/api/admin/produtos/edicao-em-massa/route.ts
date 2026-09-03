import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ids, acao, valor } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ erro: 'Nenhum produto selecionado.' }, { status: 400 });
    }

    if (acao === 'destaque') {
      // valor pode ser 'super_promocao', 'mais_vendidos', 'lancamento', 'nenhum'
      const isSuperPromo = valor === 'super_promocao';
      await supabase.from('produtos').update({ destaque_super_promocao: isSuperPromo }).in('id', ids);

      // Atualizar configuracoes de vitrine_destaques
      const { data: currentConfig } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'vitrine_destaques')
        .single();

      let valorAtual = currentConfig?.valor || { mais_vendidos: [], novidades: [] };
      let mvList: string[] = (valorAtual.mais_vendidos || []).filter((prodId: string) => !ids.includes(prodId));
      let novList: string[] = (valorAtual.novidades || []).filter((prodId: string) => !ids.includes(prodId));

      if (valor === 'mais_vendidos') {
        mvList = [...ids, ...mvList];
      } else if (valor === 'lancamento') {
        novList = [...ids, ...novList];
      }

      await supabase.from('configuracoes').upsert({
        chave: 'vitrine_destaques',
        valor: {
          mais_vendidos: Array.from(new Set(mvList)),
          novidades: Array.from(new Set(novList)),
        },
      }, { onConflict: 'chave' });

    } else if (acao === 'categoria') {
      await supabase.from('produtos').update({ categoria_id: valor || null }).in('id', ids);

    } else if (acao === 'preco_promocional') {
      const precoPromocional = parseFloat(String(valor).replace(',', '.'));
      await supabase.from('produtos').update({ preco_promocional: isNaN(precoPromocional) ? null : precoPromocional }).in('id', ids);

    } else if (acao === 'status') {
      const ativo = valor === true || valor === 'true';
      await supabase.from('produtos').update({ ativo }).in('id', ids);

    } else if (acao === 'excluir') {
      await supabase.from('produtos').delete().in('id', ids);
    } else {
      return NextResponse.json({ erro: 'Ação em massa inválida.' }, { status: 400 });
    }

    revalidatePath('/admin/produtos');
    revalidatePath('/', 'layout');

    return NextResponse.json({ sucesso: true, mensagem: `Edição em massa concluída para ${ids.length} produto(s)!` });
  } catch (err: any) {
    return NextResponse.json({ erro: err.message || 'Erro ao processar edição em massa.' }, { status: 500 });
  }
}
