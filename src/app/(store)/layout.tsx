import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 🚀 SCRIPTS DE MARKETING E RASTREAMENTO */}
      {/* Google Analytics 4 (Falso para estruturação) */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-SEUIDAQUI"></script>
      <script dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-SEUIDAQUI');
        `
      }} />
      {/* Meta Pixel de Remarketing */}
      <script dangerouslySetInnerHTML={{
        __html: `
          // Pixel do Facebook para Abandono de Carrinho e Remarketing
          !function(f,b,e,v,n,t,s){...}(window, document,'script', 'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', 'SEU_PIXEL_ID');
          fbq('track', 'PageView');
        `
      }} />

      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </>
  );
}
