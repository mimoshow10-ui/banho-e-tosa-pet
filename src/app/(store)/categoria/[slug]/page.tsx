import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import { notFound } from 'next/navigation';
import { hasValidPhoto } from '@/lib/productFilter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: catAtual } = await supabase
    .from('categorias')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!catAtual && slug !== 'todas') {
    return notFound();
  }

  let produtos: any[] = [];
  let subgrupos: any[] = [];
  let grupoPai: any = null;

  if (slug === 'todas') {
    const { data } = await supabase.from('produtos').select('*').eq('ativo', true).order('criado_em', { ascending: false });
    if (data) produtos = data;
  } else if (catAtual) {
    const isGrupo = !catAtual.parent_id;
    let idsRelacionados: string[] = [catAtual.id];

    if (isGrupo) {
      // 1. É um Grupo Principal — buscar seus Subgrupos
      const { data: subs } = await supabase
        .from('categorias')
        .select('*')
        .eq('parent_id', catAtual.id)
        .order('nome');

      subgrupos = subs || [];
      idsRelacionados = [catAtual.id, ...subgrupos.map(s => s.id)];
    } else {
      // 2. É um Subgrupo — buscar o Grupo Pai
      const { data: pai } = await supabase
        .from('categorias')
        .select('*')
        .eq('id', catAtual.parent_id)
        .single();

      grupoPai = pai;
    }

    // Buscar produtos com categorias adicionais vinculadas em configuracoes
    let prodIdsAdicionais: string[] = [];
    try {
      const { data: configAdicionais } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'produtos_categorias_adicionais')
        .single();
      
      const mapAdicionais: Record<string, string[]> = configAdicionais?.valor || {};
      for (const [pId, catIds] of Object.entries(mapAdicionais)) {
        if (Array.isArray(catIds) && catIds.some((cId: string) => idsRelacionados.includes(cId))) {
          prodIdsAdicionais.push(pId);
        }
      }
    } catch {}

    let query = supabase.from('produtos').select('*').eq('ativo', true);

    if (prodIdsAdicionais.length > 0) {
      query = query.or(`categoria_id.in.(${idsRelacionados.join(',')}),id.in.(${prodIdsAdicionais.join(',')})`);
    } else {
      query = query.in('categoria_id', idsRelacionados);
    }

    const { data } = await query.order('criado_em', { ascending: false });
    if (data) produtos = data;
  }

  const produtosFiltrados = produtos;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8 flex items-center flex-wrap gap-2">
        <Link href="/" className="hover:text-primary transition font-bold">Home</Link>
        <span>&gt;</span>
        <Link href="/categoria/todas" className="hover:text-primary transition font-bold">Categorias</Link>

        {grupoPai && (
          <>
            <span>&gt;</span>
            <Link href={`/categoria/${grupoPai.slug}`} className="hover:text-primary transition font-bold">
              {grupoPai.nome}
            </Link>
          </>
        )}

        <span>&gt;</span>
        <span className="text-secondary font-black">{catAtual ? catAtual.nome : 'Todas as Categorias'}</span>
      </nav>

      {/* Cabeçalho da Categoria */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black text-secondary">
          {catAtual ? catAtual.nome : 'Todas as Categorias'}
        </h1>
        {catAtual?.descricao && (
          <p className="text-gray-500 text-sm mt-1">{catAtual.descricao}</p>
        )}
      </div>

      {/* Subgrupos pills */}
      {subgrupos.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {subgrupos.map((s) => (
            <Link
              key={s.id}
              href={`/categoria/${s.slug}`}
              className="px-4 py-2 bg-gray-100 hover:bg-primary hover:text-white text-secondary text-xs font-bold rounded-full transition shadow-2xs"
            >
              🏷️ {s.nome}
            </Link>
          ))}
        </div>
      )}

      {/* Contagem de Produtos */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Exibindo {produtosFiltrados.length} produto(s)
        </span>
      </div>

      {/* Grid de Produtos */}
      {produtosFiltrados.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {produtosFiltrados.map((prod) => (
            <ProductCard key={prod.id} produto={prod} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-lg font-bold text-gray-700">Nenhum produto publicado nesta categoria ainda.</p>
          <p className="text-xs text-gray-400 mt-1">Navegue pelas outras categorias para conferir nossos produtos!</p>
        </div>
      )}
    </div>
  );
}
