import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-secondary text-white pt-12 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1 */}
          <div>
            <h3 className="font-heading font-bold text-xl mb-4 text-accent">Mimo Show Pet</h3>
            <p className="text-sm text-gray-200">
              Acessórios premium para cães e gatos. Seu pet merece estilo e conforto todos os dias.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-bold mb-4">Categorias</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/categoria/coleiras" className="hover:text-white transition">Coleiras</Link></li>
              <li><Link href="/categoria/gravatas" className="hover:text-white transition">Gravatas</Link></li>
              <li><Link href="/categoria/acessorios" className="hover:text-white transition">Acessórios</Link></li>
              <li><Link href="/categoria/bandanas" className="hover:text-white transition">Bandanas</Link></li>
              <li><Link href="/categoria/roupinhas" className="hover:text-white transition">Roupinhas</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-bold mb-4">Atendimento</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>WhatsApp: (11) 99999-9999</li>
              <li>Email: contato@banhoetosapet.com.br</li>
              <li><Link href="/rastreamento" className="hover:text-white transition">Rastrear Pedido (Bling)</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-bold mb-4">Redes Sociais</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white transition">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition">Facebook</a></li>
              <li><a href="#" className="hover:text-white transition">TikTok</a></li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-blue-800 text-center text-sm text-gray-400">
          <p>Integrado com Bling | Pagamento seguro via Mercado Livre</p>
          <p className="mt-2">&copy; {new Date().getFullYear()} Banho e Tosa Pet. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
