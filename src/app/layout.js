import './globals.css'; 

const CONFIG = {
  brandName: "028", 
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png", 
  whatsappNumber: "5491153412358",
};

export const metadata = {
  title: '028 IMPORT',
  description: 'Tienda de productos premium',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href={CONFIG.logoImage} />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body className="bg-[#fafafa] text-[#1a1a1a] font-sans flex flex-col relative min-h-screen">
        
        {/* === CONTENIDO PRINCIPAL === */}
        {/* Al sacar el <nav> de acá, la ÚNICA barra que va a aparecer es la nueva que armamos en tu página principal */}
        <div className="flex-grow">
          {children}
        </div>

        {/* === BOTÓN FLOTANTE DE WHATSAPP (FOOTER) === */}
        <a
          href={`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent("¡Hola! Vengo de la página web, tengo una consulta.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[90] bg-[#25D366] text-white w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-[0_8px_30px_rgba(37,211,102,0.4)] hover:scale-110 hover:bg-[#20ba59] transition-all duration-300 group"
          aria-label="Contactar por WhatsApp"
        >
          <i className="fab fa-whatsapp"></i>
          <span className="absolute right-16 bg-white text-black text-[10px] font-black uppercase px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg pointer-events-none whitespace-nowrap hidden md:block">
            ¿Necesitas ayuda?
          </span>
        </a>

      </body>
    </html>
  );
}