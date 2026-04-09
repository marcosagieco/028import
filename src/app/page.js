"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

const CONFIG = {
  brandName: "028", 
  whatsappNumber: "5491153412358", 
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png", 
  bannerImage: "https://i.postimg.cc/zXYm0TQn/image.png", 
  currencySymbol: "$",
  shippingText: "Pedime, te llega en 30' ⏰",
};

// CATÁLOGO COMPLETO Y ORIGINAL CON LAS SECCIONES INTEGRADAS
const initialProducts = [
  { id: 1, name: "BAJA SPLASH", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png", description: "Vapeador desechable premium con una mezcla tropical y refrescante. Batería de larga duración y la garantía de autenticidad de 028 IMPORT." },
  { id: 2, name: "BLUE RAZZ ICE", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/s2Tmw67w/BLUE-RAZZ-ICE.webp", description: "El clásico e intenso sabor a frambuesa azul combinado con un golpe helado perfecto. Rendimiento superior en cada calada." },
  { id: 3, name: "CHERRY FUSE", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/yd5PzDfx/CHERRY-FUSE.png", description: "Fusión explosiva de cerezas dulces y jugosas. Diseño ergonómico, flujo de aire suave y calidad garantizada en caja sellada." },
  { id: 4, name: "CHERRY STRAZZ", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "Destacado", image: "https://i.postimg.cc/7PFVsTG2/CHERRY-STRAZZ.jpg", description: "Una deliciosa combinación de cereza y fresa con sutiles notas cítricas. Ideal para quienes buscan un perfil dulce y balanceado." },
  { id: 5, name: "DOUBLE APPLE ICE", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/QN9mJqtk/DOUBLE-APPLE-ICE.webp", description: "Intenso sabor a doble manzana, dulce y ácida, coronado con un final súper refrescante. La experiencia definitiva para tu paladar." },
  { id: 6, name: "DRAGON STRAWNANA", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/9X6p8qRB/DRAGON-STRAWNANA.png", description: "Exótico mix de pitahaya (dragon fruit), fresa y plátano. Un viaje de sabores suaves y tropicales con la mejor tecnología de vaporización." },
  { id: 7, name: "GRAPE ICE", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/hPV0HPTw/GRAPE-ICE.webp", description: "Auténtico sabor a uva dulce acompañado de una frescura helada inigualable. Golpe de garganta satisfactorio y prolongado." },
  { id: 8, name: "MANGO MAGIC", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "Best Seller", image: "https://i.postimg.cc/tCFzLCFC/MANGO-MAGIC.png", description: "La magia del mango maduro y jugoso capturada en un dispositivo premium. Sabor tropical intenso que no cansa." },
  { id: 9, name: "PEACH", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/4xZ1Zk1f/PEACH.webp", description: "Puro sabor a durazno aterciopelado y dulce. Un clásico perfectamente logrado con el rendimiento excepcional de Elfbar." },
  { id: 10, name: "SCARY BERRY", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/K8F5FS5D/SCARY-BERRY.png", description: "Misteriosa y atrapante mezcla de bayas silvestres oscuras. Perfil dulce con notas sutilmente ácidas de máxima calidad." },
  { id: 11, name: "SOUR LUSH GUMMY", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/P54Q536R/SOUR-LUSH-GUMMY.png", description: "El divertido sabor de las gomitas dulces con un toque ácido irresistible. Rendimiento impecable hasta la última gota." },
  { id: 12, name: "STRAWBERRY DRAGON FRUIT", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/QMdk9QwW/STRAWBERRY-DRAGON-FRUIT.png", description: "Combinación vibrante de fresas maduras y exótica fruta del dragón. Vapor denso, sabor constante y fiabilidad extrema." },
  { id: 13, name: "STRAWBERRY ICE", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/7Lt1gCrC/STRAWBERRY-ICE.png", description: "Fresas recién recolectadas bañadas en una brisa helada. Un vapeo limpio, refrescante y sumamente agradable." },
  { id: 14, name: "STRAWBERRY WATERMELON", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/MG30ycJD/STRAWBERRY-WATERMELON.webp", description: "La clásica e infalible mezcla de fresa y sandía. Sabor dulce, afrutado y suave, respaldado por la garantía de 028 IMPORT." },
  { id: 15, name: "SUMMER SPLASH", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/LXqtvHmV/SUMMER-SPLASH.png", description: "Un cóctel frutal que captura la esencia del verano en cada calada. Dispositivo elegante con tecnología de malla avanzada." },
  { id: 16, name: "TIGERS BLOOD", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/3RyX9K3P/TIGERS-BLOOD.jpg", description: "Famosa mezcla de sandía y fresa con un exótico y suave toque de coco. Un perfil de sabor complejo y altamente demandado." },
  { id: 17, name: "WATERMELON ICE", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "Refrescante", image: "https://i.postimg.cc/63DdmD3s/WATERMELON-ICE.webp", description: "Todo el jugo y la dulzura de la sandía con un impacto extra helado. Máximo poder refrescante en un formato premium." },
  { id: 25, name: "SOUR APPLE ICE", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/X7QqQDGS/SOUR-APPLE-ICE.jpg", description: "Manzana verde crujiente y ácida envuelta en una ráfaga de frío. Ideal para cortar con la rutina mediante sabores vibrantes." },
  { id: 26, name: "MIAMI MINT", price: 26000, section: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/bJhqzQDS/MIAMI-MINT.jpg", description: "Menta sofisticada estilo Miami: fresca, dulce pero con presencia. Limpia el paladar y brinda un golpe de garganta excepcional." },
  { id: 30, name: "BLUE RAZZ LEMON", price: 28000, section: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/Jh48hT4x/ignite-v400-BLUE-RAZZ-LEMON.jpg", description: "Dispositivo ultracompacto y premium de Ignite. Intensa frambuesa azul equilibrada con notas cítricas de limón." },
  { id: 31, name: "CHERRY WATERMELON", price: 28000, section: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/nLRJ9vCd/ignite-v400-cherry-watermelon.jpg", description: "Diseño elegante característico de Ignite con un mix insuperable de cereza y sandía. Portabilidad extrema y sabor consistente." },
  { id: 32, name: "GRAPE", price: 28000, section: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/0QzqYbSv/ignite-v400-GRAPE.jpg", description: "Sabor a uva puro y directo. Ignite v400 te garantiza la mejor tecnología en un vaporizador minimalista de alta gama." },
  { id: 33, name: "MIAMI MINT", price: 28000, section: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/gJ1bNmyJ/ignite-v400-miami-mint.jpg", description: "Menta premium y refrescante en el formato más cómodo del mercado. Componentes de máxima pureza y fiabilidad total." },
  { id: 34, name: "PASSION FRUIT", price: 28000, section: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/vT9FKkXt/Ignite-v400-PASSION-FRUIT.jpg", description: "El toque ácido y exótico del maracuyá en cada calada. Calidad Ignite asegurada por el servicio logístico de 028 IMPORT." },
  { id: 35, name: "STRAWBERRY WATERMELON", price: 28000, section: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/FFJ41kmG/Ignite-v400-STRAWBERR-WATERMELON.jpg", description: "Dulce, frutal y perfectamente balanceado. Fresa y sandía en un dispositivo discreto que nunca compromete la potencia." },
  { id: 36, name: "STRAWBERRY KIWI", price: 28000, section: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/Hsw19GrJ/ignite-v400-STRAWBERRY-KIWI.jpg", description: "Fresa dulce combinada con el toque tropical del kiwi. Ignite te ofrece elegancia, rendimiento y una experiencia sin fallas." },
  { id: 37, name: "STRAWBERRY", price: 28000, section: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/cLdyDD35/ignite-v400-strawberry.jpg", description: "Auténtico sabor a fresa de principio a fin. Fabricado bajo los estrictos controles de calidad de la marca Ignite." },
  { id: 38, name: "TUTTI FRUTI", price: 28000, section: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/mgVxKQ3v/ignite-v400-TUTI-FRUTI.jpg", description: "Explosión de golosinas frutales en un vaporizador compacto. Diseñado para un consumo discreto, rápido y lleno de sabor." },
  { id: 39, name: "BLUE RAZZ ICE", price: 23000, section: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/yYk7mpF9/Lost-mary-20000-BLUE-RAZZ-ICE.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 40, name: "GRAPE ICE", price: 23000, section: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/wTZg05VC/Lost-mary-20000-GRAPE-ICE.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 41, name: "ICE MINT", price: 23000, section: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/wTZg05V5/lost-mary-20000-ICE-MINT.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 42, name: "LIME GRAPE FRUIT", price: 23000, section: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/7LqcVbpW/Lost-mary-20000-LIME-GRAPE-FRUIT.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 43, name: "MANGO MAGIC", price: 23000, section: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/8CwYnNGc/Lost-mary-20000-MANGO-TWIST.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 44, name: "MEXICAN MANGO", price: 23000, section: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/bvL5FpPx/Lost-mary-20000-MEXICAN-MANGO.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 45, name: "MIAMI MINT", price: 23000, section: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/yWqpSNmv/Lost-mary-20000-MIAMI-MINT.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 46, name: "STRAWBERRY ICE", price: 23000, section: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/zDLJWPw3/Lost-mary-20000-STRAWBERRY-ICE.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 47, name: "STRAWBERRY KIWI", price: 23000, section: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/59Hxvk5q/Lost-mary-20000-STRAWBERRY-KIWI.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 18, name: "BLOW THC", price: 55000, section: "THC", category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp", description: "Dispositivo de alta pureza con extracciones premium. Diseño discreto, golpe suave y un efecto prolongado garantizado." },
  { id: 19, name: "TORCH 7.5G", price: 53000, section: "THC", category: "Vapes THC", tag: "", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png", description: "Capacidad extrema de 7.5G de extracto premium. Pantalla digital, función de precalentamiento y la mejor potencia del mercado." },
  { id: 29, name: "TORCH 4.5G", price: 52500, section: "THC", category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/vmFK42hC/TORCH-4-5G.jpg", description: "4.5G de puro rendimiento. Diseño ergonómico, tecnología avanzada anti-obstrucciones y un efecto potente e inmediato." },
  { id: 20, name: "PHENOM 6G", price: 56000, section: "THC", category: "Vapes THC", tag: "Destacado", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg", description: "Dispositivo de grado premium cargado con 6G. Extracción de máxima pureza para una experiencia intensa y de altísimo nivel." },
  { id: 27, name: "PLAYSTATION 5", price: 550, section: "TECNOLOGÍA", category: "PlayStation", tag: "USD", image: "https://i.postimg.cc/RFGS0Wzt/PLAY-5.jpg", description: "PlayStation 5 original en caja sellada. Máximo rendimiento gaming de nueva generación. Calidad garantizada con la logística y atención exclusiva de 028 IMPORT." },
  { id: 28, name: "AIRPODS PRO", price: 35000, section: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "Nuevo", image: "https://i.postimg.cc/X7gzDt0p/AIRPODS-PRO.jpg", description: "Auriculares inalámbricos 100% originales con cancelación activa de ruido y audio espacial. Máxima fidelidad de sonido y ecología Apple." },
  { id: 21, name: "CARGADOR 20W", price: 16500, section: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg", description: "Adaptador de corriente USB-C de 20W original Apple. Carga rápida, segura y eficiente en caja sellada de fábrica." },
  { id: 22, name: "CARGADOR 35W", price: 20500, section: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "Potente", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg", description: "Adaptador de corriente dual USB-C de 35W original Apple. Potencia de sobra para cargar múltiples dispositivos al mismo tiempo." },
  { id: 23, name: "CABLE USB-C A USB-C", price: 13500, section: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg", description: "Cable original Apple de USB-C a USB-C. Sincronización impecable y soporte de alta potencia. Material resistente y duradero." },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M", price: 13500, section: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg", description: "Cable original Apple USB-C a Lightning de 2 metros de longitud. Extrema comodidad y compatibilidad garantizada para carga rápida." },
  { id: 50, name: "LABUBU V2", price: 17500, section: "LIFESTYLE", category: "Labubu", tag: "Viral", image: "https://i.postimg.cc/654362/labubu.png", description: "Muñeco coleccionable original. Consultar modelos por privado." },
  { id: 51, name: "TERMO STANLEY 1.2L", price: 85000, section: "LIFESTYLE", category: "Stanley", tag: "Original", image: "https://i.postimg.cc/placeholder/stanley.png", description: "Termo original con garantía de por vida. Consultar colores disponibles." },
  { id: 52, name: "MIEL ENERGY MASCULINA", price: 15000, section: "BIENESTAR", category: "Mieles", tag: "Hot", image: "https://i.postimg.cc/placeholder/miel_h.png", description: "Miel para rendimiento sexual masculino. 100% natural y de efecto comprobado." },
  { id: 53, name: "MIEL ENERGY FEMENINA", price: 15000, section: "BIENESTAR", category: "Mieles", tag: "Hot", image: "https://i.postimg.cc/placeholder/miel_m.png", description: "Miel para rendimiento sexual femenino. Efecto inmediato." }
];

// --- CONTENIDO DE PÁGINAS LEGALES COMPLETO Y ORIGINAL ---
const PAGE_CONTENT = {
  terminos: {
    title: "Términos y Condiciones",
    subtitle: "Legal & Políticas Comerciales",
    body: (
      <div className="space-y-8 text-gray-600 leading-relaxed text-sm md:text-base">
        <p>El acceso y uso de la plataforma 028 IMPORT (en adelante, "la Tienda" o "Nosotros") se rige por los presentes Términos y Condiciones. Al utilizar nuestro sitio web, usted acepta íntegramente las políticas aquí detalladas.</p>
        <div>
          <h3 className="text-black font-black uppercase tracking-widest text-sm mb-3">1. Naturaleza del Servicio</h3>
          <p>028 IMPORT opera como un catálogo virtual interactivo. Los productos añadidos a la "Bolsa de Compras" no constituyen una reserva legal de inventario ni una transacción comercial finalizada. La confirmación del pedido, fijación del precio final y reserva de stock se perfecciona de manera exclusiva a través de nuestro canal oficial de WhatsApp, mediado por un asesor de ventas.</p>
        </div>
        <div>
          <h3 className="text-black font-black uppercase tracking-widest text-sm mb-3">2. Precios y Disponibilidad</h3>
          <p>Nos esforzamos por mantener nuestro catálogo actualizado en tiempo real. No obstante, debido a fluctuaciones arancelarias y dinámicas del mercado de importación, los precios publicados tienen carácter referencial. 028 IMPORT se reserva el derecho de modificar los precios sin previo aviso antes de la confirmación formal del pago.</p>
        </div>
        <div>
          <h3 className="text-black font-black uppercase tracking-widest text-sm mb-3">3. Garantía de Originalidad</h3>
          <p>Garantizamos de manera absoluta la autenticidad y el origen legítimo de todos los artículos comercializados. Todo producto es entregado en su embalaje original y con los sellos de seguridad correspondientes emitidos por el fabricante.</p>
        </div>
        <div>
          <h3 className="text-black font-black uppercase tracking-widest text-sm mb-3">4. Política de Cambios y Garantías</h3>
          <p>Dado el carácter personal y consumible de gran parte de nuestro catálogo, no se aceptarán cambios ni devoluciones por motivos de "insatisfacción" o error en la elección del sabor/modelo una vez que el precinto de seguridad haya sido vulnerado. Solo se admitirán reclamos por defectos técnicos de fabricación, los cuales deberán ser notificados dentro de las 48 horas posteriores a la recepción, adjuntando evidencia visual.</p>
        </div>
      </div>
    )
  },
  privacidad: {
    title: "Política de Privacidad",
    subtitle: "Protección de Datos Personales",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base">
        <p className="text-lg font-medium text-black">En 028 IMPORT, la salvaguarda y confidencialidad de su información personal es una absoluta prioridad.</p>
        <p>La presente Política de Privacidad describe cómo recopilamos, utilizamos y protegemos los datos que usted nos proporciona, en estricto cumplimiento con la Ley de Protección de los Datos Personales (Nº 25.326) de la República Argentina.</p>
        <h3 className="text-black font-black uppercase tracking-widest text-sm mt-8 mb-2">Recopilación de Información</h3>
        <p>A través de nuestra plataforma, podemos solicitar datos básicos como su nombre y datos de domicilio/ubicación (para envíos). No procesamos ni almacenamos datos financieros, bancarios ni tarjetas de crédito en nuestros servidores.</p>
        <h3 className="text-black font-black uppercase tracking-widest text-sm mt-8 mb-2">Uso Exclusivo de los Datos</h3>
        <p>La información recolectada se utiliza con los siguientes fines exclusivos:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Gestión logística y coordinación efectiva de las entregas.</li>
          <li>Comunicación directa vía WhatsApp para confirmación de pedidos.</li>
        </ul>
        <h3 className="text-black font-black uppercase tracking-widest text-sm mt-8 mb-2">No Divulgación a Terceros</h3>
        <p>028 IMPORT garantiza que bajo ninguna circunstancia comercializará, alquilará ni compartirá su base de datos de clientes con entidades externas, agencias de publicidad o terceros no involucrados en la cadena logística de su pedido.</p>
      </div>
    )
  },
  cookies: {
    title: "Política de Cookies",
    subtitle: "Transparencia Tecnológica",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base">
        <p>Para asegurar una navegación fluida y una experiencia de usuario de primer nivel, 028 IMPORT utiliza tecnologías de almacenamiento local y cookies estrictamente necesarias.</p>
        <h3 className="text-black font-black uppercase tracking-widest text-sm mt-8 mb-2">¿Qué utilizamos y para qué?</h3>
        <p>Implementamos soluciones de "Local Storage" (Almacenamiento Local del Navegador) con el único fin de conservar los productos que usted añade a su "Bolsa". Esto permite que, si usted recarga la página o cierra accidentalmente la ventana, su selección de productos se mantenga intacta al regresar.</p>
        <h3 className="text-black font-black uppercase tracking-widest text-sm mt-8 mb-2">Cookies Analíticas y Publicitarias</h3>
        <p>Nuestra plataforma está diseñada desde una perspectiva de mínima invasión. No empleamos cookies de rastreo publicitario de terceros que sigan su actividad en otros sitios web ni realizamos prácticas de "retargeting" agresivo.</p>
        <p className="mt-8">Al continuar utilizando este sitio, usted comprende y acepta el uso de estas herramientas tecnológicas esenciales para el funcionamiento del carrito de compras.</p>
      </div>
    )
  },
  pagos: {
    title: "Medios de Pago",
    subtitle: "Transacciones Seguras",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base">
        <p>Con el objetivo de garantizar su seguridad y ofrecerle flexibilidad, en 028 IMPORT procesamos los pagos por fuera de la plataforma web, evitando que usted deba ingresar datos sensibles en línea.</p>
        <h3 className="text-black font-black uppercase tracking-widest text-sm mt-8 mb-4">Alternativas Disponibles:</h3>
        <ul className="space-y-4">
          <li className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-black">
              <i className="fas fa-university"></i>
            </div>
            <div>
              <p className="font-bold text-black">Transferencia Bancaria (ARS)</p>
              <p className="text-sm mt-1">Acreditación rápida mediante CBU/CVU o Alias. Ideal para operaciones a distancia.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-black">
              <i className="fab fa-bitcoin"></i>
            </div>
            <div>
              <p className="font-bold text-black">Criptoactivos (USDT)</p>
              <p className="text-sm mt-1">Aceptamos pagos internacionales o descentralizados a través de redes estables como TRC20, BSC o Binance Pay.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-black">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div>
              <p className="font-bold text-black">Efectivo</p>
              <p className="text-sm mt-1">Exclusivo para la modalidad de Retiro Pick-up o envío mediante motomensajería propia (Pago contra entrega).</p>
            </div>
          </li>
        </ul>
        <div className="border-t border-gray-200 pt-6 mt-8">
          <p className="text-xs uppercase tracking-widest font-black text-gray-400 mb-2">Aviso de Seguridad</p>
          <p className="text-sm">Al confirmar su carrito, la web generará un mensaje automático de WhatsApp con el resumen de su pedido. Nuestro asesor le brindará por ese medio los datos oficiales para efectuar el pago correspondiente.</p>
        </div>
      </div>
    )
  },
  arrepentimiento: {
    title: "Botón de Arrepentimiento",
    subtitle: "Marco Legal y Devoluciones",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base">
        <p>En cumplimiento con las disposiciones de la Dirección Nacional de Defensa del Consumidor, 028 IMPORT pone a su disposición las directrices para la revocación de compra.</p>
        <h3 className="text-black font-black uppercase tracking-widest text-sm mt-8 mb-2">Plazo Legal</h3>
        <p>Usted tiene el derecho irrevocable de cancelar su compra dentro de un plazo máximo de <strong>10 (diez) días corridos</strong> contados desde la fecha de recepción del producto en su domicilio o desde el retiro en sucursal.</p>
        <h3 className="text-black font-black uppercase tracking-widest text-sm mt-8 mb-2">Condiciones Innegociables para Aceptación</h3>
        <p>Dada la naturaleza de los productos comercializados en nuestro catálogo (artículos de consumo personal e higiene), la devolución será aceptada pura y exclusivamente si se cumplen los siguientes requisitos de manera estricta:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>El producto debe encontrarse en <strong>estado impecable, inmaculado y totalmente sin uso</strong>.</li>
          <li>Los sellos térmicos, precintos de fábrica y plásticos protectores deben estar <strong>intactos y sin alteraciones</strong>.</li>
          <li>El packaging o cajas no deben presentar roturas, marcas ni abolladuras.</li>
        </ul>
        <div className="bg-red-50 text-red-800 p-4 rounded-xl mt-6 border border-red-100 text-sm">
          <strong>IMPORTANTE:</strong> Por normativas sanitarias, si un dispositivo electrónico de consumo o esencia ha sido abierto, encendido o sus sellos han sido rotos, se perderá automáticamente el derecho a devolución por arrepentimiento.
        </div>
        <p className="mt-8">Para iniciar el trámite, le solicitamos contactarse inmediatamente a nuestra línea de WhatsApp informando su número de pedido y adjuntando fotografías del estado del producto.</p>
      </div>
    )
  }
};

export default function Home() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState(initialProducts);
  const [promos, setPromos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Vistas y navegación (App-Style)
  const [currentView, setCurrentView] = useState('home');
  const [activeDept, setActiveDept] = useState(null); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Checkout
  const [deliveryMethod, setDeliveryMethod] = useState('retiro');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('');
  const [user, setUser] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // LÓGICA DE CATEGORÍAS AUTOMÁTICA
  const departments = useMemo(() => {
    return [...new Set(products.map(p => p.section || 'OTROS'))];
  }, [products]);

  const categoriesInActiveDept = useMemo(() => {
    if (!activeDept) return [];
    return [...new Set(products.filter(p => (p.section || 'OTROS') === activeDept).map(p => p.category))];
  }, [products, activeDept]);

  const firebaseRefs = useMemo(() => {
    if (typeof window === "undefined") return { auth: null, db: null };
    try {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      return { auth: getAuth(app), db: getFirestore(app) };
    } catch (error) {
      return { auth: null, db: null };
    }
  }, []);

  useEffect(() => {
    const handleFocus = () => setIsSending(false);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handleFocus);

    if (firebaseRefs.auth && firebaseRefs.db) {
      signInAnonymously(firebaseRefs.auth).catch(console.error);
      const unsubscribeAuth = onAuthStateChanged(firebaseRefs.auth, (u) => setUser(u));

      const unsubscribeStock = onSnapshot(collection(firebaseRefs.db, 'products'), (snapshot) => {
        setIsLoading(false);
        if (!snapshot.empty) {
          const dbProducts = snapshot.docs.map(doc => ({ dbId: doc.id, ...doc.data() }));
          setProducts(prev => {
             const combined = [...initialProducts];
             dbProducts.forEach(dbItem => {
                const index = combined.findIndex(p => p.id == dbItem.id);
                if (dbItem.isHidden || dbItem.isDeleted) {
                    if (index > -1) combined.splice(index, 1);
                } else {
                    if (index > -1) combined[index] = { ...combined[index], ...dbItem };
                    else combined.push(dbItem);
                }
             });
             return combined.sort((a, b) => (a.order || 99) - (b.order || 99));
          });
        }
      });

      const unsubscribePromos = onSnapshot(collection(firebaseRefs.db, 'promos'), (snapshot) => {
        if (!snapshot.empty) setPromos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        else setPromos([]);
      });

      return () => {
        unsubscribeAuth();
        unsubscribeStock();
        unsubscribePromos();
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('pageshow', handleFocus);
      };
    } else {
      setTimeout(() => setIsLoading(false), 800);
    }
  }, [firebaseRefs]);

  const formatPrice = (n) => n ? n.toLocaleString('es-AR') : '0';
  const getTotalItems = () => cart.reduce((acc, item) => acc + item.qty, 0);
  
  const getUnitPromoPrice = (item) => {
    const promo = promos.find(p => p.category === item.category);
    if (promo) {
        const catCount = cart.filter(i => i.category === item.category).reduce((acc, curr) => acc + curr.qty, 0);
        if (catCount >= promo.minQty) return promo.totalPrice / promo.minQty;
    }
    return item.price;
  };

  const calculateTotal = () => cart.reduce((acc, item) => acc + (item.qty * getUnitPromoPrice(item)), 0);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const openDepartment = (dept) => {
      setActiveDept(dept);
      setCurrentView('catalog');
      setIsMenuOpen(false);
      window.scrollTo(0,0);
  };

  const addToCart = (product, e) => {
    if(e) e.stopPropagation();
    if (product.inStock === false) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`✅ Añadido a la bolsa`);
  };

  const changeQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const handleCheckout = async () => {
    if (!clientName.trim() || !clientPhone.trim()) return showToast("⚠️ Completá tu Nombre y Teléfono.");
    if (deliveryMethod === 'envio' && (!address.trim() || !zone.trim())) return showToast("⚠️ Completá tu dirección y localidad.");
    
    setIsSending(true);
    const finalTotal = calculateTotal();
    let msg = `Hola *${CONFIG.brandName}*, mi pedido:\n`;
    
    cart.forEach(item => {
      const unitPrice = getUnitPromoPrice(item);
      const currency = item.price < 2000 ? "USD" : "$"; 
      let displayName = ['ELFBAR ICE KING', 'IGNITE V400', 'LOST MARY 20000'].includes(item.category.toUpperCase().trim()) ? `${item.category} - ${item.name}` : item.name;
      msg += `- ${item.qty}x ${displayName} (${currency}${formatPrice(unitPrice)} c/u)\n`;
    });
    
    msg += `\n*TOTAL: ${CONFIG.currencySymbol}${formatPrice(finalTotal)}*\n`;
    msg += deliveryMethod === 'envio' ? `*ENVIO:* ${address}, ${zone}\n` : `*RETIRO EN LOCAL*\n`;

    const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;

    try {
      if (firebaseRefs.db) {
        await addDoc(collection(firebaseRefs.db, 'orders'), {
          userId: user?.uid || "anon",
          clientName: clientName.trim(), clientPhone: clientPhone.trim(),
          items: cart.map(i => ({ name: ['ELFBAR ICE KING', 'IGNITE V400', 'LOST MARY 20000'].includes(i.category.toUpperCase().trim()) ? `${i.category} - ${i.name}` : i.name, qty: i.qty, price: getUnitPromoPrice(i) })),
          total: finalTotal, delivery: deliveryMethod, address: address || '', zone: zone || '', status: 'pending', createdAt: serverTimestamp()
        });
      }
      setTimeout(() => { window.location.href = whatsappUrl; }, 400);
    } catch (e) {
      window.location.href = whatsappUrl;
    }
  };

  // --- VISTA 1: EL INICIO (VITRINA) ---
  const renderHome = () => (
      <div className="animate-in fade-in pb-24">
          <div className="relative h-[35vh] bg-black flex flex-col justify-center items-center overflow-hidden shadow-2xl">
             <div className="absolute inset-0 bg-cover bg-center opacity-40 scale-105" style={{backgroundImage: `url(${CONFIG.bannerImage})`}} />
             <div className="absolute inset-0 bg-gradient-to-t from-[#f2f4f7] to-transparent opacity-90" />
             <h2 className="relative z-10 text-5xl md:text-7xl font-black uppercase tracking-tighter text-black drop-shadow-xl text-center leading-none mt-10">028<br/><span className="text-[#d4af37]">IMPORT</span></h2>
             <p className="relative z-10 text-xs md:text-sm font-black uppercase tracking-widest bg-black text-white px-5 py-2 rounded-full mt-4 shadow-xl">{CONFIG.shippingText}</p>
          </div>

          <div className="px-4 max-w-5xl mx-auto -mt-8 relative z-20">
              <h3 className="font-black text-sm uppercase tracking-widest text-gray-500 mb-4 pl-2">Seleccioná un Departamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departments.includes('VAPES') && (
                      <div onClick={() => openDepartment('VAPES')} className="bg-black rounded-[2rem] p-6 shadow-xl relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform">
                          <div className="absolute -right-6 -bottom-6 opacity-20"><i className="fas fa-wind text-9xl text-[#d4af37]"></i></div>
                          <h4 className="text-[#d4af37] font-black text-2xl uppercase tracking-tighter mb-1 relative z-10">Vapes & Nicotina</h4>
                          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest relative z-10">Ignite, Elfbar, Lost Mary</p>
                          <button className="mt-8 bg-white text-black px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest relative z-10 shadow-md">Ver Catálogo <i className="fas fa-arrow-right ml-1"></i></button>
                      </div>
                  )}
                  {departments.includes('THC') && (
                      <div onClick={() => openDepartment('THC')} className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform">
                          <div className="absolute -right-6 -bottom-6 opacity-5"><i className="fas fa-leaf text-9xl text-green-600"></i></div>
                          <h4 className="text-green-600 font-black text-2xl uppercase tracking-tighter mb-1 relative z-10">THC Premium</h4>
                          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest relative z-10">Dispositivos y Extracciones</p>
                          <button className="mt-8 bg-black text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest relative z-10 shadow-md">Ver Catálogo <i className="fas fa-arrow-right ml-1"></i></button>
                      </div>
                  )}
                  {departments.includes('TECNOLOGÍA') && (
                      <div onClick={() => openDepartment('TECNOLOGÍA')} className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform">
                          <div className="absolute -right-6 -bottom-6 opacity-5"><i className="fas fa-gamepad text-9xl text-blue-600"></i></div>
                          <h4 className="text-black font-black text-2xl uppercase tracking-tighter mb-1 relative z-10">Tecnología</h4>
                          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest relative z-10">Apple, PlayStation, Gaming</p>
                          <button className="mt-8 bg-black text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest relative z-10 shadow-md">Ver Catálogo <i className="fas fa-arrow-right ml-1"></i></button>
                      </div>
                  )}
                  {departments.includes('LIFESTYLE') && (
                      <div onClick={() => openDepartment('LIFESTYLE')} className="bg-gradient-to-br from-[#d4af37] to-[#b8952a] rounded-[2rem] p-6 shadow-xl relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform md:col-span-2">
                          <div className="absolute -right-6 -bottom-6 opacity-20"><i className="fas fa-star text-9xl text-white"></i></div>
                          <h4 className="text-white font-black text-2xl uppercase tracking-tighter mb-1 relative z-10">Lifestyle & Tendencias</h4>
                          <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest relative z-10">Stanley, Coleccionables y Virales</p>
                          <button className="mt-8 bg-white text-black px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest relative z-10 shadow-xl">Ver Catálogo <i className="fas fa-arrow-right ml-1"></i></button>
                      </div>
                  )}
                  {departments.includes('BIENESTAR') && (
                      <div onClick={() => openDepartment('BIENESTAR')} className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform md:col-span-2">
                          <div className="absolute -right-6 -bottom-6 opacity-5"><i className="fas fa-fire text-9xl text-red-500"></i></div>
                          <h4 className="text-red-500 font-black text-2xl uppercase tracking-tighter mb-1 relative z-10">Bienestar Íntimo</h4>
                          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest relative z-10">Rendimiento y Energía</p>
                          <button className="mt-8 bg-black text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest relative z-10 shadow-md">Ver Catálogo <i className="fas fa-arrow-right ml-1"></i></button>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );

  // --- VISTA 2: EL CATÁLOGO (DOBLE FILTRO) ---
  const renderCatalog = () => {
      let filtered = products.filter(p => (p.section || 'OTROS') === activeDept);
      
      return (
          <div className="animate-in fade-in slide-in-from-right-8 pb-24 max-w-7xl mx-auto w-full">
             
             {/* Cabecera del Departamento con botón volver */}
             <div className="bg-[#f2f4f7] pt-6 pb-2 px-4 sticky top-14 z-30">
                 <button onClick={() => setCurrentView('home')} className="text-gray-500 hover:text-black text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 transition-colors"><i className="fas fa-arrow-left"></i> Departamentos</button>
                 <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-black leading-none">{activeDept}</h2>
             </div>

             <div className="p-4 mt-2">
                 {categoriesInActiveDept.map(category => {
                     const catProducts = filtered.filter(p => p.category === category);
                     const promo = promos.find(pr => pr.category === category);
                     
                     if(catProducts.length === 0) return null;

                     return (
                         <div key={category} className="mb-12">
                             <div className="flex items-center gap-3 mb-5 pl-1 border-b border-gray-200 pb-2">
                                 <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-gray-800">{category}</h3>
                                 {promo && <span className="bg-[#d4af37]/10 text-[#b8952a] px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-[#d4af37]/30"><i className="fas fa-bolt mr-1"></i>Llevando {promo.minQty}+: ${formatPrice(promo.totalPrice / promo.minQty)} c/u</span>}
                             </div>
                             
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                                 {catProducts.map(p => {
                                    const inCart = cart.find(i => i.id === p.id);
                                    const isOutOfStock = p.inStock === false;

                                    return (
                                     <div key={p.id} className={`bg-white rounded-3xl p-3 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative transition-all active:scale-[0.98] cursor-pointer hover:shadow-lg ${isOutOfStock ? 'opacity-60' : ''}`} onClick={() => setSelectedProduct(p)}>
                                         <div className="aspect-square bg-[#f8f9fa] rounded-2xl overflow-hidden mb-3 flex items-center justify-center p-4 relative">
                                            <img src={p.image} className="w-full h-full object-contain mix-blend-multiply" alt={p.name} />
                                            {isOutOfStock && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center"><span className="bg-black text-white text-[9px] font-black px-3 py-1 rounded-full uppercase shadow-xl">Agotado</span></div>}
                                            {p.tag && !isOutOfStock && <span className="absolute top-2 left-2 bg-black text-[#d4af37] text-[8px] font-black px-2.5 py-1 rounded-full uppercase shadow-lg">{p.tag}</span>}
                                         </div>
                                         <div className="flex-1 flex flex-col">
                                            <h4 className="text-[11px] md:text-sm font-bold uppercase text-gray-800 line-clamp-2 leading-snug pr-6">{p.name}</h4>
                                            <div className="mt-auto pt-3 flex justify-between items-end">
                                               <p className="font-black text-lg md:text-xl text-black tracking-tighter"><span className="text-[#d4af37] text-[10px] md:text-xs mr-0.5">$</span>{formatPrice(p.price)}</p>
                                            </div>
                                         </div>
                                         
                                         {/* Botón Flotante Agregar */}
                                         {!isOutOfStock && (
                                            <div className="absolute bottom-3 right-3" onClick={(e) => e.stopPropagation()}>
                                               {inCart ? (
                                                   <div className="flex flex-col items-center bg-black text-white rounded-full p-1 shadow-xl">
                                                      <button className="w-7 h-7 flex items-center justify-center hover:text-[#d4af37]" onClick={() => changeQty(p.id, 1)}><i className="fas fa-plus text-[10px]"></i></button>
                                                      <span className="text-[10px] font-black my-0.5 text-[#d4af37]">{inCart.qty}</span>
                                                      <button className="w-7 h-7 flex items-center justify-center hover:text-[#d4af37]" onClick={() => changeQty(p.id, -1)}><i className="fas fa-minus text-[10px]"></i></button>
                                                   </div>
                                               ) : (
                                                   <button onClick={(e) => addToCart(p, e)} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#d4af37] hover:text-black transition-colors shadow-lg hover:shadow-[#d4af37]/30">
                                                      <i className="fas fa-plus text-sm"></i>
                                                   </button>
                                               )}
                                            </div>
                                         )}
                                     </div>
                                    )
                                 })}
                             </div>
                         </div>
                     );
                 })}
             </div>
          </div>
      );
  };

  return (
    <div className="bg-[#f2f4f7] min-h-screen font-sans flex flex-col relative">
      
      {/* TOASTS */}
      {toastMessage && <div className="fixed top-safe mt-4 left-1/2 -translate-x-1/2 z-[100] bg-black/90 backdrop-blur-xl text-white px-5 py-3 rounded-full shadow-2xl border border-white/10 font-bold text-[10px] uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-5 whitespace-nowrap">{toastMessage}</div>}

      {/* HEADER PRINCIPAL FIJO */}
      <header className="bg-black sticky top-0 z-50 h-14 md:h-16 flex items-center justify-between px-4 shadow-md">
         <div className="flex items-center gap-3">
             <button onClick={() => setIsMenuOpen(true)} className="text-white text-xl p-1 md:hidden"><i className="fas fa-bars"></i></button>
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setCurrentView('home'); window.scrollTo(0,0);}}>
                <img src={CONFIG.logoImage} alt="Logo" className="h-8 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                <span className="text-white font-black uppercase tracking-widest text-sm md:text-base">028<span className="text-[#d4af37]">IMPORT</span></span>
             </div>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={() => setIsSearchOpen(true)} className="text-white text-lg p-1 hover:text-[#d4af37] transition-colors"><i className="fas fa-search"></i></button>
            <button onClick={() => setIsCartOpen(true)} className="hidden md:flex bg-white text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#d4af37] transition-all items-center gap-2">
               Mi Bolsa <span className="bg-black text-white px-1.5 py-0.5 rounded-full text-[9px]">{getTotalItems()}</span>
            </button>
         </div>
      </header>

      {/* MENÚ HAMBURGUESA (DRAWER LATERAL) MOBILE */}
      {isMenuOpen && (
          <div className="fixed inset-0 z-[80] flex md:hidden">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}></div>
              <div className="w-[80%] max-w-[300px] bg-white h-full relative z-10 animate-in slide-in-from-left duration-300 flex flex-col shadow-2xl">
                  <div className="p-6 bg-black flex justify-between items-center">
                     <span className="text-white font-black uppercase tracking-widest">028<span className="text-[#d4af37]">IMPORT</span></span>
                     <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 text-xl"><i className="fas fa-times"></i></button>
                  </div>
                  <div className="flex-1 overflow-y-auto py-4">
                      <p className="px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Navegación</p>
                      <button onClick={() => {setCurrentView('home'); setIsMenuOpen(false); window.scrollTo(0,0);}} className={`w-full text-left px-6 py-4 font-black uppercase text-sm border-l-4 ${currentView==='home' ? 'border-[#d4af37] bg-gray-50 text-black' : 'border-transparent text-gray-600'}`}><i className="fas fa-home w-6"></i> Inicio</button>
                      
                      <div className="w-full h-px bg-gray-100 my-2"></div>
                      <p className="px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 mt-4">Departamentos</p>
                      {departments.map(dept => (
                          <button key={dept} onClick={() => openDepartment(dept)} className={`w-full text-left px-6 py-4 font-black uppercase text-sm border-l-4 ${activeDept===dept && currentView==='catalog' ? 'border-[#d4af37] bg-gray-50 text-black' : 'border-transparent text-gray-600'}`}>{dept}</button>
                      ))}
                      
                      <div className="w-full h-px bg-gray-100 my-4"></div>
                      <p className="px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Legal & Ayuda</p>
                      <button onClick={() => {setCurrentView('terminos'); setIsMenuOpen(false);}} className="w-full text-left px-6 py-3 font-bold text-xs text-gray-500 uppercase hover:text-black">Términos de Venta</button>
                      <button onClick={() => {setCurrentView('pagos'); setIsMenuOpen(false);}} className="w-full text-left px-6 py-3 font-bold text-xs text-gray-500 uppercase hover:text-black">Medios de Pago</button>
                      <button onClick={() => {setCurrentView('arrepentimiento'); setIsMenuOpen(false);}} className="w-full text-left px-6 py-3 font-bold text-xs text-gray-500 uppercase hover:text-black">Devoluciones</button>
                  </div>
              </div>
          </div>
      )}

      {/* RENDERIZADO DE LA VISTA ACTIVA */}
      {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 h-[50vh]"><i className="fas fa-circle-notch fa-spin text-3xl mb-4 text-[#d4af37]"></i><p className="text-[10px] font-black uppercase tracking-widest">Cargando Catálogo</p></div>
      ) : (
          <div className="flex-1">
             {currentView === 'home' && renderHome()}
             {currentView === 'catalog' && renderCatalog()}
             {['terminos', 'pagos', 'arrepentimiento', 'privacidad'].includes(currentView) && (
                <div className="p-6 max-w-3xl mx-auto pb-24 mt-8 bg-white rounded-3xl shadow-sm border border-gray-100">
                   <button onClick={() => setCurrentView('home')} className="text-gray-400 hover:text-black text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2"><i className="fas fa-arrow-left"></i> Volver al Inicio</button>
                   <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-8">{PAGE_CONTENT[currentView].title}</h1>
                   {PAGE_CONTENT[currentView].body}
                </div>
             )}
          </div>
      )}

      {/* NAVEGACIÓN INFERIOR FIJA MOBILE (APP-STYLE) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 z-40 pb-safe flex justify-around items-center h-16 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
         <button onClick={() => {setCurrentView('home'); window.scrollTo(0,0);}} className={`flex flex-col items-center gap-1 w-full ${currentView==='home' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}>
             <i className="fas fa-home text-xl"></i><span className="text-[8px] font-black uppercase tracking-widest">Inicio</span>
         </button>
         <button onClick={() => setIsSearchOpen(true)} className="flex flex-col items-center gap-1 w-full text-gray-400 hover:text-gray-600">
             <i className="fas fa-search text-xl"></i><span className="text-[8px] font-black uppercase tracking-widest">Buscar</span>
         </button>
         <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center gap-1 w-full text-black relative hover:scale-105 transition-transform">
             <div className="relative">
                 <i className="fas fa-shopping-bag text-xl"></i>
                 {getTotalItems() > 0 && <span className="absolute -top-1.5 -right-2 bg-[#d4af37] text-black text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{getTotalItems()}</span>}
             </div>
             <span className="text-[8px] font-black uppercase tracking-widest">Bolsa</span>
         </button>
      </nav>

      {/* FOOTER DESKTOP (Se oculta en mobile) */}
      <footer className="hidden md:block bg-black text-white pt-16 pb-8 border-t-4 border-[#d4af37] mt-auto relative z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <img src={CONFIG.logoImage} alt="028Import Logo" className="h-10 mb-4 drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
              <p className="text-gray-400 text-xs leading-relaxed max-w-sm">Redefinimos la experiencia de compra priorizando tu tiempo y confianza. Brindamos un servicio logístico ágil y seguro.</p>
            </div>
            <div>
              <h4 className="font-black text-[#d4af37] text-[10px] uppercase tracking-widest mb-4">Legal & Ayuda</h4>
              <ul className="space-y-3 text-gray-400 text-xs font-bold">
                 <li><button onClick={() => {setCurrentView('terminos'); window.scrollTo(0,0);}} className="hover:text-white transition-colors uppercase">Términos de Venta</button></li>
                 <li><button onClick={() => {setCurrentView('pagos'); window.scrollTo(0,0);}} className="hover:text-white transition-colors uppercase">Medios de Pago</button></li>
                 <li><button onClick={() => {setCurrentView('arrepentimiento'); window.scrollTo(0,0);}} className="hover:text-white transition-colors uppercase">Devoluciones</button></li>
                 <li><button onClick={() => {setCurrentView('privacidad'); window.scrollTo(0,0);}} className="hover:text-white transition-colors uppercase">Privacidad</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[#d4af37] text-[10px] uppercase tracking-widest mb-4">Contacto Directo</h4>
              <p className="text-gray-400 text-xs font-bold mb-4 uppercase"><i className="fab fa-whatsapp text-[#d4af37] mr-2 text-lg"></i>11 5341 2358</p>
              <a href={`https://wa.me/${CONFIG.whatsappNumber}`} target="_blank" rel="noreferrer" className="inline-block bg-[#d4af37] text-black text-[10px] font-black px-6 py-3 rounded-full uppercase tracking-widest hover:bg-white transition-colors shadow-lg">Escribinos</a>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-[9px] text-gray-600 uppercase tracking-widest text-center flex justify-between">
            <span>© {new Date().getFullYear()} 028IMPORT. Todos los derechos reservados.</span>
            <span>Argentina <i className="fas fa-map-marker-alt ml-1"></i></span>
          </div>
        </div>
      </footer>

      {/* MODAL DETALLE DE PRODUCTO */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[90] flex items-end md:items-center justify-center p-0 md:p-6">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedProduct(null)}></div>
           <div className="bg-white w-full md:max-w-4xl md:rounded-[2rem] rounded-t-3xl relative z-10 animate-in slide-in-from-bottom duration-300 pb-safe shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-20 w-8 h-8 md:w-10 md:h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-black hover:text-white transition-colors"><i className="fas fa-times text-sm"></i></button>
              
              <div className="w-full md:w-1/2 bg-[#f8f9fa] flex items-center justify-center relative p-8 h-[35vh] md:h-auto border-b md:border-b-0 md:border-r border-gray-100">
                  {selectedProduct.tag && <span className="absolute top-4 left-4 bg-black text-[#d4af37] text-[9px] font-black px-3 py-1.5 uppercase rounded-md shadow-md">{selectedProduct.tag}</span>}
                  <img src={selectedProduct.image} className="w-full h-full max-h-[400px] object-contain mix-blend-multiply drop-shadow-xl" alt={selectedProduct.name}/>
              </div>

              <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-between overflow-y-auto">
                 <div>
                    <p className="text-[#d4af37] font-black uppercase text-[9px] tracking-widest mb-2 flex items-center gap-2"><i className="fas fa-tag"></i> {selectedProduct.category}</p>
                    <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-4 text-black">{selectedProduct.name}</h2>
                    <p className="text-gray-500 text-xs leading-relaxed mb-6 whitespace-pre-line">{selectedProduct.description || "Producto de alta calidad importada. Garantía de autenticidad."}</p>
                 </div>
              
                 <div className="border-t border-gray-100 pt-6 mt-4">
                    <p className="text-4xl font-black tracking-tighter mb-6 text-black"><span className="text-[#d4af37] text-xl mr-1">$</span>{formatPrice(selectedProduct.price)}</p>
                    {selectedProduct.inStock === false ? (
                        <button disabled className="w-full bg-gray-100 text-gray-400 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest cursor-not-allowed">Sin Stock Temporalmente</button>
                    ) : (
                        <button onClick={() => {addToCart(selectedProduct); setSelectedProduct(null);}} className="w-full bg-black text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#d4af37] hover:text-black transition-colors shadow-xl shadow-black/20 flex items-center justify-center gap-2">
                           <i className="fas fa-shopping-bag"></i> Añadir a la Bolsa
                        </button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL BOLSA DE COMPRAS (CARRITO) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col justify-end items-center sm:justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="relative bg-[#f8f9fa] w-full max-w-lg md:mx-auto rounded-t-3xl md:rounded-3xl h-[90vh] md:max-h-[85vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col pb-safe">
            
            <div className="p-5 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-20">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-black text-[#d4af37] rounded-full flex items-center justify-center"><i className="fas fa-shopping-bag text-sm"></i></div>
                 <div>
                    <h2 className="text-lg font-black uppercase tracking-tighter text-black leading-none">Tu Bolsa</h2>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">{getTotalItems()} Ítems</p>
                 </div>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-black hover:text-white transition-colors"><i className="fas fa-times text-sm"></i></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar space-y-4">
              {cart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-300 py-10">
                    <i className="fas fa-box-open text-6xl mb-4 opacity-20"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest">No hay productos en la bolsa</p>
                 </div>
              ) : (
                 <>
                   <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 space-y-3">
                     {cart.map(item => (
                       <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 last:pb-0">
                         <div className="flex items-center gap-3">
                           <div className="w-12 h-12 bg-[#f8f9fa] rounded-xl p-1"><img src={item.image} className="w-full h-full object-contain mix-blend-multiply" alt=""/></div>
                           <div>
                             <p className="font-bold text-[11px] uppercase tracking-tight line-clamp-1 max-w-[130px] md:max-w-[180px]">{item.name}</p>
                             <p className="font-black text-[#d4af37] text-xs mt-0.5">${formatPrice(item.qty * getUnitPromoPrice(item))}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full p-1 shadow-inner">
                            <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-gray-500 bg-white rounded-full shadow-sm hover:text-black"><i className="fas fa-minus text-[9px]"></i></button>
                            <span className="font-black text-[11px] w-4 text-center">{item.qty}</span>
                            <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 bg-white rounded-full shadow-sm hover:text-black"><i className="fas fa-plus text-[9px]"></i></button>
                         </div>
                       </div>
                     ))}
                   </div>
                   
                   <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
                      <p className="font-black text-[10px] mb-3 uppercase tracking-widest text-gray-400 flex items-center gap-2"><i className="fas fa-user text-[#d4af37]"></i> Datos del Titular</p>
                      <div className="space-y-3">
                        <input type="text" placeholder="Nombre y Apellido" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-4 bg-[#f8f9fa] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#d4af37]/30 transition-all placeholder:text-gray-400" />
                        <input type="tel" placeholder="Nº WhatsApp (Ej: 1123456789)" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full p-4 bg-[#f8f9fa] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#d4af37]/30 transition-all placeholder:text-gray-400" />
                      </div>
                   </div>

                   <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
                      <p className="font-black text-[10px] mb-3 uppercase tracking-widest text-gray-400 flex items-center gap-2"><i className="fas fa-truck text-[#d4af37]"></i> Modalidad de Entrega</p>
                      <div className="flex gap-2 mb-3 bg-[#f8f9fa] p-1 rounded-xl">
                        <button onClick={() => setDeliveryMethod('retiro')} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${deliveryMethod === 'retiro' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Retiro Local</button>
                        <button onClick={() => setDeliveryMethod('envio')} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${deliveryMethod === 'envio' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Envío a Casa</button>
                      </div>
                      {deliveryMethod === 'envio' && (
                        <div className="space-y-3 animate-in fade-in zoom-in-95 border-t border-gray-50 pt-3">
                          <input type="text" placeholder="Calle, Número, Depto" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-4 bg-[#f8f9fa] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#d4af37]/30 transition-all placeholder:text-gray-400" />
                          <input type="text" placeholder="Barrio / Localidad / CP" value={zone} onChange={(e) => setZone(e.target.value)} className="w-full p-4 bg-[#f8f9fa] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#d4af37]/30 transition-all placeholder:text-gray-400" />
                        </div>
                      )}
                   </div>
                 </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 bg-white border-t border-gray-100 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                 <div className="flex justify-between items-end mb-4 px-1">
                   <span className="font-black text-gray-400 text-[10px] uppercase tracking-widest">Monto Final</span>
                   <span className="font-black text-3xl tracking-tighter leading-none text-black"><span className="text-[#d4af37] text-lg mr-1">$</span>{formatPrice(calculateTotal())}</span>
                 </div>
                 <button onClick={handleCheckout} disabled={isSending} className={`w-full ${isSending ? 'bg-gray-200 text-gray-400 border-none' : 'bg-black text-white hover:bg-[#d4af37] hover:text-black shadow-xl hover:shadow-[#d4af37]/40'} font-black py-4 rounded-xl uppercase tracking-widest text-[11px] flex justify-center items-center gap-3 transition-all duration-300`}>
                  {isSending ? <><i className="fas fa-circle-notch fa-spin text-sm"></i> Generando Pedido...</> : <><i className="fab fa-whatsapp text-lg text-[#d4af37]"></i> Confirmar por WhatsApp</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL BUSCADOR A PANTALLA COMPLETA */}
      {isSearchOpen && (
         <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom duration-200 flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 pt-safe shadow-sm">
               <button onClick={() => {setIsSearchOpen(false); setSearchTerm('');}} className="text-lg text-gray-400 w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-full"><i className="fas fa-arrow-left"></i></button>
               <input autoFocus type="text" placeholder="Buscá por producto, marca o categoría..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="flex-1 bg-[#f8f9fa] p-3.5 rounded-xl outline-none font-bold text-sm border border-transparent focus:border-[#d4af37]/50 transition-colors placeholder:text-gray-400 placeholder:font-medium" />
               {searchTerm && <button onClick={() => setSearchTerm('')} className="text-gray-400 w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-full"><i className="fas fa-times"></i></button>}
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa]">
               {searchTerm ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                  <div key={p.id} onClick={() => {setSelectedProduct(p); setIsSearchOpen(false);}} className="flex items-center gap-4 bg-white p-3 rounded-2xl mb-3 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 active:scale-95 transition-all cursor-pointer">
                     <div className="w-16 h-16 bg-[#f8f9fa] rounded-xl p-2 flex-shrink-0"><img src={p.image} className="w-full h-full object-contain mix-blend-multiply" alt=""/></div>
                     <div className="flex-1">
                        <h4 className="font-bold text-[11px] uppercase tracking-tight line-clamp-1">{p.name}</h4>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{p.category}</p>
                     </div>
                     <span className="font-black text-sm text-[#d4af37] pr-2">${formatPrice(p.price)}</span>
                  </div>
               )) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                     <i className="fas fa-search text-5xl opacity-20"></i>
                     <p className="text-[10px] font-black uppercase tracking-widest text-center text-gray-400">Escribí para buscar en el catálogo</p>
                  </div>
               )}
            </div>
         </div>
      )}

    </div>
  );
}