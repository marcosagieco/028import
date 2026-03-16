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
  shippingText: "Pedime te llega en 30'⏰",
};

const initialProducts = [
  { id: 1, name: "BAJA SPLASH", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png" },
  { id: 2, name: "BLUE RAZZ ICE", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/s2Tmw67w/BLUE-RAZZ-ICE.webp" },
  { id: 3, name: "CHERRY FUSE", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/yd5PzDfx/CHERRY-FUSE.png" },
  { id: 4, name: "CHERRY STRAZZ", price: 26000, category: "Elfbar Ice King", tag: "Destacado", image: "https://i.postimg.cc/7PFVsTG2/CHERRY-STRAZZ.jpg" },
  { id: 5, name: "DOUBLE APPLE ICE", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/QN9mJqtk/DOUBLE-APPLE-ICE.webp" },
  { id: 6, name: "DRAGON STRAWNANA", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/9X6p8qRB/DRAGON-STRAWNANA.png" },
  { id: 7, name: "GRAPE ICE", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/hPV0HPTw/GRAPE-ICE.webp" },
  { id: 8, name: "MANGO MAGIC", price: 26000, category: "Elfbar Ice King", tag: "Best Seller", image: "https://i.postimg.cc/tCFzLCFC/MANGO-MAGIC.png" },
  { id: 9, name: "PEACH", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/4xZ1Zk1f/PEACH.webp" },
  { id: 10, name: "SCARY BERRY", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/K8F5FS5D/SCARY-BERRY.png" },
  { id: 11, name: "SOUR LUSH GUMMY", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/P54Q536R/SOUR-LUSH-GUMMY.png" },
  { id: 12, name: "STRAWBERRY DRAGON FRUIT", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/QMdk9QwW/STRAWBERRY-DRAGON-FRUIT.png" },
  { id: 13, name: "STRAWBERRY ICE", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/7Lt1gCrC/STRAWBERRY-ICE.png" },
  { id: 14, name: "STRAWBERRY WATERMELON", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/MG30ycJD/STRAWBERRY-WATERMELON.webp" },
  { id: 15, name: "SUMMER SPLASH", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/LXqtvHmV/SUMMER-SPLASH.png" },
  { id: 16, name: "TIGERS BLOOD", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/3RyX9K3P/TIGERS-BLOOD.jpg" },
  { id: 17, name: "WATERMELON ICE", price: 26000, category: "Elfbar Ice King", tag: "Refrescante", image: "https://i.postimg.cc/63DdmD3s/WATERMELON-ICE.webp" },
  { id: 25, name: "SOUR APPLE ICE", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/X7QqQDGS/SOUR-APPLE-ICE.jpg" },
  { id: 26, name: "MIAMI MINT", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/bJhqzQDS/MIAMI-MINT.jpg" },
  { id: 30, name: "BLUE RAZZ LEMON", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/Jh48hT4x/ignite-v400-BLUE-RAZZ-LEMON.jpg" },
  { id: 31, name: "CHERRY WATERMELON", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/nLRJ9vCd/ignite-v400-cherry-watermelon.jpg" },
  { id: 32, name: "GRAPE", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/0QzqYbSv/ignite-v400-GRAPE.jpg" },
  { id: 33, name: "MIAMI MINT", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/gJ1bNmyJ/ignite-v400-miami-mint.jpg" },
  { id: 34, name: "PASSION FRUIT", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/vT9FKkXt/Ignite-v400-PASSION-FRUIT.jpg" },
  { id: 35, name: "STRAWBERRY WATERMELON", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/FFJ41kmG/Ignite-v400-STRAWBERR-WATERMELON.jpg" },
  { id: 36, name: "STRAWBERRY KIWI", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/Hsw19GrJ/ignite-v400-STRAWBERRY-KIWI.jpg" },
  { id: 37, name: "STRAWBERRY", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/cLdyDD35/ignite-v400-strawberry.jpg" },
  { id: 38, name: "TUTTI FRUTI", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/mgVxKQ3v/ignite-v400-TUTI-FRUTI.jpg" },
  { id: 39, name: "BLUE RAZZ ICE", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/yYk7mpF9/Lost-mary-20000-BLUE-RAZZ-ICE.jpg" },
  { id: 40, name: "GRAPE ICE", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/wTZg05VC/Lost-mary-20000-GRAPE-ICE.jpg" },
  { id: 41, name: "ICE MINT", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/wTZg05V5/lost-mary-20000-ICE-MINT.jpg" },
  { id: 42, name: "LIME GRAPE FRUIT", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/7LqcVbpW/Lost-mary-20000-LIME-GRAPE-FRUIT.jpg" },
  { id: 43, name: "MANGO MAGIC", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/8CwYnNGc/Lost-mary-20000-MANGO-TWIST.jpg" },
  { id: 44, name: "MEXICAN MANGO", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/bvL5FpPx/Lost-mary-20000-MEXICAN-MANGO.jpg" },
  { id: 45, name: "MIAMI MINT", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/yWqpSNmv/Lost-mary-20000-MIAMI-MINT.jpg" },
  { id: 46, name: "STRAWBERRY ICE", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/zDLJWPw3/Lost-mary-20000-STRAWBERRY-ICE.jpg" },
  { id: 47, name: "STRAWBERRY KIWI", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/59Hxvk5q/Lost-mary-20000-STRAWBERRY-KIWI.jpg" },
  { id: 18, name: "BLOW THC", price: 55000, category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp" },
  { id: 19, name: "TORCH 7.5G", price: 53000, category: "Vapes THC", tag: "", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png" },
  { id: 29, name: "TORCH 4.5G", price: 52500, category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/vmFK42hC/TORCH-4-5G.jpg" },
  { id: 20, name: "PHENOM 6G", price: 56000, category: "Vapes THC", tag: "Destacado", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg" },
  { id: 27, name: "PLAYSTATION 5", price: 550, category: "PlayStation", tag: "USD", image: "https://i.postimg.cc/RFGS0Wzt/PLAY-5.jpg" },
  { id: 28, name: "AIRPODS PRO", price: 35000, category: "PRODUCTOS APPLE", tag: "Nuevo", image: "https://i.postimg.cc/X7gzDt0p/AIRPODS-PRO.jpg" },
  { id: 21, name: "CARGADOR 20W", price: 16500, category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg" },
  { id: 22, name: "CARGADOR 35W", price: 20500, category: "PRODUCTOS APPLE", tag: "Potente", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg" },
  { id: 23, name: "CABLE USB-C A USB-C", price: 13500, category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg" },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M", price: 13500, category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg" }
];

// --- CONTENIDO DE PÁGINAS LEGALES E INFORMATIVAS (DISEÑO LUXURY) ---
const PAGE_CONTENT = {
  nosotros: {
    title: "Nuestra Esencia",
    subtitle: "Acerca de 028 IMPORT",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base">
        <p className="text-xl font-medium text-black leading-snug">En 028 IMPORT no solo entregamos productos; brindamos una experiencia de exclusividad, confianza y absoluta prioridad al tiempo de nuestros clientes.</p>
        <p>Nacimos con el firme propósito de establecer un nuevo estándar en la importación y distribución de artículos premium. Entendemos que el lujo moderno no se trata únicamente de lo que adquieres, sino de cómo lo adquieres. Por ello, hemos diseñado un ecosistema de atención al cliente meticuloso, donde la amabilidad, la inmediatez y la transparencia son nuestros pilares innegociables.</p>
        <p>Nuestro catálogo es el resultado de una curaduría exhaustiva. Cada marca y cada modelo que ofrecemos ha sido seleccionado bajo los más estrictos controles de calidad e idoneidad, garantizando a nuestros usuarios el acceso a lo mejor del mercado global sin intermediarios innecesarios y con la certeza de un origen 100% legítimo.</p>
        <div className="border-l-4 border-[#d4af37] pl-6 py-2 my-10 bg-gray-50 rounded-r-2xl">
          <p className="italic text-gray-800 text-lg font-medium">"Creemos firmemente que el tiempo de nuestro cliente es su activo más valioso. Por eso, nuestro compromiso es la excelencia y la velocidad en cada entrega."</p>
        </div>
        <p>Agradecemos tu confianza y te damos la bienvenida a la experiencia 028.</p>
      </div>
    )
  },
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
  envios: {
    title: "Envíos y Entregas",
    subtitle: "Logística Premium",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base">
        <p className="text-lg font-medium text-black">Sabemos que la inmediatez es fundamental. Por ello, hemos diseñado un esquema logístico ágil, seguro y adaptado a sus necesidades.</p>
        
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 my-6">
          <h3 className="text-[#d4af37] font-black uppercase tracking-widest text-sm mb-3 flex items-center gap-2"><i className="fas fa-bolt"></i> Envío Flex (En el día)</h3>
          <p className="text-sm">Para zonas seleccionadas de CABA y GBA, ofrecemos un servicio de motomensajería prioritaria. Concretando su pedido antes de nuestro horario de corte, recibirá sus productos en sus manos el mismo día de la compra, con total discreción y cuidado.</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 my-6">
          <h3 className="text-black font-black uppercase tracking-widest text-sm mb-3 flex items-center gap-2"><i className="fas fa-plane"></i> Envíos a Toda Argentina</h3>
          <p className="text-sm">Llegamos a cada rincón del país. Todos nuestros despachos nacionales se realizan a través de empresas de correo de primera línea. Su paquete será embalado con estrictas medidas de protección y contará con un número de seguimiento (Tracking) en tiempo real.</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 my-6">
          <h3 className="text-black font-black uppercase tracking-widest text-sm mb-3 flex items-center gap-2"><i className="fas fa-store"></i> Retiro Pick-Up</h3>
          <p className="text-sm">Si prefiere gestionar el retiro de manera personal o enviar a su propia mensajería de confianza, puede seleccionar esta opción. Una vez preparado el pedido, le informaremos por WhatsApp la dirección exacta (Zona Belgrano) y la franja horaria habilitada.</p>
        </div>
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
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-black"><i className="fas fa-university"></i></div>
            <div>
              <p className="font-bold text-black">Transferencia Bancaria (ARS)</p>
              <p className="text-sm mt-1">Acreditación rápida mediante CBU/CVU o Alias. Ideal para operaciones a distancia.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-black"><i className="fab fa-bitcoin"></i></div>
            <div>
              <p className="font-bold text-black">Criptoactivos (USDT)</p>
              <p className="text-sm mt-1">Aceptamos pagos internacionales o descentralizados a través de redes estables como TRC20, BSC o Binance Pay.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-black"><i className="fas fa-money-bill-wave"></i></div>
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('retiro');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('');
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // ESTADO PARA NAVEGACIÓN ENTRE PÁGINAS ("home" o claves de PAGE_CONTENT)
  const [currentView, setCurrentView] = useState('home');

  const uniqueCategories = useMemo(() => {
    return [...new Set(products.map(p => p.category))];
  }, [products]);

  const slugify = (text) => text.toString().toLowerCase()
    .replace(/\s+/g, '-')          
    .replace(/[^\w\-]+/g, '')       
    .replace(/\-\-+/g, '-')         
    .replace(/^-+/, '')             
    .replace(/-+$/, '');            

  useEffect(() => {
    document.title = CONFIG.brandName;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = CONFIG.logoImage;
  }, []);

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
        if (!snapshot.empty) {
          const dbProducts = snapshot.docs.map(doc => ({ dbId: doc.id, ...doc.data() }));
          
          setProducts(prev => {
             const combined = [...initialProducts];
             dbProducts.forEach(dbItem => {
                const index = combined.findIndex(p => p.id == dbItem.id);
                if (dbItem.isDeleted) {
                    if (index > -1) combined.splice(index, 1);
                } else {
                    if (index > -1) combined[index] = { ...combined[index], ...dbItem };
                    else combined.push(dbItem);
                }
             });
             return combined;
          });
        }
      });

      return () => {
        unsubscribeAuth();
        unsubscribeStock();
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('pageshow', handleFocus);
      };
    }
  }, [firebaseRefs]);

  const formatPrice = (n) => n ? n.toLocaleString('es-AR') : '0';
  const getTotalItems = () => cart.reduce((acc, item) => acc + item.qty, 0);
  
  const getUnitPromoPrice = (item) => {
    if (item.category === 'Elfbar Ice King') {
        const count = getTotalItems();
        if (count >= 2) return 24500;
        return 26000;
    }
    if (item.category === 'Lost Mary 20000') {
        const lmCount = cart.filter(i => i.category === 'Lost Mary 20000').reduce((acc, curr) => acc + curr.qty, 0);
        if (lmCount >= 2) return 20000;
        return 23000;
    }
    return item.price;
  };

  const calculateTotal = () => cart.reduce((acc, item) => acc + (item.qty * getUnitPromoPrice(item)), 0);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // FUNCIÓN PARA NAVEGAR ENTRE PÁGINAS
  const navigateTo = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const addToCart = (product) => {
    if (product.inStock === false) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`✅ Añadido: ${product.name}`);
    if(selectedProduct) setSelectedProduct(null); 
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
    if (deliveryMethod === 'envio' && (!address.trim() || !zone.trim())) {
      alert("Por favor completa los datos de envío.");
      return;
    }
    setIsSending(true);
    const finalTotal = calculateTotal();
    
    let msg = `Hola *${CONFIG.brandName}*, mi pedido:\n`;
    
    cart.forEach(item => {
      const unitPrice = getUnitPromoPrice(item);
      const currency = item.price < 2000 ? "USD" : "$"; 
      
      let displayName = item.name;
      const catUpper = item.category.toUpperCase().trim();
      const categoriesToShow = ['ELFBAR ICE KING', 'IGNITE V400', 'LOST MARY 20000'];
      
      if (categoriesToShow.includes(catUpper)) {
          displayName = `${item.category} - ${item.name}`;
      }

      msg += `- ${item.qty}x ${displayName} (${currency}${formatPrice(unitPrice)} c/u)\n`;
    });
    
    msg += `\n*TOTAL ESTIMADO: ${CONFIG.currencySymbol}${formatPrice(finalTotal)}*\n`;
    msg += deliveryMethod === 'envio' ? `*ENVIO:* ${address}, ${zone}\n` : `*RETIRO EN LOCAL*\n`;

    const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;

    try {
      if (firebaseRefs.db) {
        await addDoc(collection(firebaseRefs.db, 'orders'), {
          userId: user?.uid || "anon",
          items: cart.map(i => {
             let dbName = i.name;
             const cUp = i.category.toUpperCase().trim();
             if(['ELFBAR ICE KING', 'IGNITE V400', 'LOST MARY 20000'].includes(cUp)) {
                dbName = `${i.category} - ${i.name}`;
             }
             return { name: dbName, qty: i.qty, price: getUnitPromoPrice(i) };
          }),
          total: finalTotal,
          delivery: deliveryMethod,
          address: address || '',
          zone: zone || '',
          status: 'pending',
          createdAt: serverTimestamp()
        });
      }
      setTimeout(() => { window.location.href = whatsappUrl; }, 400);
    } catch (e) {
      window.location.href = whatsappUrl;
    }
  };

  const renderProductSection = (category) => {
    const sectionProducts = products.filter(p => {
       const matchCategory = p.category === category;
       const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.category.toLowerCase().includes(searchTerm.toLowerCase());
       return matchCategory && matchSearch;
    });

    if (sectionProducts.length === 0) return null;
    
    let promoText = null;
    if (category === 'Elfbar Ice King') promoText = "2+ un: $24.500 c/u";
    if (category === 'Lost Mary 20000') promoText = "2+ Lost Mary: $20.000 c/u";

    const sectionId = slugify(category);

    return (
      <section key={category} id={sectionId} className="mb-16 scroll-mt-40 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-8 gap-3 border-b-2 border-gray-100 pb-3">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase relative">
            {category}
            <span className="absolute -bottom-[15px] left-0 w-12 h-1 bg-[#d4af37] rounded-full"></span>
          </h2>
          {promoText && (
            <div className="bg-[#d4af37]/10 text-[#b8952a] px-4 py-1.5 text-xs font-black rounded-full uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-tag"></i> {promoText}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {sectionProducts.map((p, index) => {
            const inCart = cart.find(i => i.id === p.id);
            const isOutOfStock = p.inStock === false;
            
            return (
              <div 
                key={p.id} 
                className={`bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col hover:shadow-lg transition-all duration-300 ${isOutOfStock ? 'opacity-70 grayscale' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                
                <div 
                    className="relative aspect-[4/5] overflow-hidden bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedProduct(p)}
                >
                  <img 
                    src={p.image} 
                    alt={p.name} 
                    className="w-full h-full object-cover" 
                  />
                  {isOutOfStock ? (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-tighter">SIN STOCK</span>
                    </div>
                  ) : p.tag && (
                    <span className="absolute top-2 left-2 bg-black text-[#d4af37] text-[8px] font-black px-2 py-1 uppercase rounded-sm">{p.tag}</span>
                  )}
                </div>

                <div className="p-3 md:p-4 flex-grow flex flex-col">
                  <h3 className="font-bold text-[11px] md:text-sm uppercase mb-1 text-gray-800 line-clamp-1">
                    {p.name}
                  </h3>
                  
                  <div className="mt-auto pt-2">
                    <p className="text-[#d4af37] font-black text-base md:text-lg mb-3 tracking-tighter">
                      {CONFIG.currencySymbol}{formatPrice(p.price)}
                    </p>
                    
                    {isOutOfStock ? (
                        <button disabled className="w-full bg-gray-100 text-gray-400 py-3.5 text-[11px] font-black uppercase tracking-wider rounded-xl cursor-not-allowed">
                          Agotado
                        </button>
                    ) : inCart ? (
                      <div className="flex items-center justify-between bg-black text-white h-11 rounded-xl font-bold text-sm px-1 shadow-lg">
                        <button className="w-10 h-full flex items-center justify-center hover:text-[#d4af37] transition-colors" onClick={() => changeQty(p.id, -1)}><i className="fas fa-minus text-xs"></i></button>
                        <span className="font-black text-[#d4af37]">{inCart.qty}</span>
                        <button className="w-10 h-full flex items-center justify-center hover:text-[#d4af37] transition-colors" onClick={() => addToCart(p)}><i className="fas fa-plus text-xs"></i></button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(p)} className="w-full bg-black text-white hover:bg-[#d4af37] hover:text-black hover:shadow-lg hover:shadow-[#d4af37]/30 py-3.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2">
                        <i className="fas fa-shopping-bag"></i> Añadir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  // --- RENDERIZADOR DE PÁGINAS LEGALES (LUXURY STYLE) ---
  const renderLegalPage = () => {
    const pageData = PAGE_CONTENT[currentView];
    if (!pageData) return null;

    return (
      <div className="bg-[#fafafa] min-h-screen py-16 px-4 md:py-24">
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-16 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <button onClick={() => navigateTo('home')} className="mb-10 text-gray-400 hover:text-[#d4af37] transition-colors flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
            <i className="fas fa-arrow-left"></i> Volver a la Tienda
          </button>

          <div className="text-center mb-16">
             <span className="text-[#d4af37] font-black uppercase tracking-[0.3em] text-[10px] md:text-xs mb-4 block">
                {pageData.subtitle}
             </span>
             <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tighter">
                {pageData.title}
             </h1>
             <div className="w-24 h-1 bg-[#d4af37] mx-auto mt-8"></div>
          </div>

          <div className="prose prose-gray max-w-none">
             {pageData.body}
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#fafafa] text-[#1a1a1a] min-h-screen font-sans flex flex-col relative">
      
      {/* 2. TOAST NOTIFICACIÓN */}
      {toastMessage && (
         <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(212,175,55,0.3)] border border-[#d4af37]/30 font-bold text-xs uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300">
            {toastMessage}
         </div>
      )}

      {/* NAVBAR GLASSMORPHISM */}
      <nav className="bg-black/90 backdrop-blur-md py-4 px-6 sticky top-0 z-40 border-b border-white/10 text-white shadow-2xl transition-all">
        <div className="container mx-auto flex justify-between items-center max-w-7xl">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('home')}>
            <img src={CONFIG.logoImage} alt={`${CONFIG.brandName} Logo`} className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
          </div>
          
          <div className="hidden md:flex gap-6 items-center">
             <button onClick={() => navigateTo('home')} className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${currentView === 'home' ? 'text-[#d4af37]' : 'text-gray-300 hover:text-[#d4af37]'}`}>Inicio</button>
             <button onClick={() => navigateTo('nosotros')} className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${currentView === 'nosotros' ? 'text-[#d4af37]' : 'text-gray-300 hover:text-[#d4af37]'}`}>Nuestra Esencia</button>
             <button onClick={() => navigateTo('envios')} className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${currentView === 'envios' ? 'text-[#d4af37]' : 'text-gray-300 hover:text-[#d4af37]'}`}>Logística</button>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-2xl p-2 md:hidden text-white hover:text-[#d4af37] transition-colors">
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>

        {/* MENU MOVIL */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-[80vh] border-b border-[#d4af37]/30 shadow-2xl' : 'max-h-0'}`}>
        <div className="p-6 flex flex-col gap-4 text-center font-black">
          <button onClick={() => navigateTo('home')} className="hover:text-[#d4af37] text-white/80 transition-colors py-3 border-b border-white/5 uppercase tracking-widest text-xs">Catálogo Principal</button>
          <button onClick={() => navigateTo('nosotros')} className="hover:text-[#d4af37] text-white/80 transition-colors py-3 border-b border-white/5 uppercase tracking-widest text-xs">Quiénes Somos</button>
          <button onClick={() => navigateTo('pagos')} className="hover:text-[#d4af37] text-white/80 transition-colors py-3 border-b border-white/5 uppercase tracking-widest text-xs">Medios de Pago</button>
        </div>
      </div>
    </nav>

    {/* RENDERIZADO CONDICIONAL DE VISTAS */}
    {currentView === 'home' ? (
      <>
        {/* HERO SECTION */}
        <header className="relative h-[40vh] md:h-[50vh] flex items-center justify-center bg-black overflow-hidden shadow-2xl animate-in fade-in duration-1000">
          <div className="absolute inset-0 bg-cover bg-center opacity-40 scale-105" style={{backgroundImage: `url(${CONFIG.bannerImage})`}} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/50" />
          
          <div className="relative z-10 text-center px-4 max-w-3xl flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f2e196] to-[#d4af37]">
              028 IMPORT
            </h1>
            <p className="text-white text-xs md:text-sm font-bold tracking-widest uppercase bg-black/40 px-5 py-2 rounded-full backdrop-blur-md border border-[#d4af37]/30 shadow-xl">
              {CONFIG.shippingText}
            </p>
          </div>
        </header>

        {/* BUSCADOR Y SUBNAVEGACION */}
        <div className="sticky top-[72px] md:top-[80px] z-30 bg-[#fafafa]/90 backdrop-blur-xl border-b border-gray-200 shadow-sm transition-all">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-4 items-center justify-between">
              
              <div className="flex gap-3 overflow-x-auto no-scrollbar w-full md:w-auto mask-image-gradient py-1">
                  <span className="text-[10px] font-black uppercase text-gray-400 mr-2 tracking-widest hidden md:flex items-center">Filtrar:</span>
                  {uniqueCategories.map(cat => (
                      <a key={cat} href={`#${slugify(cat)}`} className="whitespace-nowrap bg-white border border-gray-200 text-gray-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-[#d4af37] hover:border-black transition-all shadow-sm flex-shrink-0">
                          {cat}
                      </a>
                  ))}
              </div>

              {/* LÍNEA SEPARADORA (Visible solo en PC/Tablet) */}
              <div className="hidden md:block w-px h-8 bg-gray-300 mx-1 flex-shrink-0"></div>

              <div className="relative w-full md:w-64 flex-shrink-0">
                 <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                 <input 
                    type="text" 
                    placeholder="Buscar producto o sabor..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2.5 rounded-full text-xs font-bold outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all shadow-inner placeholder:text-gray-300"
                 />
                 {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                       <i className="fas fa-times text-xs"></i>
                    </button>
                 )}
              </div>

            </div>
          </div>

          {/* CONTENIDO PRINCIPAL (PRODUCTOS) */}
          <main className="flex-grow px-4 py-8 max-w-7xl mx-auto min-h-[50vh] pb-24">
            {searchTerm && products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
               <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                 <i className="fas fa-ghost text-4xl mb-4 text-gray-300"></i>
                 <h3 className="text-lg font-black uppercase tracking-tighter text-gray-800">No encontramos nada</h3>
                 <p className="text-xs uppercase tracking-widest mt-2">Intenta buscar otro sabor o marca.</p>
               </div>
            )}

            {uniqueCategories.map(cat => renderProductSection(cat))}
          </main>
      </>
    ) : (
      /* RENDERIZADO DE LAS PÁGINAS INTERNAS LUXURY */
      <main className="flex-grow">
         {renderLegalPage()}
      </main>
    )}

      {/* FOOTER PROFESIONAL */}
      <footer className="bg-black text-white pt-16 pb-32 md:pb-16 border-t-4 border-[#d4af37] relative z-40">
        <div className="max-w-7xl mx-auto px-6">

          {/* Links Grid RE-DISEÑADO CON TUS DATOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12 text-xs md:text-sm">
            
            {/* Columna 1: Marca y Descripción */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                 <img src={CONFIG.logoImage} alt="028Import Logo" className="h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
                 <span className="text-xl font-black uppercase tracking-widest text-white">028<span className="text-[#d4af37]">Import</span></span>
              </div>
              <p className="text-gray-400 font-medium leading-relaxed pr-4">
                 Redefinimos la experiencia de compra priorizando tu tiempo y confianza. Brindamos un servicio logístico ágil y seguro, respaldado por una atención personalizada de excelencia. Porque entendemos que en el mundo actual, la eficiencia es el verdadero lujo.
              </p>
            </div>

            {/* Columna 2: Contacto Directo */}
            <div>
              <h4 className="font-black text-[#d4af37] uppercase tracking-widest mb-5">Contacto</h4>
              <ul className="space-y-4 text-gray-400 font-medium">
                 <li className="flex items-center gap-3">
                    <i className="fab fa-whatsapp text-xl text-[#d4af37]"></i>
                    <span className="text-sm font-bold tracking-wider">11 5341 2358</span>
                 </li>
                 <li className="flex items-start gap-3 mt-4">
                    <i className="fas fa-location-dot text-lg text-[#d4af37] mt-0.5"></i>
                    <span>Miñones y Juramento,<br/>Belgrano, CABA.</span>
                 </li>
              </ul>
            </div>

            {/* Columna 3: Información y Legales (AHORA USAN NAVIGATE TO) */}
            <div>
              <h4 className="font-black text-[#d4af37] uppercase tracking-widest mb-5">Información Legal</h4>
              <ul className="space-y-3 text-gray-400 font-medium">
                <li><button onClick={() => navigateTo('nosotros')} className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-angle-right text-[#d4af37] text-[10px]"></i> Sobre Nosotros</button></li>
                <li><button onClick={() => navigateTo('pagos')} className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-angle-right text-[#d4af37] text-[10px]"></i> Medios de Pago</button></li>
                <li><button onClick={() => navigateTo('envios')} className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-angle-right text-[#d4af37] text-[10px]"></i> Logística de Envío</button></li>
                <li><button onClick={() => navigateTo('terminos')} className="hover:text-white transition-colors flex items-center gap-2 mt-4 pt-2 border-t border-white/10"><i className="fas fa-file-contract text-gray-600 text-[10px]"></i> Términos y Condiciones</button></li>
                <li><button onClick={() => navigateTo('privacidad')} className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-shield-alt text-gray-600 text-[10px]"></i> Política de Privacidad</button></li>
              </ul>
            </div>

            {/* Columna 4: Redes Sociales */}
            <div>
              <h4 className="font-black text-[#d4af37] uppercase tracking-widest mb-5">Nuestras Redes</h4>
              <p className="text-gray-400 font-medium mb-4">Seguinos para enterarte de los nuevos ingresos antes que nadie.</p>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/028.import?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#d4af37] hover:text-black transition-colors shadow-lg"><i className="fab fa-instagram text-xl"></i></a>
                <a href="https://www.tiktok.com/@028.import?is_from_webapp=1&sender_device=pc" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#d4af37] hover:text-black transition-colors shadow-lg"><i className="fab fa-tiktok text-xl"></i></a>
                <a href={`https://wa.me/${CONFIG.whatsappNumber}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#25D366] hover:text-white transition-colors shadow-lg"><i className="fab fa-whatsapp text-xl"></i></a>
              </div>
            </div>
            
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/10 pt-8 text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest text-center md:text-left gap-4">
            <p className="flex items-center gap-2 justify-center">
               <i className="fas fa-map-marker-alt"></i> Argentina
            </p>
            <p>© {new Date().getFullYear()} 028IMPORT. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <button onClick={() => navigateTo('arrepentimiento')} className="hover:text-white transition-colors">Botón de Arrepentimiento</button>
            </div>
          </div>

        </div>
      </footer>

      {/* MODAL DETALLE DE PRODUCTO */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedProduct(null)}></div>
           
           <div className="relative bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh]">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-md text-black rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-colors shadow-lg">
                <i className="fas fa-times"></i>
              </button>

              <div className="w-full md:w-1/2 bg-gray-50 p-8 flex items-center justify-center relative min-h-[300px]">
                 {selectedProduct.tag && <span className="absolute top-6 left-6 bg-black text-[#d4af37] text-[10px] font-black px-4 py-2 uppercase tracking-widest rounded-full shadow-lg z-10">{selectedProduct.tag}</span>}
                 <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full max-h-[500px] object-contain drop-shadow-2xl animate-in scale-95 duration-500" />
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center overflow-y-auto">
                 <p className="text-[#d4af37] font-black uppercase tracking-[0.2em] text-[10px] mb-2">{selectedProduct.category}</p>
                 <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-gray-900 leading-none mb-6">{selectedProduct.name}</h2>
                 
                 <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
                   Experimenta la mejor calidad con nuestra selección de productos premium. El sabor y rendimiento que estabas buscando en un formato elegante y exclusivo.
                 </p>

                 <div className="mt-auto border-t border-gray-100 pt-8">
                    <p className="text-[#d4af37] font-black text-4xl tracking-tighter mb-6">
                      {CONFIG.currencySymbol}{formatPrice(selectedProduct.price)}
                    </p>

                    {selectedProduct.inStock === false ? (
                        <button disabled className="w-full bg-gray-200 text-gray-500 py-4 text-xs font-black uppercase tracking-widest rounded-2xl cursor-not-allowed">Producto Agotado</button>
                    ) : (
                        <button onClick={() => addToCart(selectedProduct)} className="w-full bg-black text-white hover:bg-[#d4af37] hover:text-black py-4 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-[#d4af37]/30 transition-all duration-300 flex justify-center items-center gap-3">
                           <i className="fas fa-shopping-cart text-lg"></i> Agregar a mi pedido
                        </button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* CARRITO FLOTANTE */}
      {getTotalItems() > 0 && currentView === 'home' && (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-black/90 backdrop-blur-lg border border-[#d4af37]/30 p-2 pl-6 rounded-full text-white flex justify-between items-center shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-w-md w-full pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-[9px] text-[#d4af37] font-black uppercase tracking-widest">Total Pedido</span>
              <span className="text-xl font-black tracking-tighter leading-none">{CONFIG.currencySymbol}{formatPrice(calculateTotal())}</span>
            </div>
            <button onClick={() => setIsCartOpen(true)} className="bg-[#d4af37] text-black px-6 py-3.5 rounded-full font-black text-[11px] uppercase tracking-wider hover:bg-white hover:scale-105 transition-all shadow-md flex items-center gap-2">
              Ver Bolsa <span className="bg-black text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center">{getTotalItems()}</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL DEL CARRITO */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end items-center sm:justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          
          <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-black">Tu Bolsa</h2>
                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{getTotalItems()} artículos</p>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 bg-gray-100 rounded-full text-gray-500 hover:bg-black hover:text-white transition-colors flex items-center justify-center">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-grow no-scrollbar bg-gray-50/50">
              <div className="space-y-4 mb-8">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center p-1">
                        <img src={item.image} className="w-full h-full object-contain" alt="" />
                      </div>
                      <div className="flex flex-col">
                        <p className="font-bold text-xs uppercase tracking-tight max-w-[150px] sm:max-w-[200px] truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.qty} unidades</p>
                      </div>
                    </div>
                    <p className="font-black text-[#d4af37] text-sm tracking-tighter">
                      {CONFIG.currencySymbol}{formatPrice(item.qty * getUnitPromoPrice(item))}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="font-black text-[11px] mb-4 uppercase tracking-widest text-gray-800 flex items-center gap-2">
                  <i className="fas fa-truck text-[#d4af37]"></i> Entrega
                </p>
                <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-xl">
                  <button onClick={() => setDeliveryMethod('retiro')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${deliveryMethod === 'retiro' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Retiro Local</button>
                  <button onClick={() => setDeliveryMethod('envio')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${deliveryMethod === 'envio' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Envío Domicilio</button>
                </div>
                
                {deliveryMethod === 'envio' && (
                  <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-300">
                    <input type="text" placeholder="Dirección completa" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-black focus:bg-white transition-all placeholder:text-gray-400" />
                    <input type="text" placeholder="Barrio / Localidad" value={zone} onChange={(e) => setZone(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-black focus:bg-white transition-all placeholder:text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100 sticky bottom-0">
               <div className="flex justify-between items-end mb-6">
                 <span className="font-black text-gray-400 text-xs uppercase tracking-widest">Total a Pagar</span>
                 <span className="font-black text-3xl text-black tracking-tighter leading-none">
                    <span className="text-[#d4af37] text-xl mr-1">{CONFIG.currencySymbol}</span>
                    {formatPrice(calculateTotal())}
                 </span>
               </div>
               
               <button 
                  onClick={handleCheckout} 
                  disabled={isSending} 
                  className={`w-full ${isSending ? 'bg-gray-200 text-gray-400 border-none' : 'bg-black text-white hover:bg-[#d4af37] hover:text-black shadow-xl hover:shadow-[#d4af37]/40'} font-black py-4 rounded-2xl uppercase tracking-widest text-xs flex justify-center items-center gap-3 transition-all duration-300`}
                >
                {isSending ? (
                  <><i className="fas fa-circle-notch fa-spin"></i> Procesando...</>
                ) : (
                  <><i className="fab fa-whatsapp text-lg"></i> Confirmar Pedido</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* GLOBO FLOTANTE DE WHATSAPP */}
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

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
}