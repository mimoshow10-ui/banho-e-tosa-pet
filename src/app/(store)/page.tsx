import Link from 'next/link';
import { Truck, ShieldCheck, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative h-[500px] w-full bg-gray-900 flex items-center justify-center">
        {/* Usando uma cor solida temporaria ja que nao temos a imagem */}
        <div className="absolute inset-0 bg-secondary/80 z-10"></div>
        
        <div className="relative z-20 text-center px-4">
          <h1 className="text-5xl md:text-6xl text-white font-heading font-bold mb-4 drop-shadow-lg">
            Seu pet merece estilo
          </h1>
          <p className="text-xl text-white mb-8 drop-shadow-md">
            Acessórios premium para cães e gatos
          </p>
          <Link 
            href="/categoria/coleiras" 
            className="inline-block bg-accent hover:bg-yellow-400 text-text font-bold text-lg py-4 px-8 rounded-full transition transform hover:scale-105"
          >
            Comprar Agora
          </Link>
        </div>
      </section>

      {/* Benefícios */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-gray-50 p-8 rounded-2xl">
          <div className="flex flex-col items-center text-center gap-3">
            <Truck size={40} className="text-primary" />
            <h3 className="font-bold text-lg">Frete Rápido</h3>
            <p className="text-gray-600 text-sm">Entrega em até 7 dias úteis</p>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <ShieldCheck size={40} className="text-primary" />
            <h3 className="font-bold text-lg">Qualidade Garantida</h3>
            <p className="text-gray-600 text-sm">Produtos testados e aprovados</p>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <Clock size={40} className="text-primary" />
            <h3 className="font-bold text-lg">Atendimento 24h</h3>
            <p className="text-gray-600 text-sm">Suporte via WhatsApp</p>
          </div>
        </div>
      </section>

      {/* Categorias (Grid 4 colunas) */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <h2 className="text-3xl font-heading font-bold mb-8 text-center text-secondary">Categorias</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {['Coleiras', 'Gravatas', 'Acessórios', 'Roupinhas'].map((cat, i) => (
            <Link href={`/categoria/${cat.toLowerCase()}`} key={i} className="group cursor-pointer">
              <div className="bg-gray-100 rounded-xl aspect-square flex items-center justify-center overflow-hidden mb-4 relative transition group-hover:shadow-lg">
                <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition"></div>
                <span className="text-gray-400">Imagem {cat}</span>
              </div>
              <h3 className="text-center font-bold text-lg group-hover:text-primary transition">{cat}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Produtos em Destaque */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <h2 className="text-3xl font-heading font-bold mb-8 text-center text-secondary">Produtos em Destaque</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition border border-border overflow-hidden">
              <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                {item === 1 && (
                  <span className="absolute top-2 left-2 bg-success text-white text-xs font-bold px-2 py-1 rounded">Novo</span>
                )}
                {item === 2 && (
                  <span className="absolute top-2 left-2 bg-accent text-text text-xs font-bold px-2 py-1 rounded">Mais Vendido</span>
                )}
                <span className="text-gray-400">Produto {item}</span>
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold mb-1 text-sm md:text-base line-clamp-2">Coleira Premium Ajustável</h3>
                <div className="text-yellow-400 text-xs mb-2">⭐⭐⭐⭐⭐ (4.8)</div>
                <div className="mt-auto">
                  <span className="text-xl font-heading font-bold text-primary">R$ 30,00</span>
                </div>
                <button className="mt-4 w-full bg-secondary text-white py-2 rounded-lg font-bold hover:bg-blue-900 transition text-sm">
                  Adicionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
