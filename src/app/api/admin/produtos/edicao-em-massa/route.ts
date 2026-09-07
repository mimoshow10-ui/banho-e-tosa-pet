import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ids, acao, valor, preco_promocional, promocao_expira_em } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ erro: 'Nenhum produto selecionado.' }, { status: 400 });
    }

    if (acao === 'destaque') {
      const isSuperPromo = valor === 'super_promocao';
      const updateData: any = { destaque_super_promocao: isSuperPromo };

      if (isSuperPromo) {
        if (promocao_expira_em) {
          const pExp = new Date(promocao_expira_em);
          updateData.promocao_expira_em = isNaN(pExp.getTime()) ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : pExp.toISOString();
        } else {
          updateData.promocao_expira_em = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        }
      }

      if (preco_promocional !== undefined && preco_promocional !== null && preco_promocional !== '') {
        const pVal = parseFloat(String(preco_promocional).replace(',', '.'));
        updateData.preco_promocional = isNaN(pVal) ? null : pVal;
      }

      await supabase.from('produtos').update(updateData).in('id', ids);

      // Se for super promoção e os produtos não tiverem preço promocional, gerar 10% OFF automático
      if (isSuperPromo && (!preco_promocional || parseFloat(String(preco_promocional)) <= 0)) {
        const { data: prods } = await supabase.from('produtos').select('id, preco, preco_promocional').in('id', ids);
        if (prods) {
          for (const p of prods) {
            if (!p.preco_promocional || Number(p.preco_promocional) >= Number(p.preco)) {
              const autoPromo = Number((Number(p.preco || 0) * 0.9).toFixed(2));
              await supabase.from('produtos').update({ preco_promocional: autoPromo }).eq('id', p.id);
            }
          }
        }
      }

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
      const pVal = parseFloat(String(valor).replace(',', '.'));
      await supabase.from('produtos').update({ preco_promocional: isNaN(pVal) ? null : pVal }).in('id', ids);

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
