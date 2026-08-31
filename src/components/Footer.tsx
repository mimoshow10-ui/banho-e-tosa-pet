import Link from 'next/link';


export default function Footer() {
  return (
    <footer className="bg-secondary text-white pt-12 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sobre */}
          <div>
            <h3 className="text-xl font-heading font-bold text-accent mb-4">Grupo MimoShow</h3>
            <p className="text-sm text-gray-300">
              O maior fabricante de acessórios para banho e tosa do Brasil. Seu pet merece estilo e conforto todos os dias.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-bold mb-4">Categorias</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/categoria/adesivos" className="hover:text-accent transition">Adesivos</Link></li>
              <li><Link href="/categoria/gravatinhas" className="hover:text-accent transition">Gravatinhas</Link></li>
              <li><Link href="/categoria/lacinhos" className="hover:text-accent transition">Lacinhos</Link></li>
              <li><Link href="/categoria/bandanas" className="hover:text-accent transition">Bandanas</Link></li>
              <li><Link href="/categoria/gargantilhas" className="hover:text-accent transition">Gargantilhas</Link></li>
              <li><Link href="/categoria/colarinhos" className="hover:text-accent transition">Colarinhos</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-bold mb-4">Atendimento</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>📞 (11) 93081-3280</li>
              <li>📱 WhatsApp: (11) 93081-3280</li>
              <li>✉️ sac@mimoshow.com.br</li>
              <li><Link href="/rastreamento" className="hover:text-white transition mt-2 inline-block">Rastrear Pedido</Link></li>
            </ul>
            <h4 className="font-bold mb-2 mt-6">Horário de Atendimento</h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>Seg a Sex de 08h às 18h</li>
              <li>Sábado de 08h às 14h</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-bold mb-4">Redes Sociais</h4>
            <div className="flex space-x-4">
              <a href="https://instagram.com/mimoshoweva" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center hover:bg-accent transition text-white hover:text-primary" title="Instagram @mimoshoweva">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://facebook.com/mimoshoweva" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center hover:bg-accent transition text-white hover:text-primary" title="Facebook MimoShow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="https://tiktok.com/@mimoshow" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center hover:bg-accent transition text-white hover:text-primary" title="TikTok @mimoshow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.66a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.53z" />
                </svg>
              </a>
            </div>
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
