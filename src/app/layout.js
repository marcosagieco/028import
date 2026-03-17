// src/app/layout.js (o tu componente de Header separado)
"use client"; // Necesario para el menú móvil

import React, { useState } from 'react';
import './globals.css'; // Asegurate de importar tus estilos globales

// Constantes de configuración (las mismas que tenías)
const CONFIG = {
  brandName: "028", 
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png", 
  whatsappNumber: "5491153412358",
};

export default function RootLayout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <html lang="es">
      <head>
        <link rel="icon" href={CONFIG.logoImage} />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body className="bg-[#fafafa] text-[#1a1a1a] font-sans flex flex-col relative min-h-screen">
        
        {/* === HEADER GLASSMORPHISM (BARRA NEGRA PROFESIONAL) === */}
        <nav className="bg-black/90 backdrop-blur-md py-4 px-6 sticky top-0 z-40 border-b border-white/10 text-white shadow-2xl transition-all">
          <div className="container mx-auto flex justify-between items-center max-w-7xl">
            
            {/* LOGO: Lleva a la página principal */}
            <a href="/" className="flex items-center gap-3">
              <img src={CONFIG.logoImage} alt={`${CONFIG.brandName} Logo`} className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
            </a>
            
            {/* MENÚ ESCRITORIO */}
            <div className="hidden md:flex gap-6 items-center">
                <a href="/" className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-[#d4af37] transition-colors">Inicio</a>
                <a href="/nosotros" className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-[#d4af37] transition-colors">Nuestra Esencia</a>
                <a href="/envios" className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-[#d4af37] transition-colors">Logística</a>
            </div>

            {/* BOTÓN MENÚ MÓVIL */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-2xl p-2 md:hidden text-white hover:text-[#d4af37] transition-colors">
              <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>

          {/* MENÚ MÓVIL DESPLEGABLE */}
          <div className={`md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-[80vh] border-b border-[#d4af37]/30 shadow-2xl' : 'max-h-0'}`}>
            <div className="p-6 flex flex-col gap-4 text-center font-black">
              <a href="/" className="hover:text-[#d4af37] text-white/80 transition-colors py-3 border-b border-white/5 uppercase tracking-widest text-xs">Catálogo Principal</a>
              <a href="/nosotros" className="hover:text-[#d4af37] text-white/80 transition-colors py-3 border-b border-white/5 uppercase tracking-widest text-xs">Quiénes Somos</a>
              <a href="/envios" className="hover:text-[#d4af37] text-white/80 transition-colors py-3 border-b border-white/5 uppercase tracking-widest text-xs">Logística de Envío</a>
            </div>
          </div>
        </nav>

        {/* === CONTENIDO PRINCIPAL DE CADA PÁGINA === */}
        <div className="flex-grow">
          {children}
        </div>

        {/* === BOTÓN FLOTANTE DE WHATSAPP (FOOTER) === */}
        {/* Se movió acá para que aparezca en todas las páginas */}
        <a
          href={`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent("¡Hola! Vengo de la página web, tengo una consulta.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-4 md:right-6 z-[90] bg-[#25D366] text-white w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-[0_8px_30px_rgba(37,211,102,0.4)] hover:scale-110 hover:bg-[#20ba59] transition-all duration-300 group"
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