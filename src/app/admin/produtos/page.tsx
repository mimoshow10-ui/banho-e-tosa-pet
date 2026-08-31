import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Pencil, Trash2, Plus, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminProdutos(props: { searchParams: Promise<{ msg?: string, erro?: string }> }) {
  const searchParams = await props.searchParams;

  // Ação de importar produto
  async function importarSKU(formData: FormData) {
    'use server'
    const sku = formData.get('sku') as string;
    if (!sku) return;

    let redirectTo = '';

    try {
      const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
      const token = cfg?.valor?.access_token;
      
      if (!token) {
        redirectTo = `/admin/produtos?erro=Token do Bling não encontrado. Vá nas Configurações e autorize o app.`;
      } else {
        const response = await fetch(`https://www.bling.com.br/Api/v3/produtos?codigo=${sku}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
          redirectTo = `/admin/produtos?erro=Produto SKU ${sku} não encontrado no Bling.`;
        } else {
          const prodId = data.data[0].id;
          
          // Busca detalhes completos (pra ter certeza)
          const detalhesReq = await fetch(`https://www.bling.com.br/Api/v3/produtos/${prodId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const detalhesJson = await detalhesReq.json();
          const prodCompleto = detalhesJson.data || data.data[0];

          // Busca Estoque (Bling separa estoque da rota de produto)
          let estoqueAtual = 0;
          try {
            const estoqueReq = await fetch(`https://www.bling.com.br/Api/v3/estoques/saldos?idsProdutos[]=${prodId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const estoqueJson = await estoqueReq.json();
            estoqueAtual = estoqueJson.data?.[0]?.saldoFisicoTotal || 0;
          } catch(e) {}

          const externas = prodCompleto.midia?.imagens?.externas?.map((img: any) => img.link) || [];
          const internas = prodCompleto.midia?.imagens?.internas?.map((img: any) => img.link) || [];
          let imagensBling = [...externas, ...internas];
          if (imagensBling.length === 0 && prodCompleto.imagemURL) {
            imagensBling = [prodCompleto.imagemURL];
          }

          const baseSlug = prodCompleto.nome.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const slug = `${baseSlug}-${prodCompleto.id}`;

          const produtoParaInserir = {
            bling_id: String(prodCompleto.id),
            codigo_barras: prodCompleto.codigo || prodCompleto.gtin,
            nome: prodCompleto.nome,
            preco: prodCompleto.preco,
            estoque: estoqueAtual,
            slug: slug,
            ativo: prodCompleto.situacao === 'A',
            peso_liquido: prodCompleto.pesoLiquido || 0,
            peso_bruto: prodCompleto.pesoBruto || 0,
            largura: prodCompleto.dimensoes?.largura || 0,
            altura: prodCompleto.dimensoes?.altura || 0,
            profundidade: prodCompleto.dimensoes?.profundidade || 0,
            marca: prodCompleto.marca || '',
            ncm: prodCompleto.tributacao?.ncm || '',
            descricao_curta: prodCompleto.descricaoCurta || '',
            imagens: imagensBling.length > 0 ? imagensBling : null
          };

          const { error } = await supabase.from('produtos').upsert(produtoParaInserir, { onConflict: 'bling_id' });
          
          if (error) {
            redirectTo = `/admin/produtos?erro=Banco recusou salvar: ${error.message}`;
          } else {
            redirectTo = `/admin/produtos?msg=Sucesso! O produto ${prodCompleto.nome} foi importado com estoque ${estoqueAtual}!`;
          }
        }
      }
    } catch (error) {
      redirectTo = `/admin/produtos?erro=Erro fatal no código do servidor: ${String(error)}`;
    }

    if (redirectTo) {
      revalidatePath('/admin/produtos');
      redirect(redirectTo);
    }
  }

  const { data: produtos } = await supabase.from('produtos').select('*, categorias(nome)').order('nome');

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-800">Produtos</h1>
        <Link 
          href="/admin/produtos/novo" 
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-hover transition"
        >
          <Plus size={20} />
          Novo Produto
        </Link>
      </div>

      {searchParams.msg && (
        <div className="bg-green-100 text-green-800 p-4 rounded-lg font-bold mb-6">
          ✅ {searchParams.msg}
        </div>
      )}

      {searchParams.erro && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg font-bold mb-6">
          ❌ ERRO: {searchParams.erro}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        
        {/* Bloco de Importação */}
        <div className="p-6 bg-gray-50 border-b border-border flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <h3 className="font-bold text-secondary mb-2">Importar do Bling</h3>
            <p className="text-sm text-gray-600 mb-4">Digite o SKU (Código do Produto) exatamente como está no Bling para importar ou atualizar os dados e fotos.</p>
            <form action={importarSKU} className="flex gap-2">
              <input name="sku" type="text" placeholder="Ex: MS5153-H7" required className="flex-1 border border-border rounded-lg p-2" />
              <button type="submit" className="bg-secondary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-900 transition">
                Importar SKU
              </button>
            </form>
          </div>
          {searchParams.msg && <div className="text-green-600 font-bold bg-green-100 p-3 rounded-lg flex-1 text-center border border-green-200">{searchParams.msg}</div>}
          {searchParams.erro && <div className="text-red-600 font-bold bg-red-100 p-3 rounded-lg flex-1 text-center border border-red-200">{searchParams.erro}</div>}
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="p-4 font-medium w-16">Foto</th>
              <th className="p-4 font-medium w-32">SKU</th>
              <th className="p-4 font-medium">Nome do Produto</th>
              <th className="p-4 font-medium">Categoria</th>
              <th className="p-4 font-medium">Preço Normal</th>
              <th className="p-4 font-medium text-green-600">Promoção</th>
              <th className="p-4 font-medium">Estoque</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {produtos && produtos.length > 0 ? (
              produtos.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    {item.imagens && item.imagens.length > 0 ? (
                      <img src={item.imagens[0]} alt="Miniatura" className="w-12 h-12 object-cover rounded border border-gray-200" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded border border-gray-300 flex items-center justify-center text-[9px] text-gray-400 text-center leading-tight">Sem<br/>Foto</div>
                    )}
                  </td>
                  <td className="p-4 font-bold text-gray-500">{item.codigo_barras || 'Sem SKU'}</td>
                  <td className="p-4 font-medium text-gray-800">{item.nome}</td>
                  <td className="p-4 text-gray-600">{item.categorias?.nome || 'Sem Categoria'}</td>
                  <td className="p-4 font-bold text-gray-600">
                    R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                  </td>
                  <td className="p-4 font-bold text-green-600">
                    {item.preco_promocional ? `R$ ${Number(item.preco_promocional).toFixed(2).replace('.', ',')}` : '-'}
                  </td>
                  <td className="p-4 text-gray-600">{item.estoque}</td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/produtos/${item.id}`} className="text-blue-600 hover:underline mr-3 font-bold">Editar</Link>
                    <button className="text-red-600 hover:underline">Ocultar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  Nenhum produto cadastrado no banco de dados ainda. 
                  Sincronize com o Bling ou adicione um manualmente!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
