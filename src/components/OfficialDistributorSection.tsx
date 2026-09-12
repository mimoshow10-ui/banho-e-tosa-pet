import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Award, Factory, Sparkles, Truck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function OfficialDistributorSection() {
  return (
    <section className="w-full bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-blue-500/10 rounded-3xl border-2 border-amber-200/80 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Lado Esquerdo: Logo Mimoshow & Selos */}
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left flex-shrink-0">
          <div className="relative w-44 h-24 sm:w-52 sm:h-28 bg-white rounded-2xl p-4 shadow-md border border-amber-100 flex items-center justify-center">
            <Image
              src="/logo-mimoshow.png"
              alt="Mimoshow Distribuidor Oficial"
              width={180}
              height={80}
              className="object-contain max-h-20 w-auto"
            />
            <span className="absolute -top-2.5 -right-2.5 bg-amber-500 text-white p-1 rounded-full shadow-sm" title="Autêntico">
              <Award size={16} />
            </span>
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black uppercase px-3 py-0.5 rounded-full shadow-2xs">
              <ShieldCheck size={14} className="text-green-700" />
              Distribuidor Oficial Autorizado
            </span>
            <h3 className="text-xl md:text-2xl font-heading font-black text-secondary">
              MIMOSHOW Indústria & Pet
            </h3>
            <p className="text-xs md:text-sm text-gray-600 max-w-md font-medium">
              Garantia de procedência, acabamento profissional e fornecimento contínuo para pet shops e banhistas de todo o Brasil.
            </p>
          </div>
        </div>

        {/* Lado Direito: 4 Pilares de Confiança */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 w-full lg:max-w-xl">
          <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-amber-100/90 shadow-2xs flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl flex-shrink-0">
              <Factory size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Direto da Fábrica</h4>
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">Sem intermediários e com preço competitivo.</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-blue-100/90 shadow-2xs flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl flex-shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Qualidade Superior</h4>
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">EVA premium e acabamento de alta durabilidade.</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-green-100/90 shadow-2xs flex items-start gap-3">
            <div className="p-2 bg-green-100 text-green-800 rounded-xl flex-shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">100% Original</h4>
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">Garantia total de autenticidade da marca.</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-orange-100/90 shadow-2xs flex items-start gap-3">
            <div className="p-2 bg-orange-100 text-orange-800 rounded-xl flex-shrink-0">
              <Truck size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Pronta Entrega</h4>
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">Despacho ágil com estoque sempre abastecido.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Barra de CTA Inferior */}
      <div className="mt-6 pt-4 border-t border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Parceria oficial consolidada para o mercado de estética animal.
        </div>
        <Link
          href="/categoria/todas"
          className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white text-xs font-black uppercase px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all group"
        >
          Explorar Catálogo Mimoshow
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
