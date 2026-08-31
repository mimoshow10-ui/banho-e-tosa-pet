import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row gap-8 bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        
        {/* Entrar (Login) */}
        <div className="flex-1 p-8 md:p-12">
          <h2 className="text-2xl font-heading font-bold text-secondary mb-6">Já sou cliente</h2>
          <form className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
              <input type="email" placeholder="seu@email.com" className="w-full border border-border rounded-lg p-3 focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
              <input type="password" placeholder="••••••••" className="w-full border border-border rounded-lg p-3 focus:outline-none focus:border-primary" />
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-primary" /> Lembrar de mim
              </label>
              <a href="#" className="text-primary hover:underline font-bold">Esqueci a senha</a>
            </div>
            <button type="button" className="w-full bg-secondary text-white font-bold py-3 rounded-xl hover:bg-blue-900 transition mt-4">
              Entrar
            </button>
          </form>
        </div>

        <div className="hidden md:block w-px bg-gray-200"></div>

        {/* Criar Conta */}
        <div className="flex-1 p-8 md:p-12 bg-gray-50">
          <h2 className="text-2xl font-heading font-bold text-secondary mb-6">Ainda não tenho conta</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Crie sua conta para acompanhar seus pedidos, salvar endereços e receber ofertas exclusivas para o seu pet!
          </p>
          <form className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
              <input type="text" placeholder="João da Silva" className="w-full border border-border rounded-lg p-3 bg-white focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
              <input type="email" placeholder="seu@email.com" className="w-full border border-border rounded-lg p-3 bg-white focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Crie uma Senha</label>
              <input type="password" placeholder="Mínimo 6 caracteres" className="w-full border border-border rounded-lg p-3 bg-white focus:outline-none focus:border-primary" />
            </div>
            <button type="button" className="w-full bg-accent text-text font-bold py-3 rounded-xl hover:bg-yellow-400 transition mt-4 shadow-sm">
              Criar Conta Rápida
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
