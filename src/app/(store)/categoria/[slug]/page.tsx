import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // Buscar a categoria/grupo/subgrupo pelo slug
  const { data: catAtual } = await supabase.from('categorias').select('*').eq('slug', slug).single();

  if (!catAtual && slug !== 'todas') {
    return notFound();
  }

  let produtos: any[] = [];
  let subgrupos: any[] = [];
  let grupoPai: any = null;

  if (slug === 'todas') {
    const { data } = await supabase.from('produtos').select('*').eq('ativo', true).is('parent_id', null).order('criado_em', { ascending: false });
    if (data) produtos = data;
  } else if (catAtual) {
    const isGrupo = !catAtual.parent_id;

    if (isGrupo) {
      // 1. É um Grupo Principal — buscar seus Subgrupos
      const { data: subs } = await supabase
        .from('categorias')
        .select('*')
        .eq('parent_id', catAtual.id)
        .order('nome');

      subgrupos = subs || [];

      // Buscar produtos que pertencem diretamente ao grupo OU a um dos seus subgrupos (Apenas PAIS)
      const idsRelacionados = [catAtual.id, ...subgrupos.map(s => s.id)];
      const { data } = await supabase
        .from('produtos')
        .select('*')
        .in('categoria_id', idsRelacionados)
        .eq('ativo', true)
        .is('parent_id', null)
        .order('criado_em', { ascending: false });

      if (data) produtos = data;
    } else {
      // 2. É um Subgrupo — buscar o Grupo Pai
      const { data: pai } = await supabase
        .from('categorias')
        .select('*')
        .eq('id', catAtual.parent_id)
        .single();

      grupoPai = pai;

      // Buscar produtos pertencentes estritamente a este Subgrupo (Apenas PAIS)
      const { data } = await supabase
        .from('produtos')
        .select('*')
        .eq('categoria_id', catAtual.id)
        .eq('ativo', true)
        .is('parent_id', null)
        .order('criado_em', { ascending: false });

      if (data) produtos = data;
    }
  }

  const tituloExibido = slug === 'todas' ? 'Todos os Produtos' : catAtual?.nome || slug;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb Hierárquico */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-primary transition">Home</Link>
        <span>&gt;</span>
        {grupoPai ? (
          <>
            <Link href={`/categoria/${grupoPai.slug}`} className="hover:text-primary transition font-medium text-gray-700">
              {grupoPai.nome}
            </Link>
            <span>&gt;</span>
            <span className="text-secondary font-bold">{catAtual?.nome}</span>
          </>
        ) : (
          <span className="text-secondary font-bold">{tituloExibido}</span>
        )}
      </nav>

      {/* Se for um Grupo e tiver Subgrupos, exibe Pílulas de Subgrupos */}
      {subgrupos.length > 0 && (
        <div className="mb-8 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
          <h3 className="font-bold text-xs uppercase tracking-wide text-purple-900 mb-3">
            Subgrupos em {catAtual?.nome}:
          </h3>
          <div className="flex flex-wrap gap-2">
            {subgrupos.map((sub) => (
              <Link
                key={sub.id}
                href={`/categoria/${sub.slug}`}
                className="bg-white border border-purple-200 hover:border-purple-500 text-purple-900 hover:text-purple-700 px-4 py-2 rounded-full text-xs font-bold transition shadow-2xs flex items-center gap-1.5"
              >
                <span>🏷️ {sub.nome}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Grid de Produtos */}
      <main className="flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-border">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-secondary">{tituloExibido}</h1>
            {grupoPai && (
              <p className="text-xs text-gray-500 mt-0.5">Subgrupo pertencente a <strong>{grupoPai.nome}</strong></p>
            )}
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <span className="text-sm font-medium text-gray-500">{produtos.length} produtos encontrados</span>
          </div>
        </div>

        {/* Grid de Cards de Produto */}
        {produtos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {produtos.map((prod: any) => (
              <ProductCard key={prod.id} produto={prod} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-12 text-center rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-600 font-bold text-lg mb-2">Nenhum produto cadastrado aqui no momento.</p>
            <p className="text-gray-400 text-xs">Acesse o Painel Admin para vincular produtos a este Grupo ou Subgrupo.</p>
          </div>
        )}
      </main>
    </div>
  );
}
