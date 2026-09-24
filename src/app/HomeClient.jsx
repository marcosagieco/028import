"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { rutaProducto, aSlug } from '@/lib/slug';
import { escalonesDeProducto, precioSegunCantidad } from '@/lib/combos';
import { useCarrito } from '@/components/CarritoProvider';
const CalculadorEnvio = dynamic(() => import('@/components/CalculadorEnvio'), { ssr: false });
const CalculadorEnvioSimple = dynamic(() => import('@/components/CalculadorEnvioSimple'), { ssr: false });
const VapeSpecs3D = dynamic(() => import('@/components/VapeSpecs3D'), { ssr: false });
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, doc, setDoc, getDoc, getDocs, increment, query, orderBy, limit, where } from "firebase/firestore";

// El Pago Seguro es un servicio aparte, no un producto del catálogo: cubre la
// pérdida del pedido en el envío. Va como constante acá, no en Firestore, porque
// no se vende ni se administra como el resto — es una política de la tienda.
const PRECIO_PAGO_SEGURO = 1900;

const CONFIG = {
  brandName: "028", 
  whatsappNumber: "5491153412358", 
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png", 
  bannerImage: "https://i.ibb.co/2Yg9wM6x/image.png", 
  currencySymbol: "$",
  shippingText: "Pedime te llega en 30'⏰",
  paymentAlias: "028import.lm", 
  paymentName: "Lucio Bunge", 
};


const INITIAL_COMMUNITY_VIDEOS = [
  {
    id: 'community_video_1',
    title: 'UNBOXING 028',
    creator: '@hannimohamed',
    type: 'Review',
    description: 'Contenido real de la comunidad 028 para generar confianza antes de comprar.',
    videoUrl: '/community/hanni.mp4',
    productId: 17,
    productsShown: [17, 26, 33],
    ctaText: 'Ver productos del video',
    featured: true,
    order: 1,
    isHidden: false,
    views: 0,
    clicks: 0
  },
  {
    id: 'community_video_2',
    title: 'COLABORACIONES',
    creator: '@martu_lalli',
    type: 'Influencer',
    description: 'Contenido real de nuestra comunidad con productos destacados de la tienda.',
    videoUrl: '/community/martulali.mp4',
    productId: 17,
    productsShown: [17, 25, 39],
    ctaText: 'Ver productos del video',
    featured: false,
    order: 2,
    isHidden: false,
    views: 0,
    clicks: 0
  },
  {
    id: 'community_video_3',
    title: 'COLABORACIONES',
    creator: '@alessitalalli',
    type: 'Referencia',
    description: 'Más referencias reales para mostrar productos vistos en el video y generar confianza.',
    videoUrl: '/community/alelali.mp4',
    productId: 33,
    productsShown: [33, 31, 45],
    ctaText: 'Ver productos del video',
    featured: false,
    order: 3,
    isHidden: false,
    views: 0,
    clicks: 0
  },
  {
    id: 'community_video_4',
    title: 'COLABORACIONES',
    creator: '@giuli.bellicoso',
    type: 'Influencer',
    description: 'Nuevo contenido real para sumar prueba social y mostrar productos destacados.',
    videoUrl: '/community/giulianny.mp4',
    productId: 17,
    productsShown: [17, 26, 33],
    ctaText: 'Ver productos del video',
    featured: false,
    order: 4,
    isHidden: false,
    views: 0,
    clicks: 0
  }
];

// Pósters de los videos de Community. Los que están en Firebase Storage no traen
// thumbnail propio, así que se sirven desde /public/community: así la portada se ve
// sin tener que descargar el video entero.
const COMMUNITY_POSTERS = {
  hanni:     '/community/hanni.webp',
  martulali: '/community/martulali.webp',
  alelali:   '/community/alelali.webp',
  giulianny: '/community/giulianny.webp',
};

const buildDefaultHomeLayout = (sections = []) => {
  const orderedSections = [...sections].sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
  if (!orderedSections.length) {
    return [{ id: 'community', label: '028 Community', order: 1, active: true, type: 'community' }];
  }
  const [firstSection, ...restSections] = orderedSections;
  return [
    { id: firstSection.id, label: firstSection.title || 'Vidriera', order: 1, active: true, type: 'section' },
    { id: 'community', label: '028 Community', order: 2, active: true, type: 'community' },
    ...restSections.map((section, index) => ({ id: section.id, label: section.title || 'Vidriera', order: index + 3, active: true, type: 'section' })),
  ];
};

const AVAILABLE_ICONS = [
  { id: 'fa-star', prefix: 'fas', color: 'text-[#fcdb00]' },     
  { id: 'fa-fire', prefix: 'fas', color: 'text-red-500' },       
  { id: 'fa-bolt', prefix: 'fas', color: 'text-yellow-400' },    
  { id: 'fa-crown', prefix: 'fas', color: 'text-amber-500' },    
  { id: 'fa-gem', prefix: 'fas', color: 'text-purple-500' },     
  { id: 'fa-heart', prefix: 'fas', color: 'text-pink-500' },     
  { id: 'fa-tag', prefix: 'fas', color: 'text-green-500' },      
  { id: 'fa-gift', prefix: 'fas', color: 'text-blue-500' },      
  { id: 'fa-rocket', prefix: 'fas', color: 'text-orange-500' },  
  { id: 'fa-award', prefix: 'fas', color: 'text-indigo-500' },
  { id: 'fa-apple', prefix: 'fab', color: 'text-gray-800' },
  { id: 'fa-snowflake', prefix: 'fas', color: 'text-[#8fd3ff]' }
];

const FLAVOR_OPTIONS = ['FRUTAL', 'MENTA', 'FRESCO', 'DULCE', 'ÁCIDO', 'TROPICAL', 'CÍTRICO', 'CAFÉ'];

const DEPT_ICONS = [
  { id: 'fa-box', prefix: 'fas' }, { id: 'fa-wind', prefix: 'fas' }, { id: 'fa-leaf', prefix: 'fas' }, { id: 'fa-microchip', prefix: 'fas' }, { id: 'fa-star', prefix: 'fas' }, { id: 'fa-fire', prefix: 'fas' }, { id: 'fa-apple', prefix: 'fab' }, { id: 'fa-mobile-alt', prefix: 'fas' }, { id: 'fa-laptop', prefix: 'fas' }, { id: 'fa-gamepad', prefix: 'fas' }, { id: 'fa-headphones', prefix: 'fas' }, { id: 'fa-gem', prefix: 'fas' }, { id: 'fa-tag', prefix: 'fas' }, { id: 'fa-cannabis', prefix: 'fas' }, { id: 'fa-smoking', prefix: 'fas' }
];


const initialProducts = [
  { id: 1, name: "BAJA SPLASH", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png", description: "Vapeador desechable premium con una mezcla tropical y refrescante.", cardSize: "normal" },
  { id: 2, name: "BLUE RAZZ ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/s2Tmw67w/BLUE-RAZZ-ICE.webp", description: "El clásico e intenso sabor a frambuesa azul combinado con un golpe helado perfecto.", cardSize: "normal" },
  { id: 3, name: "CHERRY FUSE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/yd5PzDfx/CHERRY-FUSE.png", description: "Fusión explosiva de cerezas dulces y jugosas.", cardSize: "normal" },
  { id: 4, name: "CHERRY STRAZZ", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "Destacado", image: "https://i.postimg.cc/7PFVsTG2/CHERRY-STRAZZ.jpg", description: "Una deliciosa combinación de cereza y fresa con sutiles notas cítricas.", cardSize: "medium" },
  { id: 5, name: "DOUBLE APPLE ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/QN9mJqtk/DOUBLE-APPLE-ICE.webp", description: "Intenso sabor a doble manzana, dulce y ácida.", cardSize: "normal" },
  { id: 6, name: "DRAGON STRAWNANA", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/9X6p8qRB/DRAGON-STRAWNANA.png", description: "Exótico mix de pitahaya, fresa y plátano.", cardSize: "normal" },
  { id: 7, name: "GRAPE ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/hPV0HPTw/GRAPE-ICE.webp", description: "Auténtico sabor a uva dulce.", cardSize: "normal" },
  { id: 8, name: "MANGO MAGIC", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "Best Seller", image: "https://i.postimg.cc/tCFzLCFC/MANGO-MAGIC.png", description: "La magia del mango maduro y jugoso.", cardSize: "normal" },
  { id: 9, name: "PEACH", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/4xZ1Zk1f/PEACH.webp", description: "Puro sabor a durazno aterciopelado y dulce.", cardSize: "normal" },
  { id: 10, name: "SCARY BERRY", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/K8F5FS5D/SCARY-BERRY.png", description: "Misteriosa y atrapante mezcla de bayas silvestres oscuras.", cardSize: "normal" },
  { id: 11, name: "SOUR LUSH GUMMY", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/P54Q536R/SOUR-LUSH-GUMMY.png", description: "El divertido sabor de las gomitas dulces con un toque ácido.", cardSize: "normal" },
  { id: 12, name: "STRAWBERRY DRAGON FRUIT", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/QMdk9QwW/STRAWBERRY-DRAGON-FRUIT.png", description: "Combinación vibrante de fresas maduras y exótica fruta del dragón.", cardSize: "normal" },
  { id: 13, name: "STRAWBERRY ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/7Lt1gCrC/STRAWBERRY-ICE.png", description: "Fresas recién recolectadas bañadas en una brisa helada.", cardSize: "normal" },
  { id: 14, name: "STRAWBERRY WATERMELON", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/MG30ycJD/STRAWBERRY-WATERMELON.webp", description: "La clásica e infalible mezcla de fresa y sandía.", cardSize: "normal" },
  { id: 15, name: "SUMMER SPLASH", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/LXqtvHmV/SUMMER-SPLASH.png", description: "Un cóctel frutal que captura la esencia del verano en cada calada.", cardSize: "normal" },
  { id: 16, name: "TIGERS BLOOD", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/3RyX9K3P/TIGERS-BLOOD.jpg", description: "Famosa mezcla de sandía y fresa con un exótico y suave toque de coco.", cardSize: "normal" },
  { id: 17, name: "WATERMELON ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "Refrescante", image: "https://i.postimg.cc/63DdmD3s/WATERMELON-ICE.webp", description: "Todo el jugo y la dulzura de la sandía con un impacto extra helado.", cardSize: "normal" },
  { id: 25, name: "SOUR APPLE ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/X7QqQDGS/SOUR-APPLE-ICE.jpg", description: "Manzana verde crujiente y ácida envuelta en una ráfaga de frío.", cardSize: "normal" },
  { id: 26, name: "MIAMI MINT", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/bJhqzQDS/MIAMI-MINT.jpg", description: "Menta sofisticada estilo Miami: fresca, dulce pero con presencia.", cardSize: "normal" },
  { id: 30, name: "BLUE RAZZ LEMON", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/Jh48hT4x/ignite-v400-BLUE-RAZZ-LEMON.jpg", description: "Dispositivo ultracompacto y premium de Ignite.", cardSize: "normal" },
  { id: 31, name: "CHERRY WATERMELON", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/nLRJ9vCd/ignite-v400-cherry-watermelon.jpg", description: "Diseño elegante característico de Ignite.", cardSize: "normal" },
  { id: 32, name: "GRAPE", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/0QzqYbSv/ignite-v400-GRAPE.jpg", description: "Sabor a uva puro y directo.", cardSize: "normal" },
  { id: 33, name: "MIAMI MINT", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/gJ1bNmyJ/ignite-v400-miami-mint.jpg", description: "Menta premium y refrescante en el formato más cómodo.", cardSize: "normal" },
  { id: 34, name: "PASSION FRUIT", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/vT9FKkXt/Ignite-v400-PASSION-FRUIT.jpg", description: "El toque ácido y exótico del maracuyá en cada calada.", cardSize: "normal" },
  { id: 35, name: "STRAWBERRY WATERMELON", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/FFJ41kmG/Ignite-v400-STRAWBERR-WATERMELON.jpg", description: "Dulce, frutal y perfectamente balanceado.", cardSize: "normal" },
  { id: 36, name: "STRAWBERRY KIWI", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/Hsw19GrJ/ignite-v400-STRAWBERRY-KIWI.jpg", description: "Fresa dulce combinada con el toque tropical del kiwi.", cardSize: "normal" },
  { id: 37, name: "STRAWBERRY", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/cLdyDD35/ignite-v400-strawberry.jpg", description: "Auténtico sabor a fresa de principio a fin.", cardSize: "normal" },
  { id: 38, name: "TUTTI FRUTI", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/mgVxKQ3v/ignite-v400-TUTI-FRUTI.jpg", description: "Explosión de golosinas frutales en un vaporizador compacto.", cardSize: "normal" },
  { id: 39, name: "BLUE RAZZ ICE", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/yYk7mpF9/Lost-mary-20000-BLUE-RAZZ-ICE.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 40, name: "GRAPE ICE", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/wTZg05VC/Lost-mary-20000-GRAPE-ICE.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 41, name: "ICE MINT", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/wTZg05V5/lost-mary-20000-ICE-MINT.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 42, name: "LIME GRAPE FRUIT", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/7LqcVbpW/Lost-mary-20000-LIME-GRAPE-FRUIT.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 43, name: "MANGO TWIST", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/8CwYnNGc/Lost-mary-20000-MANGO-TWIST.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 44, name: "MEXICAN MANGO", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/bvL5FpPx/Lost-mary-20000-MEXICAN-MANGO.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 45, name: "MIAMI MINT", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/yWqpSNmv/Lost-mary-20000-MIAMI-MINT.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 46, name: "STRAWBERRY ICE", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/zDLJWPw3/Lost-mary-20000-STRAWBERRY-ICE.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 47, name: "STRAWBERRY KIWI", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/59Hxvk5q/Lost-mary-20000-STRAWBERRY-KIWI.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 18, name: "BLOW THC", price: 55000, department: "THC", category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp", description: "Dispositivo de alta pureza con extracciones premium.", cardSize: "medium" },
  { id: 19, name: "TORCH 7.5G", price: 53000, department: "THC", category: "Vapes THC", tag: "", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png", description: "Capacidad extrema de 7.5G de extracto premium.", cardSize: "normal" },
  { id: 29, name: "TORCH 4.5G", price: 52500, department: "THC", category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/vmFK42hC/TORCH-4-5G.jpg", description: "4.5G de puro rendimiento.", cardSize: "normal" },
  { id: 20, name: "PHENOM 6G", price: 56000, department: "THC", category: "Vapes THC", tag: "Destacado", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg", description: "Dispositivo de grado premium cargado con 6G.", cardSize: "large" },
  { id: 27, name: "PLAYSTATION 5", price: 550, department: "TECNOLOGÍA", category: "PlayStation", tag: "USD", image: "https://i.postimg.cc/RFGS0Wzt/PLAY-5.jpg", description: "PlayStation 5 original en caja sellada.", cardSize: "large" },
  { id: 28, name: "AIRPODS PRO", price: 35000, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "Nuevo", image: "https://i.postimg.cc/X7gzDt0p/AIRPODS-PRO.jpg", description: "Auriculares inalámbricos originales con cancelación activa.", cardSize: "normal" },
  { id: 21, name: "CARGADOR 20W", price: 16500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg", description: "Adaptador de corriente USB-C de 20W original Apple.", cardSize: "normal" },
  { id: 22, name: "CARGADOR 35W", price: 20500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "Potente", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg", description: "Adaptador de corriente dual USB-C de 35W original Apple.", cardSize: "normal" },
  { id: 23, name: "CABLE USB-C A USB-C", price: 13500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg", description: "Cable original Apple de USB-C a USB-C.", cardSize: "normal" },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M", price: 13500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg", description: "Cable original Apple USB-C a Lightning de 2 metros.", cardSize: "normal" }
];


function HorizontalScroll({ children, className }) {
  const ref = React.useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  return (
    <div className="relative group/hscroll">
      <button
        onClick={() => scroll(-1)}
        aria-label="Ver anteriores"
        className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 items-center justify-center rounded-full bg-gray-100 border border-gray-200 text-[#111111] hover:bg-[#fcdb00] hover:text-[#111111] hover:border-[#fcdb00] transition-all opacity-0 group-hover/hscroll:opacity-100 backdrop-blur-xl shadow-lg"
      ><i className="fas fa-chevron-left text-xs" /></button>
      <div ref={ref} className={className}>{children}</div>
      <button
        onClick={() => scroll(1)}
        aria-label="Ver siguientes"
        className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 items-center justify-center rounded-full bg-gray-100 border border-gray-200 text-[#111111] hover:bg-[#fcdb00] hover:text-[#111111] hover:border-[#fcdb00] transition-all opacity-0 group-hover/hscroll:opacity-100 backdrop-blur-xl shadow-lg"
      ><i className="fas fa-chevron-right text-xs" /></button>
    </div>
  );
}

// Se monta solo cuando la seccion esta por entrar en pantalla: quien no scrollea
// hasta aca no descarga ni el modelo ni la libreria 3D (que pesa ~1 MB).
// Decide si este equipo puede con el 3D. Cargar el modelo y arrancar la librería
// traba la pantalla unos segundos, y en un equipo flojo esa traba es larga: no vale
// la pena arriesgar la venta por un adorno. Se pide poca cosa (memoria, núcleos,
// pantalla táctil chica) y ante la duda NO se carga.
function equipoAguantaEl3D() {
  if (typeof window === 'undefined') return false;

  // Quien pidió menos animaciones, no quiere esto.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  // Pantalla chica o control táctil: casi siempre un celular.
  const esTactil = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (esTactil || window.innerWidth < 1024) return false;

  // Equipos de pocos recursos.
  const nucleos = navigator.hardwareConcurrency || 0;
  const memoria = navigator.deviceMemory || 0;
  if (nucleos && nucleos < 4) return false;
  if (memoria && memoria < 4) return false;

  // Sin WebGL no hay nada que hacer.
  try {
    const c = document.createElement('canvas');
    if (!(c.getContext('webgl2') || c.getContext('webgl'))) return false;
  } catch { return false; }

  return true;
}

function LazyVapeSpecs3D() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!equipoAguantaEl3D()) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { rootMargin: '300px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref}>
      {inView && <VapeSpecs3D />}
    </div>
  );
}

const formatPrice = (n) => n ? n.toLocaleString('es-AR') : '0';

// La tarjeta de producto, aparte y memorizada. Antes era una función suelta dentro
// de HomeClient, así que cualquiera de los ~90 estados del componente la volvía a
// dibujar: abrir el carrito redibujaba las 42 tarjetas del catálogo.
//
// Para que React.memo sirva de algo, las props tienen que ser estables entre
// renders. Por eso no recibe ni el carrito ni la lista de promos completos —que se
// recrean seguido— sino solo lo que le toca a ESTE producto: cuántas unidades hay
// en el carrito (un número) y su promo (si tiene). Las funciones que recibe están
// envueltas en useCallback del lado del padre.
const TarjetaProducto = React.memo(function TarjetaProducto({
  p, index, isVidriera = false, layout = 'horizontal',
  radioVidriera, cantidadEnCarrito, promo,
  onAgregar, onCambiarCantidad,
}) {
        const inCart = cantidadEnCarrito > 0;
    const isOutOfStock = p.inStock === false;
    const effectiveSize = isVidriera ? (p.cardSize || 'normal') : 'normal';

    let cardStyle = {}; 
    let sizeClasses = ''; 
    let aspectClass = 'aspect-square';
    let titleClass = 'text-[13px] md:text-[16px] leading-tight';
    let priceClass = 'text-xl md:text-2xl';

    if (layout === 'vertical') {
        if (effectiveSize === 'normal') {
            sizeClasses = 'w-[calc(50%-6px)] md:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)] flex-shrink-0';
        } else if (effectiveSize === 'medium') {
            sizeClasses = 'w-full md:w-[calc(66.666%-14px)] lg:w-[calc(50%-10px)] flex-shrink-0';
            titleClass = 'text-[15px] md:text-lg leading-tight';
            priceClass = 'text-2xl md:text-3xl';
        } else if (effectiveSize === 'large') {
            sizeClasses = 'w-full flex-shrink-0';
            aspectClass = 'aspect-[16/9] md:aspect-[21/9]';
            titleClass = 'text-xl md:text-3xl leading-tight';
            priceClass = 'text-3xl md:text-4xl';
        }
    } else {
        if (effectiveSize === 'normal') {
            sizeClasses = 'w-[180px] md:w-[225px] lg:w-[290px] flex-shrink-0';
        } else if (effectiveSize === 'medium') {
            sizeClasses = 'w-[230px] md:w-[280px] flex-shrink-0';
            titleClass = 'text-[15px] md:text-lg leading-tight';
            priceClass = 'text-2xl md:text-3xl';
        } else if (effectiveSize === 'large') {
            sizeClasses = 'w-[320px] md:w-[480px] flex-shrink-0';
            aspectClass = 'aspect-[16/9]';
            titleClass = 'text-xl md:text-3xl leading-tight';
            priceClass = 'text-3xl md:text-4xl';
        }
    }

    return (
      <div 
        key={p.id} 
        style={{ transitionDelay: `${(index % 4) * 75}ms`, ...cardStyle }} 
        className={`card-shimmer reveal-on-scroll relative bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col hover:-translate-y-2 hover:shadow-[0_24px_48px_rgb(0,0,0,0.12)] hover:border-gray-300 ${isVidriera && layout !== 'vertical' ? 'snap-center md:snap-start' : 'snap-start'} group transition-all duration-500 ${isVidriera && radioVidriera === 'squared' ? 'rounded-none' : 'rounded-[1.5rem]'} ${isOutOfStock ? 'opacity-50 grayscale' : ''} ${sizeClasses}`}
      >
        {/* La foto lleva a la pagina del producto. Es un enlace de verdad, asi que
            se puede abrir en otra pestana y Google lo sigue. No se precarga sola
            para no descargar 40 paginas al entrar: Next la precarga al pasar el mouse. */}
        <Link
            href={rutaProducto(p)}
            prefetch={false}
            aria-label={`Ver ${p.name}`}
            className={`relative block ${aspectClass} bg-gray-50 cursor-pointer`}
        >
          <Image
            src={p.image}
            alt={p.name}
            fill
            sizes="(max-width: 768px) 45vw, 300px"
            className={`object-cover mix-blend-normal group-hover:scale-105 transition-transform duration-700 ease-out ${isVidriera && radioVidriera === 'squared' ? '' : 'rounded-t-[1.4rem]'}`}
          />
          {isOutOfStock ? ( 
              <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm flex items-center justify-center">
                  <span className="bg-red-600 text-white font-bebas text-sm px-4 py-1.5 rounded-sm uppercase tracking-wider shadow-lg">SIN STOCK</span>
              </div> 
          ) : p.tag && (
              <span className="absolute top-3 left-3 bg-[#111111] text-[#fcdb00] font-bebas text-[11px] px-3 py-1 uppercase rounded-sm shadow-md tracking-wider">
                  {p.tag}
              </span>
          )}
        </Link>

        <div className="p-4 flex-grow flex flex-col">
            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-poppins">
                {p.category}
            </p>
            <h3 className={`font-bebas ${titleClass} uppercase mb-1 text-[#111111] line-clamp-2 tracking-wide`}>
                <Link href={rutaProducto(p)} prefetch={false} className="hover:underline decoration-2 underline-offset-2">
                    {p.name}
                </Link>
            </h3>
            {(() => {
                const productPromo = promo;
                if (!productPromo) return null;
                return (
                    <p className="inline-flex items-center gap-1 w-fit bg-[#fcdb00]/20 text-[#8a6d00] text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full mb-2">
                        <i className="fas fa-tag text-[8px]"></i> {productPromo.minQty}+ un: {CONFIG.currencySymbol}{formatPrice(productPromo.totalPrice / productPromo.minQty)} c/u
                    </p>
                );
            })()}

            <div className="mt-auto pt-3">
                {p.offerPrice > 0 && p.offerPrice < p.price ? (
                    <div className="mb-4">
                        <p className="text-gray-400 font-bebas text-sm line-through leading-none">
                            {CONFIG.currencySymbol}{formatPrice(p.price)}
                        </p>
                        <p className={`text-[#111111] font-bebas ${priceClass} tracking-wide leading-tight`}>
                            {CONFIG.currencySymbol}{formatPrice(p.offerPrice)}{p.isUSD && <span className="text-gray-500 text-[11px] font-poppins font-bold ml-1">USD</span>}
                        </p>
                    </div>
                ) : (
                    <p className={`text-[#111111] font-bebas ${priceClass} mb-4 tracking-wide`}>
                        {CONFIG.currencySymbol}{formatPrice(p.price)}{p.isUSD && <span className="text-gray-500 text-[11px] font-poppins font-bold ml-1">USD</span>}
                    </p>
                )}
                
                {isOutOfStock ? (
                    <button disabled className="w-full bg-gray-100 text-gray-500 py-3 font-bebas text-[14px] uppercase tracking-wider rounded-xl cursor-not-allowed">
                        Agotado
                    </button>
                ) : inCart ? (
                    <div className="flex items-center justify-between bg-[#fcdb00] text-[#111111] h-11 rounded-xl font-bold px-1.5 shadow-md">
                        <button className="w-12 h-full flex items-center justify-center hover:text-black transition-colors" onClick={() => onCambiarCantidad(p.id, -1)}>
                            <i className="fas fa-minus text-xs"></i>
                        </button>
                        <span className="font-bebas text-lg pt-1">{cantidadEnCarrito}</span>
                        <button className="w-12 h-full flex items-center justify-center hover:text-black transition-colors" onClick={() => onAgregar(p)}>
                            <i className="fas fa-plus text-xs"></i>
                        </button>
                    </div>
                ) : ( 
                    <button 
                        onClick={(e) => onAgregar(p, e)} 
                        className="w-full bg-[#111111] text-white hover:bg-[#fcdb00] hover:text-[#111111] py-3 font-bebas text-[16px] uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <i className="fas fa-shopping-bag text-xs mb-0.5"></i> comprar ahora
                    </button> 
                )}
            </div>
        </div>
      </div>
    );
});

// La tienda entera —barra de arriba, menú, carrito, login, pie— vive acá. Antes esto
// era sólo la home; ahora es el armazón que usan todas las páginas, para que la barra
// sea la misma en todos lados y el carrito se abra donde estés, sin saltar al inicio.
//
// "modo" dice qué va debajo de la barra:
//   'inicio'    -> la portada (con el marquee, que es sólo de acá) y el catálogo
//   'catalogo'  -> sólo el catálogo completo con sus filtros
//   'contenido' -> lo que le pasen: una ficha de producto, un departamento, una marca
//   'checkout'  -> la pantalla de datos para terminar la compra
// "institucional" es para las seis páginas de puro texto (Nosotros, Envíos, etc).
// No compran nada ni muestran productos: sólo necesitan la barra de arriba (que ya
// se arma con lo que llega del servidor) y el carrito (que es local, no depende de
// esto). Con esto en true, la página no abre una sesión de Firebase ni se conecta
// en vivo a la base para traer el catálogo completo — algo que antes hacía sin
// necesitarlo, sólo por compartir el mismo componente que el resto de la tienda.
export default function HomeClient({ ssrProducts = [], ssrHomeSections = [], ssrHomeLayout = [], modo = 'inicio', children = null, institucional = false }) {
  // El carrito ya no vive acá: lo maneja <CarritoProvider> desde el layout, así
  // sobrevive cuando el visitante pasa a la página de un producto.
  const { cart, setCart, sincronizarConCatalogo } = useCarrito();

  const [products, setProducts] = useState(ssrProducts.filter(p => !p.isHidden));

  // La puesta al día de precios la hace el proveedor; acá sólo se le avisa cuándo
  // llegó el catálogo.
  useEffect(() => { sincronizarConCatalogo(products); }, [products, sincronizarConCatalogo]);
  const [allProducts, setAllProducts] = useState(ssrProducts);
  const [promos, setPromos] = useState([]);
  const [homeSections, setHomeSections] = useState(ssrHomeSections);
  const [homeLayout, setHomeLayout] = useState(ssrHomeLayout);
  const [communityVideos, setCommunityVideos] = useState(INITIAL_COMMUNITY_VIDEOS);
  // Opiniones libres del inicio: cualquiera puede dejar la suya, pero no se ven
  // hasta que el admin las aprueba desde el panel (evita spam y comentarios feos
  // colgados en la home sin que nadie los revise).
  const [opinionesHome, setOpinionesHome] = useState([]);
  const [opinionNombre, setOpinionNombre] = useState('');
  const [opinionTexto, setOpinionTexto] = useState('');
  const [opinionRating, setOpinionRating] = useState(0);
  const [opinionEnviando, setOpinionEnviando] = useState(false);
  const [opinionEnviada, setOpinionEnviada] = useState(false);
  const [opinionError, setOpinionError] = useState('');
  const [activeCommunityVideoId, setActiveCommunityVideoId] = useState(null);
  const [flippedCommunityCards, setFlippedCommunityCards] = useState({});
  const [communityVideoFeedback, setCommunityVideoFeedback] = useState({});
  const [communityVideoLoaded, setCommunityVideoLoaded] = useState({});
  const [communityVideoBuffering, setCommunityVideoBuffering] = useState({});
  const [communityVideoPlaying, setCommunityVideoPlaying] = useState({});
  const communityVideoRefs = useRef({});
  const communityScrollRef = useRef(null);
  const [hoveredCommunityCard, setHoveredCommunityCard] = useState(null);
  const [communityProductsPanel, setCommunityProductsPanel] = useState(null);
  const [activeStoryVideo, setActiveStoryVideo] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const googleSigningIn = useRef(false);
  const headerRef = useRef(null);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [currentView, setCurrentView] = useState(modo === 'catalogo' ? 'catalog' : 'home');
  const [activeFilter, setActiveFilter] = useState({ dept: 'all', cat: 'all' });
  const [activeFlavors, setActiveFlavors] = useState([]);
  const [showFlavorMenu, setShowFlavorMenu] = useState(false);
  const flavorMenuRef = useRef(null);
  const [expandedDept, setExpandedDept] = useState(null);
  const [hoveredNavDept, setHoveredNavDept] = useState(null);
  const [vidreiraCardRadius, setVidreiraCardRadius] = useState('rounded');
  const [vidreiraShowIcons, setVidreiraShowIcons] = useState(true);
  // Arranca en null ("todavía no sé"), no en "banner". La posición de verdad se
  // guarda en Firestore y tarda un instante en llegar; si el valor inicial fuera
  // "banner" el vape 3D se dibujaba arriba de todo apenas se abría la página y
  // después saltaba a su lugar real cuando llegaba el dato — el salto que se veía.
  // Con null no se dibuja en ningún lado hasta saber dónde va: aparece una sola vez,
  // ya en su posición correcta.
  const [vape3dPosition, setVape3dPosition] = useState(null);
  const [logosBarPosition, setLogosBarPosition] = useState(null);
  const [showAyudaMenu, setShowAyudaMenu] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false);
  // En /checkout se entra directo a la pantalla de datos, sin pasar por el cajón.
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(modo === 'checkout');
  const [showDiscountBreakdown, setShowDiscountBreakdown] = useState(false);
  // Pago Seguro: cubre el pedido si se pierde en el envío. Es una decisión de cada
  // compra, así que arranca apagado en cada visita al checkout, igual que el medio
  // de pago o el tipo de envío.
  const [pagoSeguroActivo, setPagoSeguroActivo] = useState(false);
  const [showPagoSeguroInfo, setShowPagoSeguroInfo] = useState(false);
  const [showConfirmarSinPagoSeguro, setShowConfirmarSinPagoSeguro] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const openCart = () => {
    setIsCartOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setIsCartVisible(true)));
  };
  const closeCart = (cb) => {
    setIsCartVisible(false);
    setTimeout(() => { setIsCartOpen(false); if (cb) cb(); }, 300);
  };

  // Bloquea el scroll de fondo (Inicio) mientras el carrito o el checkout están abiertos,
  // para que en celu no se sienta que "atrás" se mueve al deslizar dentro de estas pantallas.
  useEffect(() => {
    if (!isCartOpen && !isCheckoutOpen) return;
    const scrollY = window.scrollY;
    const { body } = document;
    const prev = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width, overflow: body.style.overflow };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [isCartOpen, isCheckoutOpen]);
  const [upsellIndex, setUpsellIndex] = useState(0);
  const [prevUpsellIndex, setPrevUpsellIndex] = useState(null);
  const deliveryMethod = 'envio';
  const [shippingType, setShippingType] = useState('flash'); 
  useEffect(() => {
    const hideInlineVideoControls = () => {
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
      if (!fullscreenElement) {
        Object.values(communityVideoRefs.current || {}).forEach((videoEl) => {
          if (videoEl) videoEl.controls = false;
        });
      }
    };

    document.addEventListener('fullscreenchange', hideInlineVideoControls);
    document.addEventListener('webkitfullscreenchange', hideInlineVideoControls);

    return () => {
      document.removeEventListener('fullscreenchange', hideInlineVideoControls);
      document.removeEventListener('webkitfullscreenchange', hideInlineVideoControls);
    };
  }, []);

  // Antes acá había un IntersectionObserver que llamaba a load() sobre el primer
  // video apenas la sección entraba en pantalla. Eso pasaba por encima del
  // preload="none" y descargaba el video entero (5,6 MB) sin que nadie lo pidiera,
  // sólo por scrollear. El video se carga ahora cuando el visitante toca play.

  const [paymentMethod, setPaymentMethod] = useState('transferencia'); 
  const [shippingCost, setShippingCost] = useState(0); 
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('');
  const [aptDetails, setAptDetails] = useState(''); 
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShippingCalculatorModal, setShowShippingCalculatorModal] = useState(false);
  
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('13:00');

  const [deptIcons, setDeptIcons] = useState({});
  const [virtualDepts, setVirtualDepts] = useState([]);
  const [categoryPuffs, setCategoryPuffs] = useState({});
  // Cotización del dólar para ordenar por precio los productos marcados como USD.
  // Se edita desde el panel (pestaña Descuentos); el 1450 es solo el valor de arranque.
  const [usdToArs, setUsdToArs] = useState(1450);
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [fomoData, setFomoData] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const router = useRouter();

  const [upsellsList, setUpsellsList] = useState([]);
  const [carritoDestacados, setCarritoDestacados] = useState([]);

  const communityViewedRef = useRef(new Set());

  const [sortBy, setSortBy] = useState('relevante');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [filterBrands, setFilterBrands] = useState([]);
  const [filterDepts, setFilterDepts] = useState([]);
  const [filterPuffs, setFilterPuffs] = useState([]);
  const [priceRange, setPriceRange] = useState(null);
  const [expandedFilterSection, setExpandedFilterSection] = useState(null);
  const [pendingFlavors, setPendingFlavors] = useState([]);
  const [pendingBrands, setPendingBrands] = useState([]);
  const [pendingDepts, setPendingDepts] = useState([]);
  const [pendingPuffs, setPendingPuffs] = useState([]);
  const [pendingPriceRange, setPendingPriceRange] = useState([0, 100000]);
  const sortDropdownRef = useRef(null);

  const next7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });
      const formatted = dateString.charAt(0).toUpperCase() + dateString.slice(1);
      days.push({
         value: date.toISOString().split('T')[0],
         label: i === 0 ? `Hoy (${formatted})` : i === 1 ? `Mañana (${formatted})` : formatted
      });
    }
    return days;
  }, []);

  useEffect(() => {
    if (next7Days.length > 0 && !deliveryDate) {
        setDeliveryDate(next7Days[0].value);
    }
  }, [next7Days, deliveryDate]);

  // Un producto puede tener, además de su Depto/Marca principal, otros "listados extra"
  // (product.extraListings = [{ department, category }]) para aparecer también en otros lados
  // sin dejar de pertenecer a su Depto/Marca de siempre.
  const getExtraListings = (p) => Array.isArray(p.extraListings) ? p.extraListings.filter(e => e && e.department && e.category) : [];
  const getProductDeptList = (p) => [...new Set([p.department, ...getExtraListings(p).map(e => e.department)].filter(Boolean))];
  const getProductCatList = (p) => [...new Set([p.category, ...getExtraListings(p).map(e => e.category)].filter(Boolean))];
  const getProductPairs = (p) => {
    const pairs = [];
    if (p.department && p.category) pairs.push({ department: p.department, category: p.category });
    getExtraListings(p).forEach(e => pairs.push({ department: e.department, category: e.category }));
    return pairs;
  };

  const departments = useMemo(() => [...new Set(products.flatMap(p => getProductDeptList(p)))], [products]);
  const brandsByDept = useMemo(() => { const map = {}; departments.forEach(d => { map[d] = [...new Set(products.filter(p => !p.isDeleted && p.inStock !== false).flatMap(p => getProductPairs(p)).filter(pair => pair.department === d).map(pair => pair.category))]; }); return map; }, [products, departments]);
  const uniqueCategories = useMemo(() => {
    if (activeFilter.dept !== 'all') return [...new Set(products.flatMap(p => getProductPairs(p)).filter(pair => pair.department === activeFilter.dept).map(pair => pair.category))];
    return [...new Set(products.flatMap(p => getProductCatList(p)))];
  }, [products, activeFilter.dept]);

  const normalizedHomeLayout = useMemo(() => {
    const fallback = buildDefaultHomeLayout(homeSections);
    const incoming = Array.isArray(homeLayout) && homeLayout.length ? homeLayout : fallback;
    const mergedMap = new Map();

    fallback.forEach(item => mergedMap.set(item.id, { ...item }));
    incoming.forEach(item => {
      const base = mergedMap.get(item.id) || {
        id: item.id,
        label: item.label || homeSections.find(section => section.id === item.id)?.title || 'Bloque',
        type: item.id === 'community' ? 'community' : 'section',
      };
      mergedMap.set(item.id, { ...base, ...item, active: item.active !== false });
    });

    return Array.from(mergedMap.values()).sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
  }, [homeLayout, homeSections]);

  const allUniqueCategories = useMemo(() => [...new Set(products.flatMap(p => getProductCatList(p)))], [products]);
  const allDepartments = useMemo(() => [...new Set(products.flatMap(p => getProductDeptList(p)))], [products]);
  const getPuffs = (p) => p.puffs ?? categoryPuffs[p.category];
  const uniquePuffs = useMemo(() => [...new Set(products.map(p => p.puffs ?? categoryPuffs[p.category]).filter(v => v !== undefined && v !== null && v !== ''))].map(Number).sort((a, b) => a - b), [products, categoryPuffs]);
  const minPrice = useMemo(() => products.length ? Math.min(...products.map(p => p.price || 0)) : 0, [products]);
  const maxPrice = useMemo(() => products.length ? Math.max(...products.map(p => p.price || 0)) : 100000, [products]);

  const catalogProducts = useMemo(() => {
    let filtered = [...products];
    if (filterDepts.length > 0) filtered = filtered.filter(p => getProductDeptList(p).some(d => filterDepts.includes(d)));
    if (filterBrands.length > 0) filtered = filtered.filter(p => getProductCatList(p).some(c => filterBrands.includes(c)));
    if (activeFlavors.length > 0) filtered = filtered.filter(p => Array.isArray(p.flavors) && activeFlavors.every(f => p.flavors.includes(f)));
    if (filterPuffs.length > 0) filtered = filtered.filter(p => filterPuffs.some(pv => String(p.puffs ?? categoryPuffs[p.category]) === String(pv)));
    if (priceRange !== null) filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (searchTerm) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const arsPrice = (p) => p.tag === 'USD' ? p.price * usdToArs : p.price;
    const sorted = [...filtered];
    if (sortBy === 'mayor_precio') sorted.sort((a, b) => arsPrice(b) - arsPrice(a));
    else if (sortBy === 'menor_precio') sorted.sort((a, b) => arsPrice(a) - arsPrice(b));
    else if (sortBy === 'reciente') sorted.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    else sorted.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
    return sorted;
  }, [products, filterDepts, filterBrands, activeFlavors, filterPuffs, priceRange, searchTerm, sortBy, categoryPuffs, usdToArs]);

  // Le describe el catálogo a Google en su formato: cada producto con su marca,
  // precio y disponibilidad. Es lo que permite que aparezcan con el precio al lado
  // en los resultados de búsqueda, en vez de un link de texto pelado.
  const datosDeProductos = useMemo(() => {
    const visibles = products.filter(p => !p.isDeleted).slice(0, 40);
    if (!visibles.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Catálogo 028 Import',
      numberOfItems: visibles.length,
      itemListElement: visibles.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          image: p.image || undefined,
          description: p.description || undefined,
          brand: p.category ? { '@type': 'Brand', name: p.category } : undefined,
          offers: {
            '@type': 'Offer',
            price: Number(p.offerPrice > 0 && p.offerPrice < p.price ? p.offerPrice : p.price) || 0,
            priceCurrency: p.tag === 'USD' ? 'USD' : 'ARS',
            availability: p.inStock === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          },
        },
      })),
    };
  }, [products]);

  const activeFilterCount = activeFlavors.length + filterBrands.length + filterDepts.length + filterPuffs.length + (priceRange !== null ? 1 : 0);

  const slugify = (text) => text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');

  const flavorFilterVisible = activeFilter.dept === 'all' || activeFilter.dept === 'VAPES';

  const toggleFlavorFilter = (flavor) => {
    setActiveFlavors(prev => prev.includes(flavor) ? prev.filter(f => f !== flavor) : [...prev, flavor]);
  };

  useEffect(() => {
    if (!flavorFilterVisible && activeFlavors.length) setActiveFlavors([]);
  }, [flavorFilterVisible]);

  useEffect(() => {
    if (!showFlavorMenu) return;
    const handleClickOutside = (e) => {
      if (flavorMenuRef.current && !flavorMenuRef.current.contains(e.target)) setShowFlavorMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFlavorMenu]);

  useEffect(() => {
    if (!showSortDropdown) return;
    const handleClickOutside = (e) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) setShowSortDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortDropdown]);

  const firebaseRefs = useMemo(() => {
    if (typeof window === "undefined") return { auth: null, db: null };
    try {
      const firebaseConfig = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID };
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      return { auth: getAuth(app), db: getFirestore(app) };
    } catch (error) { return { auth: null, db: null }; }
  }, []);

  useEffect(() => {
    const handleScroll = () => setHeaderScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const showTimer = setTimeout(() => setShowTooltip(true), 2500);
    const hideTimer = setTimeout(() => setShowTooltip(false), 9000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("is-visible"); });
      }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" } 
    );
    const timeoutId = setTimeout(() => {
        const elements = document.querySelectorAll('.reveal-on-scroll');
        elements.forEach((el) => observer.observe(el));
    }, 100);
    return () => { clearTimeout(timeoutId); observer.disconnect(); }
  }, [currentView, activeFilter, products, searchTerm, homeSections, communityVideos, homeLayout]);

  useEffect(() => {
    const id = setTimeout(() => {
      document.querySelectorAll('.reveal-on-scroll:not(.is-visible)').forEach(el => el.classList.add('is-visible'));
    }, 50);
    return () => clearTimeout(id);
  }, [catalogProducts]);

  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (institucional || !firebaseRefs.db) return;
    // Escucha un único documento público que solo tiene nombre de pila y producto.
    // Los pedidos reales quedan privados: acá no hay teléfono ni dirección.
    const unsubscribeFomo = onSnapshot(doc(firebaseRefs.db, 'fomo', 'latest'), (snap) => {
        if (isFirstLoad.current) { isFirstLoad.current = false; return; }
        const ultimo = snap.data();
        if (ultimo?.name && ultimo?.product) {
            setFomoData({ name: ultimo.name, product: ultimo.product });
            setTimeout(() => setFomoData(null), 6000);
        }
    });
    return () => unsubscribeFomo();
  }, [firebaseRefs.db]);

  // El panel del vape 3D avisa por aca cuando tocan un sabor. Antes abria la
  // ventana emergente; ahora lleva a la pagina de ese producto, como cualquier
  // otro enlace de la tienda.
  useEffect(() => {
    const handleOpenProduct = (e) => {
      const name = e.detail?.name?.toLowerCase();
      if (!name) return;
      const found = products.find(p => p.name?.toLowerCase() === name);
      if (found) router.push(rutaProducto(found));
    };
    window.addEventListener('openProduct', handleOpenProduct);
    return () => window.removeEventListener('openProduct', handleOpenProduct);
  }, [products, router]);

  useEffect(() => {
    if (institucional) return;
    const handleFocus = () => setIsSending(false);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handleFocus);

    if (!firebaseRefs.auth || !firebaseRefs.db) {
      return () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('pageshow', handleFocus);
      };
    }

    let stockUnsub = null, promosUnsub = null;
    let upsellsUnsub = null, carritoUnsub = null, opinionesUnsub = null;

    // Sólo hace falta escuchar esto en la portada, que es la única página que las
    // muestra.
    if (modo === 'inicio') {
      opinionesUnsub = onSnapshot(
        query(collection(firebaseRefs.db, 'comentarios_home'), where('aprobado', '==', true), orderBy('createdAt', 'desc'), limit(24)),
        (snap) => setOpinionesHome(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        () => {}
      );
    }

    // Los datos del catálogo son públicos: no hace falta esperar a que termine el
    // login para pedirlos. Antes todo esto vivía adentro del callback de auth, así
    // que la descarga arrancaba recién después de crear una sesión anónima y
    // esperar su respuesta. Ahora las dos cosas salen en paralelo.
stockUnsub = onSnapshot(collection(firebaseRefs.db, 'products'), (snapshot) => {
      const normalizeProductId = (docId, data = {}) => {
        const rawId = data.id ?? String(docId).replace(/^prod_/, '');
        const numericId = Number(rawId);
        return Number.isSafeInteger(numericId) && String(rawId).trim() !== '' ? numericId : rawId;
      };

      const dbProducts = !snapshot.empty
        ? snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              dbId: docSnap.id,
              ...data,
              id: normalizeProductId(docSnap.id, data),
              isHidden: data.isHidden === true,
              isDeleted: data.isDeleted === true,
              inStock: data.inStock === false ? false : true,
              cardSize: data.cardSize || 'normal',
              clicks: data.clicks || 0,
              order: Number(data.order) || 99,
            };
          })
        : [];

      const combined = [...initialProducts];

      dbProducts.forEach(dbItem => {
        const index = combined.findIndex(p => String(p.id) === String(dbItem.id));
        if (dbItem.isDeleted) {
          if (index > -1) combined.splice(index, 1);
          return;
        }
        if (index > -1) combined[index] = { ...combined[index], ...dbItem };
        else combined.push(dbItem);
      });

      const sortedAll = combined.sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
      setAllProducts(sortedAll);
      setProducts(sortedAll.filter(p => !p.isHidden));
    });

    promosUnsub = onSnapshot(collection(firebaseRefs.db, 'promos'), (s) => setPromos(!s.empty ? s.docs.map(d => ({ id: d.id, ...d.data() })) : []));
    getDocs(collection(firebaseRefs.db, 'home_sections')).then(s => setHomeSections(!s.empty ? s.docs.map(d => ({ dbId: d.id, ...d.data() })).sort((a, b) => a.order - b.order) : [])).catch(() => {});

    // Toda la configuración en una sola lectura. Antes eran 8 pedidos sueltos, cada
    // uno con su viaje de ida y vuelta al servidor.
    getDocs(collection(firebaseRefs.db, 'settings')).then(snap => {
      const ajustes = {};
      snap.forEach(d => { ajustes[d.id] = d.data(); });

      const videos = Array.isArray(ajustes.community_videos?.videos)
        ? ajustes.community_videos.videos
            .filter(video => !video.isHidden && !video.isDeleted && video.videoUrl)
            .sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99))
        : [];
      setCommunityVideos(videos.length ? videos : INITIAL_COMMUNITY_VIDEOS);

      setHomeLayout(Array.isArray(ajustes.home_layout?.sections) ? ajustes.home_layout.sections : []);

      if (ajustes.departments) {
        setDeptIcons(ajustes.departments.icons || {});
        setVirtualDepts(ajustes.departments.virtualDepts || []);
      }

      const usd = Number(ajustes.cotizacion?.usdToArs);
      if (usd > 0) setUsdToArs(usd);

      if (ajustes.category_puffs) setCategoryPuffs(ajustes.category_puffs);

      if (ajustes.vidriera_style) {
        setVidreiraCardRadius(ajustes.vidriera_style.cardRadius || 'rounded');
        setVidreiraShowIcons(ajustes.vidriera_style.showIcons !== false);
      }

      if (ajustes.vape3d_position) setVape3dPosition(ajustes.vape3d_position.afterSectionId || null);
      if (ajustes.logos_bar_position) setLogosBarPosition(ajustes.logos_bar_position.afterSectionId || 'banner');
    }).catch(() => setCommunityVideos(INITIAL_COMMUNITY_VIDEOS));

    upsellsUnsub = onSnapshot(collection(firebaseRefs.db, 'upsells'), (snap) => {
      setUpsellsList(!snap.empty ? snap.docs.map(d => ({ id: d.id, ...d.data() })) : []);
    });
    carritoUnsub = onSnapshot(collection(firebaseRefs.db, 'carritoDestacados'), (snap) => {
      setCarritoDestacados(!snap.empty ? snap.docs.map(d => ({ id: d.id, ...d.data() })) : []);
    });
    // Los cupones NO se suscriben acá. Antes se traía la colección entera —todos
    // los códigos, activos e inactivos, con su porcentaje— al navegador de cualquier
    // visitante, sólo para poder validar el que alguien tipeara en el cajón de
    // "Aplicar cupón". Ahora esa validación se hace de a un código por vez, contra
    // /api/cupon, que nunca revela el resto.

    // La sesión anónima sigue existiendo (la usa el login de clientes), pero ya no
    // bloquea la carga del catálogo.
    const unsubscribeAuth = onAuthStateChanged(firebaseRefs.auth, (u) => {
      setUser(u);
      if (!u && !googleSigningIn.current) {
        signInAnonymously(firebaseRefs.auth).catch(console.error);
      }
    });

    return () => {
      unsubscribeAuth();
      stockUnsub?.();
      promosUnsub?.();
      upsellsUnsub?.();
      carritoUnsub?.();
      opinionesUnsub?.();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handleFocus);
    };
  }, [firebaseRefs, modo]);

  useEffect(() => {
    const upsellItems = upsellsList.filter(u => u.active !== false && !cart.find(c => String(c.id) === String(u.productId)));
    const carritoItems = carritoDestacados.filter(u => u.active !== false && !cart.find(c => String(c.id) === String(u.productId)));
    const activeUpsells = [...upsellItems, ...carritoItems];
    if (activeUpsells.length <= 1) return;
    const interval = setInterval(() => {
      setUpsellIndex(i => {
        setPrevUpsellIndex(i);
        const next = (i + 1) % activeUpsells.length;
        setTimeout(() => setPrevUpsellIndex(null), 500);
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [upsellsList, carritoDestacados, cart]);

  useEffect(() => {
      if (!user || user.isAnonymous || !firebaseRefs.db) return;
      const unsubscribe = onSnapshot(doc(firebaseRefs.db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              setDbUser(data);
              if(data.name) setClientName(data.name);
          }
      });
      return () => unsubscribe();
  }, [user, firebaseRefs.db]);

  const handleGoogleLogin = async () => {
      if (!firebaseRefs.auth || !firebaseRefs.db) return;
      googleSigningIn.current = true;
      try {
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(firebaseRefs.auth, provider);
          const u = result.user;
          const userRef = doc(firebaseRefs.db, 'users', u.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
              await setDoc(userRef, { name: u.displayName, email: u.email, photoURL: u.photoURL, createdAt: serverTimestamp() });
          }
          showToast("¡Sesión iniciada con éxito! 🎉");
      } catch (error) {
          if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
              console.error(error);
          }
      } finally {
          googleSigningIn.current = false;
      }
  };
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!firebaseRefs.auth || !firebaseRefs.db) return;
    setAuthError('');
    if (authMode === 'register' && authPassword !== authConfirmPassword) {
      setAuthError('Las contraseñas no coinciden.');
      return;
    }
    setAuthLoading(true);
    try {
      if (authMode === 'register') {
        const result = await createUserWithEmailAndPassword(firebaseRefs.auth, authEmail, authPassword);
        const u = result.user;
        const displayName = authName.trim() || authEmail.split('@')[0];
        await updateProfile(u, { displayName });
        await setDoc(doc(firebaseRefs.db, 'users', u.uid), { name: displayName, email: u.email, photoURL: null, createdAt: serverTimestamp() });
        showToast("¡Cuenta creada con éxito! Bienvenido/a 🎉");
      } else {
        await signInWithEmailAndPassword(firebaseRefs.auth, authEmail, authPassword);
        showToast("¡Sesión iniciada con éxito! 🎉");
      }
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthConfirmPassword('');
      setAuthName('');
    } catch (error) {
      const msgs = {
        'auth/email-already-in-use': 'Ese email ya está registrado.',
        'auth/invalid-email': 'El email no es válido.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/user-not-found': 'No existe una cuenta con ese email.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/invalid-credential': 'Email o contraseña incorrectos.',
        'auth/too-many-requests': 'Demasiados intentos. Intentá más tarde.',
      };
      setAuthError(msgs[error.code] || 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setAuthLoading(false);
    }
  };

  const showToast = React.useCallback((message) => { setToastMessage(message); setTimeout(() => { setToastMessage(null); }, 3000); }, []);


  const getCommunityVideoPoster = (videoUrl) => {
    const url = String(videoUrl || '').trim();
    if (!url) return '';
    // Cloudinary puede generar el frame al vuelo desde la propia URL
    if (url.includes('/video/upload/')) {
      return url
        .replace('/video/upload/', '/video/upload/f_jpg,so_0.6,q_auto/')
        .replace(/\.(mp4|mov|webm)(\?.*)?$/i, '.jpg');
    }
    // Videos propios en /community: el póster es el mismo nombre en .webp,
    // así no hay que mantener ninguna lista aparte.
    if (url.startsWith('/community/')) return url.replace(/\.(mp4|mov|webm)$/i, '.webp');
    // Firebase Storage: se mantiene el mapa por si quedara alguno apuntando ahí.
    const fileName = decodeURIComponent((url.split('/o/')[1] || '').split('?')[0]).toLowerCase();
    const match = Object.keys(COMMUNITY_POSTERS).find(key => fileName.includes(key));
    return match ? COMMUNITY_POSTERS[match] : '';
  };

  const getCommunityDocId = (video) => video?.dbId || null;

  const trackCommunityView = (video) => {
    const docId = getCommunityDocId(video);
    if (!docId || !firebaseRefs.db || communityViewedRef.current.has(docId)) return;
    communityViewedRef.current.add(docId);
    setDoc(doc(firebaseRefs.db, 'community_videos', docId), { views: increment(1) }, { merge: true }).catch(console.error);
  };

  const handleCommunityProductClick = (video, product, e) => {
    if (e) e.stopPropagation();
    const docId = getCommunityDocId(video);
    if (docId && firebaseRefs.db) {
      setDoc(doc(firebaseRefs.db, 'community_videos', docId), { clicks: increment(1) }, { merge: true }).catch(console.error);
    }
    if (product) {
      addToCart(product, e);
    } else {
      router.push('/catalogo');
    }
  };

  const getProductsShownForVideo = (video) => {
    const rawIds = [
      ...(video?.productId ? [video.productId] : []),
      ...(Array.isArray(video?.productsShown) ? video.productsShown : [])
    ];

    const uniqueIds = rawIds
      .map(id => String(id ?? '').trim())
      .filter(Boolean)
      .filter((id, index, arr) => arr.indexOf(id) === index);

    return uniqueIds
      .map(id => allProducts.find(p => String(p.id) === id && !p.isDeleted))
      .filter(Boolean);
  };

  const toggleCommunityCardFlip = (cardId) => {
    setFlippedCommunityCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };


  const flashCommunityVideoIcon = (cardId, icon) => {
    setCommunityVideoFeedback(prev => ({ ...prev, [cardId]: icon }));
    setTimeout(() => {
      setCommunityVideoFeedback(prev => {
        const next = { ...prev };
        delete next[cardId];
        return next;
      });
    }, 650);
  };

  const handleCommunityVideoTap = (cardId, videoData, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const videoEl = communityVideoRefs.current[cardId];
    if (!videoEl) return;
    videoEl.muted = true;

    if (videoEl.paused) {
      Object.entries(communityVideoRefs.current).forEach(([id, el]) => {
        if (id !== cardId && el && !el.paused) {
          el.pause();
          el.currentTime = 0;
        }
      });
      setCommunityVideoBuffering(prev => ({ ...prev, [cardId]: true }));
      const playPromise = videoEl.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => {
          trackCommunityView(videoData);
          flashCommunityVideoIcon(cardId, 'fa-pause');
        }).catch(() => {
          setCommunityVideoBuffering(prev => ({ ...prev, [cardId]: false }));
          flashCommunityVideoIcon(cardId, 'fa-play');
        });
      } else {
        trackCommunityView(videoData);
        flashCommunityVideoIcon(cardId, 'fa-pause');
      }
    } else {
      videoEl.pause();
      flashCommunityVideoIcon(cardId, 'fa-play');
    }
  };

  const handleCommunityFullscreen = async (cardId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const videoEl = communityVideoRefs.current[cardId];
    if (!videoEl) return;

    videoEl.controls = true;

    try {
      if (videoEl.requestFullscreen) {
        await videoEl.requestFullscreen();
      } else if (videoEl.webkitEnterFullscreen) {
        videoEl.webkitEnterFullscreen();
      } else if (videoEl.webkitRequestFullscreen) {
        await videoEl.webkitRequestFullscreen();
      }
    } catch (err) {
      videoEl.controls = true;
    }
  };


  const isFinePointerDevice = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  };

  const handleCommunityHoverStart = (cardId, videoData) => {
    if (!isFinePointerDevice()) return;
    setHoveredCommunityCard(cardId);
    const videoEl = communityVideoRefs.current[cardId];
    if (!videoEl) return;
    videoEl.muted = true;
    Object.entries(communityVideoRefs.current).forEach(([id, el]) => {
      if (id !== cardId && el && !el.paused) { el.pause(); el.currentTime = 0; }
    });
    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => trackCommunityView(videoData)).catch(() => {});
    } else {
      trackCommunityView(videoData);
    }
  };

  const handleCommunityHoverEnd = (cardId) => {
    if (!isFinePointerDevice()) return;
    setHoveredCommunityCard(null);
    const videoEl = communityVideoRefs.current[cardId];
    if (!videoEl) return;
    videoEl.pause();
  };

  const scrollCommunityRail = (direction = 1) => {
    const rail = communityScrollRef.current;
    if (!rail) return;
    const cardWidth = rail.querySelector('[data-community-card]')?.getBoundingClientRect?.().width || 320;
    rail.scrollBy({ left: direction * (cardWidth + 24), behavior: 'smooth' });
  };

  const handleCommunityWheel = (e) => {
    if (!isFinePointerDevice()) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.currentTarget.scrollLeft += e.deltaY;
  };

  const openCommunityFeaturedVideo = (video) => {
    setActiveCommunityVideoId(video.dbId || video.id);
    setFlippedCommunityCards(prev => ({ ...prev, featured: false }));
  };

  // Al tocar un departamento o una marca se reinician los demás filtros que hubiera puestos
  // (gustos, puffs, rango de precio, búsqueda) para que no queden filtros "viejos" mezclados.
  const resetSecondaryFilters = () => { setActiveFlavors([]); setFilterPuffs([]); setPriceRange(null); setSearchTerm(''); };

  const navigateTo = (view, dept = null) => { setCurrentView(view); if(dept) { resetSecondaryFilters(); setActiveFilter({dept, cat: 'all'}); setFilterDepts([dept]); setFilterBrands([]); } setIsMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const openFilterDrawer = () => {
    setPendingFlavors([...activeFlavors]);
    setPendingBrands([...filterBrands]);
    setPendingDepts([...filterDepts]);
    setPendingPuffs([...filterPuffs]);
    setPendingPriceRange(priceRange || [minPrice, maxPrice]);
    setShowFilterDrawer(true);
  };

  const applyFilters = () => {
    setActiveFlavors(pendingFlavors);
    setFilterBrands(pendingBrands);
    setFilterDepts(pendingDepts);
    setFilterPuffs(pendingPuffs);
    const fullRange = pendingPriceRange[0] <= minPrice && pendingPriceRange[1] >= maxPrice;
    setPriceRange(fullRange ? null : pendingPriceRange);
    setShowFilterDrawer(false);
  };

  const clearPendingFilters = () => {
    setPendingFlavors([]);
    setPendingBrands([]);
    setPendingDepts([]);
    setPendingPuffs([]);
    setPendingPriceRange([minPrice, maxPrice]);
  };
  
  const getTotalItems = () => cart.reduce((acc, item) => acc + item.qty, 0);
  // El precio por unidad según cuánto se lleve. Si hay varios escalones cargados,
  // vale el más alto que ya haya alcanzado, no el primero que aparezca.
  const getUnitPromoPrice = (item) => {
    const escalones = escalonesDeProducto(promos, item);
    if (!escalones.length) return item.price;

    // Un combo del producto se cuenta por unidades de ese producto; uno de la marca,
    // por todo lo que se lleve de esa marca.
    const esDelProducto = promos.some(p => p.type === 'product' && String(p.productId) === String(item.id));
    const cantidad = esDelProducto
      ? cart.filter(i => String(i.id) === String(item.id)).reduce((acc, c) => acc + c.qty, 0)
      : cart.filter(i => i.category === item.category).reduce((acc, c) => acc + c.qty, 0);

    return precioSegunCantidad(escalones, cantidad, item.price);
  };
  
  const calculateTotal = (cartData = cart) => {
      const subtotal = cartData.reduce((acc, item) => acc + (item.qty * (item.isUpsell ? item.upsellPrice : getUnitPromoPrice(item))), 0);
      const envio = (deliveryMethod === 'envio' && shippingType === 'moto') ? shippingCost : 0;
      const cashDiscount = (deliveryMethod === 'envio' && shippingType === 'moto' && paymentMethod === 'efectivo')
        ? (subtotal >= 50000 ? 2500 : 1500) : 0;
      const couponDiscount = appliedCoupon ? Math.round(subtotal * appliedCoupon.discount / 100) : 0;
      const pagoSeguro = pagoSeguroActivo ? PRECIO_PAGO_SEGURO : 0;
      return subtotal + envio + pagoSeguro - cashDiscount - couponDiscount;
  };

  const addToCart = React.useCallback(async (product, e) => {
    if(e) e.stopPropagation();
    if (product.inStock === false) return;
    const hasOffer = product.offerPrice > 0 && product.offerPrice < product.price;
    const effectivePrice = hasOffer ? product.offerPrice : product.price;

    setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
        return [...prev, { ...product, price: effectivePrice, listPrice: product.price, qty: 1 }];
    });
    showToast(`✅ Añadido: ${product.name}`); 

    if (firebaseRefs.db) {
      try { 
          setDoc(doc(firebaseRefs.db, 'products', `prod_${product.id}`), { clicks: increment(1) }, { merge: true }).catch(e => console.error(e)); 
      } catch (err) { console.error(err); }
    }
  }, [showToast, firebaseRefs.db]);
  
  const changeQty = React.useCallback((id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  }, []);

  const handleAddUpsellToCart = (upsell) => {
      const prod = products.find(p => String(p.id) === String(upsell.productId));
      if (!prod) return;
      const effectivePrice = upsell.price ? Number(upsell.price) : Number(prod.price);
      setCart(prev => {
          const existing = prev.find(item => item.id === prod.id);
          if (existing) return prev.map(item => item.id === prod.id ? { ...item, qty: item.qty + 1, isUpsell: !!upsell.price, upsellPrice: effectivePrice } : item);
          return [...prev, { ...prod, qty: 1, isUpsell: !!upsell.price, upsellPrice: effectivePrice }];
      });
      showToast(`✅ ${upsell.price ? 'Oferta agregada' : 'Producto agregado'}: ${prod.name}`);
  };

  const handleCheckout = () => {
    if (!clientName.trim() || !clientPhone.trim()) { 
        showToast("⚠️ Completá tu Nombre y Teléfono."); 
        return; 
    }
    if (deliveryMethod === 'envio') {
        if (!address.trim() || !zone.trim()) { 
            showToast("⚠️ Completá dirección y localidad."); 
            return; 
        }
        if (shippingType === 'moto' && paymentMethod === 'transferencia') {
            setShowPaymentModal(true);
            return;
        }
    }
    executeOrder();
  };

  const executeOrder = async () => {
    setShowPaymentModal(false);
    setIsSending(true);
    let currentCart = [...cart];

    // WhatsApp Desktop (PC) y WhatsApp en Android rompen los emojis al recibir el link
    // (los muestran como "�"). En iPhone/iPad no pasa, así que ahí se mandan los emojis normalmente.
    const isIOSClient = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const emo = (e) => isIOSClient ? e : '';
    const DIVIDER = isIOSClient ? `➖➖➖➖➖➖➖➖➖➖` : `----------`;

    // El pedido se manda al servidor para que vuelva a calcular cada precio con los
    // datos reales del momento, antes de guardarlo. El navegador no decide el precio
    // final: solo arma el carrito y el mensaje con lo que el servidor confirma. Así,
    // si alguna vez el navegador tuviera un precio desactualizado —una conexión que se
    // cortó, una pestaña abierta hace rato— nunca llega a convertirse en un pedido real
    // con ese precio incorrecto.
    let verificado;
    try {
      const resp = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: currentCart.map(i => ({
            productId: i.id,
            name: i.name,
            qty: i.qty,
            isUpsell: !!i.isUpsell,
            upsellPrice: i.isUpsell ? i.upsellPrice : undefined,
          })),
          clientName,
          clientPhone,
          userId: user?.uid || 'anon',
          deliveryMethod,
          address: deliveryMethod === 'envio' ? address : '',
          zone: deliveryMethod === 'envio' ? zone : '',
          aptDetails: deliveryMethod === 'envio' ? aptDetails.trim() : '',
          shippingOption: deliveryMethod === 'envio' ? shippingType : null,
          paymentMethod: deliveryMethod === 'envio' && shippingType === 'moto' ? paymentMethod : null,
          deliveryDate: deliveryMethod === 'envio' && shippingType === 'moto' ? deliveryDate : null,
          deliveryTime: deliveryMethod === 'envio' && shippingType === 'moto' ? deliveryTime : null,
          shippingCost: (deliveryMethod === 'envio' && shippingType === 'moto') ? shippingCost : 0,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          pagoSeguroActivo,
          precioPagoSeguro: PRECIO_PAGO_SEGURO,
        }),
      });
      verificado = await resp.json();
      if (!resp.ok || !verificado.ok) {
        const faltantes = (verificado?.sinStock || []).join(', ');
        showToast(faltantes ? `⚠️ Sin stock: ${faltantes}` : '⚠️ No se pudo confirmar el pedido. Probá de nuevo.');
        setIsSending(false);
        return;
      }
    } catch (e) {
      showToast('⚠️ No se pudo conectar para confirmar el pedido. Probá de nuevo.');
      setIsSending(false);
      return;
    }

    // De acá en adelante, todo sale de lo que confirmó el servidor: subtotal, envío,
    // descuentos y el precio de cada producto. No se recalcula nada del lado del
    // navegador para armar el mensaje.
    const itemsVerificados = verificado.items;
    const finalTotal = verificado.total;

    let msg = `Hola *${CONFIG.brandName}*, mi pedido:\n`;

    if (deliveryMethod === 'envio' && shippingType === 'flash') {
        msg = `¡Hola *${CONFIG.brandName}*!${emo(' 👋')}\nQuiero hacer un pedido con *ENVÍO FLASH*${emo(' 🚀')}\n¿Me pasás los datos para transferir?\n`;
    } else if (deliveryMethod === 'envio' && shippingType === 'moto') {
        if (paymentMethod === 'transferencia') {
            msg = `¡Hola *${CONFIG.brandName}*!${emo(' 👋')}\nAcabo de transferir por mi pedido:\n`;
        } else {
            msg = `¡Hola *${CONFIG.brandName}*!${emo(' 👋')}\nQuiero hacer un pedido, pago en *efectivo* al recibir:\n`;
        }
    }

    // --- PRODUCTOS ---
    msg += `\n${DIVIDER}\n${emo('🛒 ')}*PRODUCTOS*\n`;

    itemsVerificados.forEach(i => {
        if (i.isUpsell) {
            msg += `• ${i.qty}x ${i.category} - ${i.name} (OFERTA $${formatPrice(i.price)})\n`;
        } else if (i.price < i.listPrice) {
            // El precio bajó por una promo de cantidad, no por un cupón. Se avisa acá
            // mismo: sin esto, el pedido llega con un precio más bajo que el de lista y
            // no hay forma de saber por qué con solo mirar el mensaje.
            msg += `• ${i.qty}x ${i.category} - ${i.name} ($${formatPrice(i.price)} c/u — PROMO x${i.qty}, antes $${formatPrice(i.listPrice)})\n`;
        } else {
            msg += `• ${i.qty}x ${i.category} - ${i.name} ($${formatPrice(i.price)} c/u)\n`;
        }
    });

    // --- TOTALES ---
    msg += `\n${DIVIDER}\n${emo('💰 ')}*TOTALES*\n`;
    msg += `Subtotal: ${CONFIG.currencySymbol}${formatPrice(verificado.subtotal)}\n`;

    if (verificado.envio > 0) {
        msg += `Envío (Moto): ${CONFIG.currencySymbol}${formatPrice(verificado.envio)}\n`;
    } else if (deliveryMethod === 'envio' && shippingType === 'moto') {
        msg += `Envío (Moto): A confirmar\n`;
    }

    if (verificado.pagoSeguroMonto > 0) msg += `${emo('🛡️ ')}Pago Seguro: ${CONFIG.currencySymbol}${formatPrice(verificado.pagoSeguroMonto)}\n`;
    msg += `*TOTAL A PAGAR: ${CONFIG.currencySymbol}${formatPrice(finalTotal)}*\n`;
    if (verificado.cashDiscount > 0) msg += `_(incluye -${CONFIG.currencySymbol}${formatPrice(verificado.cashDiscount)} por pago en efectivo)_\n`;
    if (verificado.couponDiscount > 0) msg += `_(incluye -${CONFIG.currencySymbol}${formatPrice(verificado.couponDiscount)} por cupón ${verificado.couponCode})_\n`;

    // --- ENTREGA ---
    msg += `\n${DIVIDER}\n${emo('📦 ')}*ENTREGA*\n`;
    msg += `${emo('📍 ')}${address}, ${zone}\n`;
    if (aptDetails.trim()) msg += `${emo('🏢 ')}Depto/Piso: ${aptDetails.trim()}\n`;

    if (shippingType === 'flash') {
        msg += `${emo('🚀 ')}Flash (30 mins)\n`;
    } else {
        msg += `${emo('🛵 ')}Motomensajería\n`;
        const selectedLabel = next7Days.find(d => d.value === deliveryDate)?.label || deliveryDate;
        msg += `${emo('📅 ')}Día: ${selectedLabel}\n`;
        msg += `${emo('⏰ ')}Turno: ${deliveryTime} hs\n`;
    }

    // --- PAGO ---
    if (shippingType === 'moto') {
        msg += `\n${DIVIDER}\n${emo('💳 ')}*PAGO*\n`;
        if (paymentMethod === 'transferencia') {
            msg += `Transferencia\n`;
            msg += `${emo('🏦 ')}Alias: ${CONFIG.paymentAlias}\n`;
            msg += `${emo('📎 ')}Adjunto el comprobante a continuación${emo(' 👇')}\n`;
        } else {
            msg += `Efectivo\n`;
        }
    }

    // --- CLIENTE ---
    msg += `\n${DIVIDER}\n${emo('👤 ')}*CLIENTE*\n`;
    msg += `${clientName}${clientPhone ? ' — ' + clientPhone : ''}\n`;

    const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;

    // El pedido ya quedó guardado por el servidor (con los precios verificados). Acá
    // sólo quedan los avisos que no tienen que ver con el precio: el cartelito
    // público de "fulano compró X" y la estadística de zonas.
    try {
        if (firebaseRefs.db) {
            if (clientName && itemsVerificados.length > 0) {
              setDoc(doc(firebaseRefs.db, 'fomo', 'latest'), {
                name: clientName.split(' ')[0],
                product: itemsVerificados[0].name,
                at: serverTimestamp()
              }).catch(console.error);
            }
            if (deliveryMethod === 'envio' && zone.trim()) {
              setDoc(doc(firebaseRefs.db, 'stats', 'zones'), { [zone.trim()]: increment(1) }, { merge: true }).catch(console.error);
            }
        }
        setTimeout(() => {
            window.location.href = whatsappUrl;
            setIsSending(false);
        }, 400);
    } catch (e) {
        window.location.href = whatsappUrl;
        setIsSending(false);
    }
  };

  const copyAliasToClipboard = () => {
    navigator.clipboard.writeText(CONFIG.paymentAlias);
    showToast("✅ ALIAS copiado al portapapeles");
  };

  const renderProductCard = (p, index, isVidriera = false, layout = 'horizontal') => (
    <TarjetaProducto
      key={p.id}
      p={p}
      index={index}
      isVidriera={isVidriera}
      layout={layout}
      radioVidriera={vidreiraCardRadius}
      cantidadEnCarrito={cart.find(i => i.id === p.id)?.qty || 0}
      promo={promos.find(pr => pr.type === 'product' && pr.productId === p.id) || null}
      onAgregar={addToCart}
      onCambiarCantidad={changeQty}
    />
  );

  const renderProductSection = (category) => {
    let sectionProducts = products.filter(p => getProductCatList(p).includes(category));

    if (activeFilter.dept !== 'all') {
        sectionProducts = sectionProducts.filter(p => getProductDeptList(p).includes(activeFilter.dept));
    }

    if (flavorFilterVisible && activeFlavors.length > 0) {
        sectionProducts = sectionProducts.filter(p => Array.isArray(p.flavors) && p.flavors.some(f => activeFlavors.includes(f)));
    }

    if (searchTerm) {
        sectionProducts = sectionProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (sectionProducts.length === 0) return null;
    
    const promo = promos.find(p => (p.type || 'category') === 'category' && p.category === category);
    let promoText = null;
    
    if (promo) {
        promoText = `${promo.minQty}+ un: $${formatPrice(promo.totalPrice / promo.minQty)} c/u`;
    }
    
    const showSectionHeader = activeFilter.dept !== 'all';

    return (
      <section key={category} id={slugify(category)} className="mb-20 scroll-mt-40 reveal-on-scroll">
        {(showSectionHeader || promoText) && (
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-8 gap-3 border-b border-gray-200 pb-4">
              {showSectionHeader && (
                <h2 className="text-3xl md:text-5xl font-bebas text-[#111111] tracking-wide uppercase relative">
                    {category}
                    <span className="absolute -bottom-[18px] left-0 w-16 h-1 bg-[#fcdb00] rounded-full"></span>
                </h2>
              )}
              {promoText && (
                  <div className="bg-[#fcdb00]/20 text-[#fcdb00] px-4 py-2 font-bebas text-lg rounded-full uppercase tracking-wider flex items-center gap-2">
                      <i className="fas fa-tag text-[#fcdb00] mb-0.5"></i> {promoText}
                  </div>
              )}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 md:gap-2">
            {sectionProducts.map((p, index) => renderProductCard(p, index, false, 'vertical'))}
        </div>
      </section>
    );
  };




  const renderCommunitySection = () => {
    const visibleVideos = communityVideos
      .filter(video => !video.isHidden && video.videoUrl)
      .sort((a, b) => {
        if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
        return (a.order || 99) - (b.order || 99);
      });

    if (!visibleVideos.length) return null;

    const CommunityProductButton = ({ video, product, compact = false }) => (
      <button
        onClick={(e) => handleCommunityProductClick(video, product, e)}
        className={`${compact ? 'w-10 h-10 rounded-xl text-sm flex-shrink-0' : 'w-full py-3 rounded-xl text-[10px]'} bg-[#fcdb00] text-[#111111] font-black uppercase tracking-widest hover:bg-[#f5d300] active:scale-95 transition-all font-poppins flex items-center justify-center gap-2`}
        title={product ? `Agregar ${product.name}` : 'Ver catálogo'}
      >
        {compact ? <i className="fas fa-cart-plus"></i> : <>{product ? 'Agregar' : 'Catálogo'} <i className={`fas ${product ? 'fa-cart-plus' : 'fa-arrow-right'} text-[10px]`}></i></>}
      </button>
    );

    const renderEditorialFlipCard = (video, index) => {
      const productsInVideo = getProductsShownForVideo(video);
      const mainProduct = productsInVideo[0] || null;
      const cardId = video.dbId || video.id || `community-${index}`;
      const isFlipped = !!flippedCommunityCards[cardId];

      return (
        <article
          key={cardId}
          data-community-card
          onMouseEnter={() => handleCommunityHoverStart(cardId, video)}
          onMouseLeave={() => handleCommunityHoverEnd(cardId)}
          className="group/community snap-center flex-shrink-0 w-[84vw] max-w-[360px] sm:w-[300px] md:w-[300px] lg:w-[310px] xl:w-[320px] community-card-enter transition-[transform,opacity,filter] duration-500 ease-out md:hover:-translate-y-1 md:hover:z-10"
          style={{ transitionDelay: `${index * 75}ms` }}
        >
          <div className="relative aspect-[9/16] community-card-depth" style={{ perspective: '1600px' }}>
            <div
              className="absolute inset-0"
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 720ms cubic-bezier(0.22, 0.82, 0.32, 1)',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* FRENTE: REEL */}
              <div
                className="absolute inset-0 rounded-[2rem] overflow-hidden bg-black border border-black/8 shadow-[0_12px_28px_rgba(0,0,0,0.10)] group transition-all duration-500 ease-out md:group-hover/community:shadow-[0_26px_58px_rgba(0,0,0,0.22)]"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                {(video.poster || getCommunityVideoPoster(video.videoUrl)) ? (
                  <img
                    src={video.poster || getCommunityVideoPoster(video.videoUrl)}
                    alt={video.title || '028 Community'}
                    className="absolute inset-0 w-full h-full object-cover bg-black"
                    loading={index < 2 ? "eager" : "lazy"}
                    draggable="false"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#111111]" />
                )}

                <video
                  ref={(el) => { if (el) { communityVideoRefs.current[cardId] = el; el.muted = true; } }}
                  src={video.videoUrl}
                  poster={video.poster || getCommunityVideoPoster(video.videoUrl) || undefined}
                  className={`absolute inset-0 z-[1] w-full h-full object-cover bg-black transition-opacity duration-300 pointer-events-none ${communityVideoLoaded[cardId] ? 'opacity-100' : 'opacity-0'}`}
                  playsInline
                  muted
                  preload="none"
                  x-webkit-airplay="deny"
                  onLoadedData={() => setCommunityVideoLoaded(prev => ({ ...prev, [cardId]: true }))}
                  onCanPlay={() => { setCommunityVideoLoaded(prev => ({ ...prev, [cardId]: true })); setCommunityVideoBuffering(prev => ({ ...prev, [cardId]: false })); }}
                  onPlay={() => {
                    setCommunityVideoLoaded(prev => ({ ...prev, [cardId]: true }));
                    setCommunityVideoBuffering(prev => ({ ...prev, [cardId]: false }));
                    setCommunityVideoPlaying(prev => ({ ...prev, [cardId]: true }));
                    trackCommunityView(video);
                  }}
                  onPause={() => setCommunityVideoPlaying(prev => ({ ...prev, [cardId]: false }))}
                  onWaiting={() => setCommunityVideoBuffering(prev => ({ ...prev, [cardId]: true }))}
                  onPlaying={() => setCommunityVideoBuffering(prev => ({ ...prev, [cardId]: false }))}
                />

                {!communityVideoPlaying[cardId] && (
                  <div className="pointer-events-none absolute inset-0 z-[4] flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-black/45 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-lg">
                      <i className="fas fa-play text-2xl ml-1"></i>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => handleCommunityVideoTap(cardId, video, e)}
                  className="absolute inset-0 z-[3] cursor-pointer touch-manipulation"
                  aria-label="Reproducir o pausar video"
                ></button>

                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent z-[2]"></div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/84 via-black/36 to-transparent z-[2]"></div>

                {communityVideoBuffering[cardId] && (
                  <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full border-[3px] border-white/20 border-t-white animate-spin" />
                  </div>
                )}

                {communityVideoFeedback[cardId] && (
                  <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                      <i className={`fas ${communityVideoFeedback[cardId]} text-2xl`}></i>
                    </div>
                  </div>
                )}

                <div className="absolute top-3 left-3 right-3 z-[6] flex items-start justify-between gap-2 pointer-events-none">
                  <div className="flex gap-2 flex-wrap">
                    {video.featured && <span className="bg-[#fcdb00] text-[#111111] px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest font-poppins">Destacado</span>}
                    <span className="bg-black/70 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest font-poppins border border-white/10">{video.type || 'Review'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleCommunityFullscreen(cardId, e)}
                    className="pointer-events-auto w-9 h-9 rounded-full bg-black/62 hover:bg-black/78 border border-white/15 backdrop-blur-md text-white flex items-center justify-center transition-all"
                    aria-label="Ver video en pantalla completa"
                  >
                    <i className="fas fa-expand text-[12px]"></i>
                  </button>
                </div>

                <div className="absolute left-4 right-4 bottom-3.5 z-[6] pointer-events-none">
                  <h3 className="font-bebas text-[2rem] uppercase tracking-[0.01em] leading-none text-white drop-shadow-md mb-1 line-clamp-2">{video.title || 'Contenido real 028'}</h3>
                  <p className="text-[12px] md:text-[13px] text-white/58 font-poppins font-medium mb-2.5 line-clamp-1">{video.creator || '@influencer'}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCommunityCardFlip(cardId); }}
                    className="pointer-events-auto w-[84%] mx-auto bg-white/68 text-[#111111] rounded-full py-2 text-[9px] font-black uppercase tracking-[0.18em] font-poppins hover:bg-white/78 transition-all flex items-center justify-center gap-2 shadow-[0_8px_18px_rgba(0,0,0,0.12)] backdrop-blur-xl border border-white/28"
                  >
                    <i className="fas fa-box-open"></i> Ver productos {productsInVideo.length > 0 ? `(${productsInVideo.length})` : ''}
                  </button>
                </div>
              </div>

              {/* DORSO: PRODUCTOS */}
              <div
                className="absolute inset-0 rounded-[2rem] overflow-hidden text-white border border-white/12 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
                style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                {isFlipped && (
                  <video
                    src={video.videoUrl}
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-35 bg-black"
                    muted
                    loop
                    autoPlay
                    playsInline
                    preload="none"
                    aria-hidden="true"
                  />
                )}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(252,219,0,0.10),transparent_28%)]"></div>
                <div className="absolute inset-0 bg-black/42"></div>
                <div className="absolute inset-0 backdrop-blur-[18px] bg-white/[0.07]"></div>
                <div className="absolute inset-[1px] rounded-[1.95rem] border border-white/10"></div>
                <div className="relative h-full p-4 md:p-5 flex flex-col min-h-0">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="text-white/72 text-[10px] font-black uppercase tracking-[0.18em] font-poppins mb-2">Productos del video</p>
                      <h3 className="font-bebas text-3xl uppercase leading-none tracking-wide line-clamp-2 text-white">{video.title || '028 Community'}</h3>
                      <p className="text-[12px] text-white/58 font-poppins mt-1 line-clamp-1">{video.creator || '@influencer'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCommunityCardFlip(cardId); }}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/16 border border-white/18 backdrop-blur-xl text-white flex items-center justify-center flex-shrink-0 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                      title="Volver al video"
                    >
                      <i className="fas fa-undo text-sm"></i>
                    </button>
                  </div>

                  <div
                    className="grid gap-2.5 overflow-y-auto no-scrollbar pr-1 pb-2 flex-1 min-h-0 content-start overscroll-contain touch-pan-y"
                    style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                  >
                    {productsInVideo.length ? productsInVideo.map(product => (
                      <div key={`flip-${cardId}-${product.id}`} className="bg-white/[0.11] backdrop-blur-2xl rounded-[1.05rem] p-2 grid grid-cols-[44px_minmax(0,1fr)_40px] items-center gap-2.5 border border-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_8px_22px_rgba(0,0,0,0.14)] min-w-0">
                        <div className="w-11 h-11 bg-white/16 rounded-xl p-1.5 flex-shrink-0 backdrop-blur-xl border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                          <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="font-bebas text-[17px] uppercase leading-[0.95] text-white break-words" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</p>
                          <p className="text-[12px] font-black mt-1 text-white leading-none">{CONFIG.currencySymbol}{formatPrice(product.price)}</p>
                        </div>
                        <CommunityProductButton video={video} product={product} compact />
                      </div>
                    )) : (
                      <div className="bg-white/[0.10] backdrop-blur-2xl border border-white/14 rounded-[1.35rem] p-5 text-center mt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                        <i className="fas fa-box-open text-[#fcdb00] text-2xl mb-3"></i>
                        <p className="text-sm font-black uppercase tracking-widest font-poppins">Sin productos cargados</p>
                        <p className="text-white/50 text-xs mt-2 font-poppins">Agregalos desde el admin usando productos mostrados.</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCommunityCardFlip(cardId); }}
                      className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/16 backdrop-blur-xl border border-white/14 text-white text-[10px] font-black uppercase tracking-widest transition-all font-poppins shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleCommunityProductClick(video, mainProduct, e)}
                      className="w-full py-2.5 rounded-xl bg-[#fcdb00] text-[#111111] text-[10px] font-black uppercase tracking-widest transition-all font-poppins hover:bg-[#f5d300]"
                    >
                      {mainProduct ? 'Agregar principal' : 'Catálogo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      );
    };

    return (
      <section id="community-section" className="community-clean-section mb-16 md:mb-20 reveal-on-scroll">
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            <span className="inline-flex items-center gap-2 bg-[#111111] text-white px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] font-poppins mb-4 shadow-none">
              <i className="fas fa-users text-[#fcdb00]"></i> Comunidad real
            </span>
            <h2 className="font-bebas text-[48px] md:text-[68px] uppercase tracking-[0.01em] leading-[0.94] text-[#111111] reveal-title reveal-on-scroll" style={{ WebkitTextStroke: '0.25px rgba(17,17,17,0.15)' }}>028 Community</h2>
          </div>
          <p className="hidden md:block max-w-sm text-right text-xs font-bold uppercase tracking-widest text-gray-600 font-poppins">Reels reales con productos comprables</p>
        </div>

        <div className="community-rail-shell relative group/communityRail overflow-visible">
          <button
            type="button"
            onClick={() => scrollCommunityRail(-1)}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-14 items-center justify-center rounded-full bg-black/8 hover:bg-black/22 text-white/45 hover:text-white border border-white/8 opacity-0 group-hover/communityRail:opacity-55 hover:!opacity-95 transition-all duration-300 backdrop-blur-sm"
            aria-label="Video anterior"
          >
            <i className="fas fa-chevron-left text-xs"></i>
          </button>
          <button
            type="button"
            onClick={() => scrollCommunityRail(1)}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-14 items-center justify-center rounded-full bg-black/8 hover:bg-black/22 text-white/45 hover:text-white border border-white/8 opacity-0 group-hover/communityRail:opacity-55 hover:!opacity-95 transition-all duration-300 backdrop-blur-sm"
            aria-label="Video siguiente"
          >
            <i className="fas fa-chevron-right text-xs"></i>
          </button>
          <div ref={communityScrollRef} onWheel={handleCommunityWheel} className="community-desktop-rail flex overflow-x-auto overflow-y-visible gap-2.5 md:gap-5 no-scrollbar snap-x snap-mandatory pt-8 -mt-6 pb-8 scroll-smooth -mx-4 md:-mx-6 px-4 md:px-6 scroll-px-4 md:scroll-px-6">
            {visibleVideos.map((video, index) => renderEditorialFlipCard(video, index))}
          </div>
        </div>
      </section>
    );
  };

  
const renderSingleHomeSection = (sec, sectionIndex = 0) => {
    const secProducts = sec.productIds?.map(pid => products.find(p => p.id === pid)).filter(Boolean).filter(p => p.inStock !== false) || [];
    if (secProducts.length === 0) return null;
    return (
      <div key={sec.id} className="mb-20 reveal-on-scroll">
        <div className="flex justify-between items-end mb-6 pl-2 border-b border-gray-200 pb-3">
          <h2 className="text-4xl md:text-6xl font-bebas tracking-wide uppercase text-[#111111]">
            {vidreiraShowIcons && <i className={`${AVAILABLE_ICONS.find(i => i.id === sec.icon)?.prefix || 'fas'} ${sec.icon || 'fa-star'} ${sec.iconColor || 'text-[#fcdb00]'} mr-3 drop-shadow-sm`}></i>}{sec.title}
          </h2>
          <Link href="/catalogo" prefetch={false} className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#111111]/60 hover:text-[#fcdb00] transition-colors bg-gray-100 px-5 py-2.5 rounded-full border border-gray-200 hover:border-[#fcdb00]/30">Ver Catálogo <i className="fas fa-arrow-right"></i></Link>
        </div>
        {sec.layout === 'vertical'
          ? <div className="flex flex-wrap gap-1.5 md:gap-2">{secProducts.map((p, index) => renderProductCard(p, index, true, sec.layout))}</div>
          : <HorizontalScroll className="flex overflow-x-auto gap-3 no-scrollbar pb-8 snap-x snap-mandatory -mx-4 md:mx-0 px-4 md:px-0 pr-4 md:pr-8">{secProducts.map((p, index) => renderProductCard(p, index, true, sec.layout))}</HorizontalScroll>
        }
        <Link href="/catalogo" prefetch={false} className="md:hidden w-full mt-2 bg-gray-100 backdrop-blur-xl border border-gray-200 text-[#111111]/80 py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform font-poppins">ver todos los modelos <i className="fas fa-arrow-right text-[#fcdb00]"></i></Link>
      </div>
    );
  };

  const renderHomeVidrieraSections = (onlySectionIds = null) => {
    const idSet = Array.isArray(onlySectionIds) ? new Set(onlySectionIds) : null;
    const sectionsToRender = idSet ? homeSections.filter(sec => idSet.has(sec.id)) : homeSections;
    if (sectionsToRender.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#fcdb00] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest font-poppins"></p>
        </div>
      );
    }
    return sectionsToRender.map((sec, sectionIndex) => renderSingleHomeSection(sec, sectionIndex));
  };

  // OJO: esto es JSX ya armado, no un componente (no es "const LogosBar = () => ...").
  // Es a propósito: si fuera un componente invocado como <LogosBar />, React lo trata
  // como un tipo nuevo en cada render de HomeClient —y acá hay MUCHOS renders, porque
  // el stock, las promos, las ofertas y demás se escuchan en vivo—. Cada uno de esos
  // renders remontaba el <img> de cada logo desde cero, así que la animación de
  // "flotar" nunca llegaba a completar un ciclo: se cortaba a la mitad y arrancaba de
  // nuevo, por eso se veía el salto de opacidad (más pálido/más fuerte) y el corte al
  // subir y bajar. Con JSX plano, React actualiza el mismo <img> en vez de recrearlo,
  // así que la animación corre sin interrupciones.
  const logosBarNode = (
    <div style={{width:'100vw', marginLeft:'calc(-50vw + 50%)'}} className="relative bg-[#d0d0d0] h-64 flex items-center justify-evenly px-6 mb-10 -mt-6">
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#f5f5f5] to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#f5f5f5] to-transparent pointer-events-none z-10" />
      {[
        "https://i.ibb.co/svyNs2PL/1.png",
        "https://i.ibb.co/XrFnc1Lg/2.png",
        "https://i.ibb.co/Psj9FpN3/3.png",
        "https://i.ibb.co/j9jJNgfN/4.png",
        "https://i.ibb.co/rKkcpVqz/5.png",
        "https://i.ibb.co/20nZ2zVW/6.png",
      ].map((src, i) => (
        <img key={i} src={src} alt={`brand-${i+1}`} loading="lazy" className="logo-float h-28 md:h-40 w-auto object-contain" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
    </div>
  );

  const enviarOpinionHome = async () => {
    if (!opinionRating) { setOpinionError('Elegí una calificación.'); return; }
    if (!opinionTexto.trim()) { setOpinionError('Contanos algo, aunque sea corto.'); return; }
    setOpinionEnviando(true);
    setOpinionError('');
    try {
      const nombreFinal = (user && !user.isAnonymous) ? (user.displayName || opinionNombre) : opinionNombre;
      const r = await fetch('/api/opiniones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombreFinal, rating: opinionRating, text: opinionTexto }),
      });
      const datos = await r.json();
      if (!r.ok || !datos.ok) { setOpinionError(datos.error || 'No se pudo enviar, probá de nuevo.'); setOpinionEnviando(false); return; }
      setOpinionEnviada(true);
      setOpinionNombre(''); setOpinionTexto(''); setOpinionRating(0);
    } catch {
      setOpinionError('No se pudo conectar, probá de nuevo.');
    } finally {
      setOpinionEnviando(false);
    }
  };

  const renderOpinionesSection = () => (
    <section id="opiniones-section" className="mt-4 mb-16 md:mb-20 reveal-on-scroll">
      <div className="mb-6 md:mb-8">
        <span className="inline-flex items-center gap-2 bg-[#111111] text-white px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] font-poppins mb-4">
          <i className="fas fa-star text-[#fcdb00]"></i> Tu opinión
        </span>
        <h2 className="font-bebas text-[40px] md:text-[56px] uppercase tracking-[0.01em] leading-[0.94] text-[#111111]">Lo que dicen de nosotros</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-5 md:gap-8">
        {/* Formulario */}
        <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-[0_0_20px_rgba(0,0,0,0.04)] p-6 md:p-7">
          {opinionEnviada ? (
            <div className="text-center py-6">
              <img src={CONFIG.logoImage} alt="028 Import" className="h-12 w-auto object-contain mx-auto mb-3" />
              <p className="font-bold text-sm text-[#111111]">¡Gracias por tu opinión!</p>
              <p className="text-[11px] text-gray-500 mt-1">La vamos a revisar y en breve se va a publicar acá.</p>
              <button onClick={() => setOpinionEnviada(false)} className="mt-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#111111] transition-colors">Dejar otra</button>
            </div>
          ) : (
            <>
              <p className="font-bebas text-2xl uppercase tracking-wide text-[#111111] mb-4">Dejá tu opinión</p>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setOpinionRating(n)} className="p-0.5" aria-label="Calificar">
                    <i className={`${n <= opinionRating ? 'fas' : 'far'} fa-star text-2xl ${n <= opinionRating ? 'text-[#fcdb00]' : 'text-gray-300'} transition-colors`}></i>
                  </button>
                ))}
              </div>
              {user && !user.isAnonymous ? (
                <div className="flex items-center gap-2.5 mb-3 bg-[#f2f2f2] rounded-xl px-3.5 py-2.5">
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    : <span className="w-7 h-7 rounded-full bg-[#111111] text-[#fcdb00] flex items-center justify-center text-[11px] font-bold uppercase flex-shrink-0">{(user.displayName || 'C').charAt(0)}</span>
                  }
                  <span className="text-[11px] font-bold text-gray-500 truncate">Publicando como <span className="text-[#111111]">{user.displayName || 'vos'}</span></span>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Tu nombre (opcional)"
                    value={opinionNombre}
                    onChange={e => setOpinionNombre(e.target.value)}
                    maxLength={60}
                    className="w-full p-3.5 rounded-xl bg-[#f2f2f2] outline-none font-bold text-sm mb-3 focus:ring-2 focus:ring-[#fcdb00] transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:border-[#fcdb00] hover:bg-[#fcdb00]/5 transition-all mb-3"
                  >
                    <i className="fab fa-google text-sm text-[#EA4335]"></i> O continuá con Google
                  </button>
                </>
              )}
              <textarea
                rows={3}
                placeholder="Contanos tu experiencia con la tienda..."
                value={opinionTexto}
                onChange={e => setOpinionTexto(e.target.value)}
                maxLength={500}
                className="w-full p-3.5 rounded-xl bg-[#f2f2f2] outline-none font-medium text-sm mb-3 resize-none focus:ring-2 focus:ring-[#fcdb00] transition-all"
              />
              {opinionError && <p className="text-red-500 text-xs font-bold mb-3">{opinionError}</p>}
              <button
                onClick={enviarOpinionHome}
                disabled={opinionEnviando}
                className="w-full bg-[#111111] text-[#fcdb00] font-bebas py-3.5 rounded-xl uppercase tracking-wider text-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {opinionEnviando ? 'Enviando...' : 'Publicar opinión'}
              </button>
            </>
          )}
        </div>

        {/* Opiniones aprobadas */}
        <div className="grid gap-3 sm:grid-cols-2 content-start">
          {opinionesHome.length === 0 ? (
            <div className="sm:col-span-2 bg-white rounded-[1.5rem] border border-dashed border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">Todavía no hay opiniones publicadas</p>
            </div>
          ) : opinionesHome.map(op => (
            <div key={op.id} className="relative bg-white rounded-[1.5rem] border border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.07)] p-6 pt-7">
              <img src={CONFIG.logoImage} alt="028 Import" className="absolute top-5 right-6 h-6 w-auto object-contain opacity-70" />
              <span className="flex items-center gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <i key={n} className={`fas fa-star text-[13px] ${n <= (op.rating || 0) ? 'text-[#fcdb00]' : 'text-gray-200'}`}></i>
                ))}
              </span>
              {op.text && <p className="text-[14px] text-[#111111] leading-relaxed mb-4">"{op.text}"</p>}
              <p className="font-bebas text-lg uppercase tracking-wide text-gray-500">— {op.name || 'Cliente'}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderOrderedHomeBlocks = () => {
    const result = [];
    let logosInsertada = false;
    const bloquesActivos = normalizedHomeLayout.filter(block => block.active !== false);

    // "row:2" y "before-last" son posiciones relativas, no atadas al nombre de una
    // sección puntual. Antes, elegir "Después de Perfumes" literalmente guardaba el
    // id de esa sección, y si después la reordenabas desde el panel, el 3D o la
    // barra de marcas se iban con ella a donde sea que Perfumes terminara. Con estas
    // dos opciones, la posición se recalcula sola contra el orden actual: 028
    // Community no cuenta como "hilera" acá, porque son reels, no productos.
    const hilerasDeProductos = bloquesActivos.filter(b => b.id !== 'community');
    const segundaHilera = hilerasDeProductos[1] || null;
    const ultimaHilera = hilerasDeProductos[hilerasDeProductos.length - 1] || null;

    bloquesActivos.forEach((block) => {
        // La barra de marcas "antes de la última hilera" se inserta ANTES de esa
        // hilera, no después.
        if (logosBarPosition === 'before-last' && !logosInsertada && ultimaHilera && block.id === ultimaHilera.id) {
          result.push(<React.Fragment key="logos-bar">{logosBarNode}</React.Fragment>);
          logosInsertada = true;
        }

        if (block.id === 'community') {
          result.push(<React.Fragment key="home-block-community">{renderCommunitySection()}</React.Fragment>);
        } else {
          const sec = homeSections.find(section => section.id === block.id);
          if (sec) result.push(<React.Fragment key={`home-block-${block.id}`}>{renderSingleHomeSection(sec)}</React.Fragment>);
        }

        if (vape3dPosition === block.id || (vape3dPosition === 'row:2' && segundaHilera && block.id === segundaHilera.id)) {
          result.push(<React.Fragment key="vape3d-showcase"><LazyVapeSpecs3D /></React.Fragment>);
        }

        // La barra de marcas va donde diga el panel (settings/logos_bar_position).
        if (logosBarPosition === block.id && !logosInsertada) {
          result.push(<React.Fragment key="logos-bar">{logosBarNode}</React.Fragment>);
          logosInsertada = true;
        }
      });
    // Si todavía no se configuró ninguna posición, se muestra al final como antes.
    if (!logosInsertada) result.push(<React.Fragment key="logos-bar-fallback">{logosBarNode}</React.Fragment>);
    return result;
  };

  return (
    <div style={{backgroundColor: '#f5f5f5'}} className="text-[#111111] font-poppins flex flex-col relative min-h-screen selection:bg-[#fcdb00] selection:text-[#111111]">
      {datosDeProductos && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(datosDeProductos) }}
        />
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
          will-change: opacity, transform;
        }
        .reveal-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 85s linear infinite;
          will-change: transform;
        }

        /* --- ANIMACIÓN SHIMMER MEJORADA --- */
        @keyframes shimmerFull {
          0% { transform: translateX(-200px) skewX(-20deg); }
          100% { transform: translateX(500px) skewX(-20deg); }
        }
        .animate-shimmer-sweep {
          animation: shimmerFull 3s infinite linear;
        }

        .community-section-bleed {
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
          background: transparent;
        }

        .community-desktop-rail {
          scroll-behavior: smooth;
          overscroll-behavior-x: contain;
        }

        .community-card-enter {
          animation: communityCardIn 0.7s cubic-bezier(0.22, 0.82, 0.32, 1) both;
        }

        @keyframes communityCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.985); filter: blur(3px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        @media (hover: hover) and (pointer: fine) {
          .community-desktop-rail:hover [data-community-card] {
            opacity: 0.78;
            filter: saturate(0.92);
          }
          .community-desktop-rail:hover [data-community-card]:hover {
            opacity: 1;
            filter: saturate(1.05);
          }
          .community-card-depth {
            transition: transform 0.45s cubic-bezier(0.22, 0.82, 0.32, 1);
          }
          [data-community-card]:hover .community-card-depth {
            transform: perspective(1600px) rotateX(1.1deg) rotateY(-1deg) translateY(-2px) scale(1.01);
          }
        }



        /* Community limpio: las cards quedan directas sobre el fondo del inicio */
        .community-clean-section,
        .community-rail-shell,
        .community-desktop-rail {
          background: transparent !important;
          background-color: transparent !important;
          box-shadow: none !important;
          border: 0 !important;
          outline: 0 !important;
        }

        .community-clean-section::before,
        .community-clean-section::after,
        .community-rail-shell::before,
        .community-rail-shell::after,
        .community-desktop-rail::before,
        .community-desktop-rail::after {
          content: none !important;
          display: none !important;
          background: transparent !important;
          box-shadow: none !important;
          border: 0 !important;
        }

        .community-desktop-rail {
          isolation: isolate;
          overflow-y: visible !important;
        }

        /* Fullscreen: evitar que el video vertical se recorte en PC */
        video:fullscreen {
          object-fit: contain !important;
          width: 100vw !important;
          height: 100vh !important;
          background: #000 !important;
        }
        video:-webkit-full-screen {
          object-fit: contain !important;
          width: 100vw !important;
          height: 100vh !important;
          background: #000 !important;
        }

        /* --- SOLUCIÓN AL ZOOM MOLESTO EN CELULARES --- */
        @media screen and (max-width: 768px) {
          input, select, textarea {
            font-size: 16px !important;
          }
        }

        /* ===== ANIMACIONES PREMIUM ===== */

        /* Cart scrollbar */
        .cart-scroll { overscroll-behavior: contain; }
        .cart-scroll::-webkit-scrollbar { width: 6px; }
        .cart-scroll::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 99px; }
        .cart-scroll::-webkit-scrollbar-thumb { background: #9ca3af; border-radius: 99px; }
        .cart-scroll::-webkit-scrollbar-thumb:hover { background: #6b7280; }
        .checkout-grid { display: flex; flex-direction: column; align-items: stretch; }
        @media (min-width: 768px) {
          .checkout-grid { display: grid; grid-template-columns: 65% 35%; height: 100%; align-items: start; }
          .checkout-left { height: 100%; overflow-y: auto; }
          .checkout-right { height: calc(100vh - 73px); }
        }
        @media (max-width: 767px) {
          .checkout-total { position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; }
        }

        /* Upsell carousel slide */
        @keyframes upsellEnter {
          from { transform: translateX(105%); }
          to   { transform: translateX(0); }
        }
        @keyframes upsellExit {
          from { transform: translateX(0); }
          to   { transform: translateX(-105%); }
        }
        .upsell-enter {
          animation: upsellEnter 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .upsell-exit {
          animation: upsellExit 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
          position: absolute;
          top: 0; left: 1rem; right: 1rem;
        }

        /* Logo bar float: sólo se mueve, el color/opacidad queda fijo siempre
           (antes bajaba a 0.7 de opacidad y volvía a 1, y se notaba como un
           cambio de color entre gris y color fuerte). */
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        .logo-float {
          opacity: 1;
          animation: logoFloat 10s ease-in-out infinite;
        }

        /* Ken Burns: hero image slow zoom-out */
        @keyframes kenBurns {
          from { transform: scale(1.09) translateY(-2%); }
          to   { transform: scale(1)    translateY(0); }
        }
        .animate-ken-burns {
          animation: kenBurns 14s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }

        /* View enter: suave fade+slide al cambiar de vista */
        @keyframes fadeInView {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-view-enter {
          animation: fadeInView 0.55s cubic-bezier(0.22, 0.82, 0.32, 1) both;
        }

        /* Badge pop: rebota al agregar al carrito */
        @keyframes badgePop {
          0%   { transform: scale(1); }
          28%  { transform: scale(1.55); }
          55%  { transform: scale(0.82); }
          78%  { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        .animate-badge-pop {
          animation: badgePop 0.5s cubic-bezier(0.22, 0.82, 0.32, 1);
        }

        /* Dropdown nav: entrada suave hacia abajo */
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.18s ease-out both;
        }

        /* Bounce-in: entrada de dept cards */
        @keyframes bounceIn {
          0%   { opacity: 0; transform: scale(0.68) translateY(22px); }
          55%  { opacity: 1; transform: scale(1.07) translateY(-5px); }
          78%  { transform: scale(0.96) translateY(2px); }
          100% { transform: scale(1) translateY(0); }
        }
        .animate-bounce-in {
          animation: bounceIn 0.72s cubic-bezier(0.22, 0.82, 0.32, 1) both;
        }

        /* Stagger delays para dept cards */
        .stagger-0  { animation-delay:   0ms; }
        .stagger-1  { animation-delay:  65ms; }
        .stagger-2  { animation-delay: 130ms; }
        .stagger-3  { animation-delay: 195ms; }
        .stagger-4  { animation-delay: 260ms; }
        .stagger-5  { animation-delay: 325ms; }
        .stagger-6  { animation-delay: 390ms; }
        .stagger-7  { animation-delay: 455ms; }
        .stagger-8  { animation-delay: 520ms; }
        .stagger-9  { animation-delay: 585ms; }

        /* Shimmer sweep en hover de product cards */
        @keyframes cardShimmerAnim {
          from { transform: translateX(-120%) skewX(-14deg); }
          to   { transform: translateX(220%)  skewX(-14deg); }
        }
        .card-shimmer {
          overflow: hidden;
        }
        .card-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.045) 50%,
            transparent 100%
          );
          transform: translateX(-120%) skewX(-14deg);
          pointer-events: none;
          z-index: 2;
        }
        .card-shimmer:hover::after {
          animation: cardShimmerAnim 0.7s ease-out forwards;
        }

        /* Price glow: pulseo suave en precio amarillo */
        @keyframes priceGlow {
          0%, 100% { text-shadow: 0 0 8px rgba(252,219,0,0.12); }
          50%       { text-shadow: 0 0 18px rgba(252,219,0,0.45), 0 0 36px rgba(252,219,0,0.18); }
        }
        .animate-price-glow {
          animation: priceGlow 3.2s ease-in-out infinite;
        }

        /* CTA glow: glow pulse en botón comprar */
        @keyframes ctaGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(252,219,0,0); }
          50%       { box-shadow: 0 4px 24px 2px rgba(252,219,0,0.18); }
        }
        .animate-cta-glow {
          animation: ctaGlow 2.8s ease-in-out infinite;
        }

        /* WhatsApp ring pulse */
        @keyframes waRing {
          0%   { transform: scale(1);   opacity: 0.55; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        .wa-ring-1 { animation: waRing 2s ease-out infinite; }
        .wa-ring-2 { animation: waRing 2s ease-out 0.75s infinite; }

        /* Reveal-title: slide from left (override del reveal-on-scroll vertical) */
        .reveal-title {
          transform: translateX(-22px) !important;
          opacity: 0 !important;
          transition: opacity 0.75s cubic-bezier(0.22, 0.82, 0.32, 1),
                      transform 0.75s cubic-bezier(0.22, 0.82, 0.32, 1) !important;
        }
        .reveal-title.is-visible {
          opacity: 1 !important;
          transform: translateX(0) !important;
        }

        /* Hover icon bounce en dept cards */
        @keyframes iconBounce {
          0%, 100% { transform: scale(1) rotate(0deg); }
          40%       { transform: scale(1.2) rotate(-6deg); }
          70%       { transform: scale(0.94) rotate(3deg); }
        }
        .group:hover .icon-bounce {
          animation: iconBounce 0.55s cubic-bezier(0.22, 0.82, 0.32, 1);
        }

        /* Gradient bottom fade en hero */
        .hero-gradient-bottom {
          background: linear-gradient(to top, #f5f5f5 0%, rgba(245,245,245,0.35) 40%, transparent 100%);
        }

        /* Underline slide-in para nav links activos */
        @keyframes underlineSlide {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}} />

      {/* --- HEADER PRINCIPAL --- */}
      {/* BARRA SUPERIOR */}
      <div className="hidden md:block w-full bg-[#050505] border-b border-white/[0.06] relative z-[60]">
        <div className="w-full px-4 md:px-8 h-8 flex items-center justify-between">

          {/* Izquierda: Login */}
          {user && !user.isAnonymous ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">{(dbUser?.name || user.displayName)?.split(' ')[0]}</span>
            </div>
          ) : (
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); setShowAuthModal(true); }}
              className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <i className="fas fa-user text-[9px]"></i> Registrate / Login
            </button>
          )}

          {/* Derecha: Buscar tienda + Ayuda */}
          <div className="flex items-center gap-6">
            <Link
              href="/envios" prefetch={false} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <i className="fas fa-store text-[9px]"></i> Buscar tienda
            </Link>

            <div className="relative" onMouseEnter={() => setShowAyudaMenu(true)} onMouseLeave={() => setShowAyudaMenu(false)}>
              <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                <i className="fas fa-question-circle text-[9px]"></i> Ayuda
                <i className={`fas fa-chevron-down text-[8px] transition-transform duration-200 ${showAyudaMenu ? 'rotate-180' : ''}`}></i>
              </button>
              {showAyudaMenu && (
                <div className="absolute right-0 top-full mt-1 bg-[#050505] border border-white/10 rounded-xl shadow-lg py-2 w-52 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <a
                    href={`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent('Hola! Necesito ayuda con mi pedido en 028 Import 👋')}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <i className="fab fa-whatsapp text-[#25D366]"></i> Contactar por WhatsApp
                  </a>
                  <Link
                    href="/envios" prefetch={false} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <i className="fas fa-truck text-gray-500"></i> Envíos y entregas
                  </Link>
                  <Link
                    href="/arrepentimiento" prefetch={false} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <i className="fas fa-undo text-gray-500"></i> Arrepentimiento
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <header className={`text-white h-[72px] sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 border-b transition-all duration-500 ${headerScrolled ? 'bg-[#050505]/95 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.9)] border-white/[0.1]' : 'bg-[#050505] shadow-lg border-white/[0.06]'}`}>
        <div className="flex items-center gap-4">
          {/* carrito — solo móvil, lado izquierdo */}
          <button onClick={() => openCart()} className="relative p-2 hover:text-[#fcdb00] transition-colors md:hidden">
            <i className="fas fa-shopping-bag text-2xl" aria-hidden="true"></i>
            <span className="sr-only">Abrir carrito</span>
            {getTotalItems() > 0 && (
              <span key={getTotalItems()} className="absolute top-1.5 -right-1 bg-[#fcdb00] text-[#111111] text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg border border-[#111111] animate-badge-pop">
                {getTotalItems()}
              </span>
            )}
          </button>

          {/* Enlace de verdad: antes sólo cambiaba la vista, y desde una ficha de
              producto o una marca no hacía nada porque ahí no hay vista que cambiar. */}
          <Link href="/" aria-label="Ir al inicio" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center gap-3 cursor-pointer group">
            <img src={CONFIG.logoImage} alt="Logo" className="h-10 w-auto object-contain group-hover:scale-105 transition-transform" />
          </Link>

          <div className="hidden md:flex items-center gap-6 ml-8 font-poppins text-xs font-bold uppercase tracking-widest">
            <Link href="/" className={`transition-colors ${modo === 'inicio' && currentView === 'home' ? 'text-[#fcdb00]' : 'text-gray-300 hover:text-white'}`}>Inicio</Link>
            <button onClick={() => setShowShippingCalculatorModal(true)} className="bg-white/10 text-white px-4 py-2 rounded-full hover:bg-[#fcdb00] hover:text-[#111111] transition-all flex items-center gap-2"><i className="fas fa-motorcycle text-sm"></i> Calcular Envío</button>
          </div>
        </div>

        {/* Departamentos centrados — solo desktop */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 font-poppins text-xs font-bold uppercase tracking-widest">
          {departments.map(dept => (
            <div key={dept} className="relative" onMouseEnter={() => setHoveredNavDept(dept)} onMouseLeave={() => setHoveredNavDept(null)}>
              <Link href={`/${aSlug(dept)}`} prefetch={false} className={`relative block pb-1 transition-all duration-200 ${hoveredNavDept === dept ? 'text-white scale-[1.12]' : currentView === 'catalog' && filterDepts.includes(dept) ? 'text-[#fcdb00]' : 'text-gray-400'}`}>
                {dept}
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-[#fcdb00] transition-all duration-200 ${hoveredNavDept === dept ? 'opacity-100' : 'opacity-0'}`} />
              </Link>
              {hoveredNavDept === dept && brandsByDept[dept]?.length > 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 min-w-[240px] z-50" style={{filter:'none'}}>
                <div className="bg-[#111111] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in-down">
                  <div className="px-5 py-3 border-b border-white/10">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Marcas en {dept}</span>
                  </div>
                  {brandsByDept[dept].map(brand => (
                    <Link key={brand} href={`/${aSlug(dept)}/${aSlug(brand)}`} prefetch={false} onClick={() => setHoveredNavDept(null)} className="block w-full text-left px-5 py-3.5 text-[12px] text-gray-300 hover:bg-[#fcdb00] hover:text-[#111111] transition-colors tracking-widest normal-case font-bold font-poppins">
                      {brand}
                    </Link>
                  ))}
                </div>
                </div>
              )}
            </div>
          ))}
          <Link href="/catalogo" prefetch={false} className={`relative block pb-1 transition-all duration-200 ${currentView === 'catalog' && filterDepts.length === 0 ? 'text-[#fcdb00]' : 'text-gray-400 hover:text-white'}`}>
            CATÁLOGO
            <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-[#fcdb00] transition-all duration-200 ${currentView === 'catalog' && filterDepts.length === 0 ? 'opacity-100' : 'opacity-0'}`} />
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* carrito — solo desktop, lado derecho */}
          <button onClick={() => openCart()} className="relative p-2 hover:text-[#fcdb00] transition-colors hidden md:flex">
            <i className="fas fa-shopping-bag text-2xl" aria-hidden="true"></i>
            <span className="sr-only">Abrir carrito</span>
            {getTotalItems() > 0 && (
              <span key={getTotalItems()} className="absolute top-1.5 -right-1 bg-[#fcdb00] text-[#111111] text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg border border-[#111111] animate-badge-pop">
                {getTotalItems()}
              </span>
            )}
          </button>
          {/* hamburguesa — solo móvil, lado derecho */}
          <button onClick={() => setIsMenuOpen(true)} className="text-2xl hover:text-[#fcdb00] transition-colors p-2 md:hidden">
            <i className="fas fa-bars" aria-hidden="true"></i>
            <span className="sr-only">Abrir menú</span>
          </button>
        </div>
      </header>

      {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[300] bg-[#111111]/90 backdrop-blur-xl text-white px-6 py-4 rounded-full shadow-[0_20px_40px_rgba(252,219,0,0.2)] border border-[#fcdb00]/30 font-bold text-xs uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300">
              {toastMessage}
          </div>
      )}
      
      {fomoData && (
        <div className="fixed bottom-24 left-4 md:bottom-8 md:left-8 z-[100] bg-[#111111]/95 backdrop-blur-md text-white p-3 md:p-4 rounded-2xl shadow-[0_8px_32px_rgba(252,219,0,0.12)] border border-[#fcdb00]/30 flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-500 hover:scale-105 hover:shadow-[0_8px_40px_rgba(252,219,0,0.22)] transition-all cursor-default">
          <div className="w-10 h-10 bg-[#fcdb00] rounded-full flex items-center justify-center text-[#111111] text-lg shadow-inner animate-cta-glow"><i className="fas fa-fire"></i></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-poppins">¡Venta en Vivo!</span>
            <span className="font-bebas text-lg md:text-xl tracking-wide uppercase leading-none mt-0.5 text-[#fcdb00]">
                <span className="text-white">{fomoData.name}</span> compró {fomoData.product}
            </span>
          </div>
        </div>
      )}

      {/* --- MENÚ MÓVIL (3 RAYITAS) --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="w-[88%] max-w-[360px] bg-white h-full relative z-10 animate-in slide-in-from-right duration-300 flex flex-col shadow-2xl">

            {/* X fija arriba a la derecha */}
            <button onClick={() => setIsMenuOpen(false)} className="absolute top-5 right-4 z-20 w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-[#111111] active:bg-gray-200 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="1" y1="1" x2="15" y2="15" stroke="#111111" strokeWidth="2" strokeLinecap="round"/>
                <line x1="15" y1="1" x2="1" y2="15" stroke="#111111" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* CONTENIDO SCROLLEABLE (todo junto) */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 pb-10">

                {/* HEADER con logo */}
                <div className="pt-6 pb-4 flex items-center justify-center border-b border-gray-300 mb-2">
                  <img src={CONFIG.logoImage} alt="028" className="h-14 w-auto object-contain" />
                </div>

                {/* USUARIO */}
                <div className="py-2">
              {!user || user.isAnonymous ? (
                <button
                  onClick={() => { setAuthMode('login'); setAuthError(''); setShowAuthModal(true); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 py-2 active:opacity-60 transition-opacity"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-user text-gray-400 text-sm"></i>
                  </div>
                  <div className="text-left">
                    <p className="text-[#111111] font-medium text-sm">Iniciá sesión</p>
                    <p className="text-gray-400 text-[11px]">o creá tu cuenta</p>
                  </div>
                  <i className="fas fa-chevron-right text-gray-500 ml-auto text-xs"></i>
                </button>
              ) : (
                <div className="flex items-center gap-3 py-1">
                  <span style={{display:'inline-block', overflow:'hidden', height:'22px', width:'23px', verticalAlign:'middle'}}><i className="far fa-user text-2xl text-[#111111]" style={{display:'block', lineHeight:'1'}}></i></span>
                  <p className="text-[#111111] font-bold text-base translate-y-1">{(dbUser?.name || user.displayName)?.split(' ')[0]}!</p>
                </div>
              )}
                </div>

                {/* Nav principal */}
                <div className="py-2">
                  <Link
                    href="/catalogo"
                    prefetch={false}
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-left py-3.5 text-base text-[#111111] flex items-center justify-between active:opacity-60 transition-opacity border-b border-gray-100" style={{fontWeight:510}}
                  >
                    Catálogo Completo <i className="fas fa-arrow-right text-gray-300 text-sm"></i>
                  </Link>

                  {departments.map(dept => {
                    const isExpanded = expandedDept === dept;
                    const deptCats = brandsByDept[dept] || [];
                    return (
                      <div key={dept} className="border-b border-gray-100">
                        <button
                          onClick={() => setExpandedDept(isExpanded ? null : dept)}
                          className="w-full text-left py-3.5 text-base text-[#111111] flex items-center justify-between active:opacity-60 transition-opacity" style={{fontWeight:510}}
                        >
                          {dept}
                          <i className={`fas fa-chevron-down text-gray-500 text-sm transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="pb-3 flex flex-col gap-0.5">
                            <Link
                              href={`/${aSlug(dept)}`}
                              prefetch={false}
                              onClick={() => setIsMenuOpen(false)}
                              className="text-left py-2 pl-4 text-sm font-medium text-[#111111] active:opacity-60 transition-opacity"
                            >
                              Ver todo en {dept}
                            </Link>
                            {deptCats.map(cat => (
                              <Link
                                key={cat}
                                href={`/${aSlug(dept)}/${aSlug(cat)}`}
                                prefetch={false}
                                onClick={() => setIsMenuOpen(false)}
                                className="text-left py-2 pl-4 text-sm font-medium text-[#111111] active:opacity-60 transition-opacity"
                              >
                                {cat}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CTA Calcular Envío */}
                <button
                  onClick={() => { setShowShippingCalculatorModal(true); setIsMenuOpen(false); }}
                  className="w-full bg-[#fcdb00] text-[#111111] py-3.5 px-4 rounded-2xl font-semibold uppercase text-xs mt-4 mb-2 active:brightness-90 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <i className="fas fa-motorcycle"></i> Calcular Envío
                </button>

                {/* Info */}
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 font-poppins mt-20 mb-1">Información</p>
                <div className="flex flex-col">
                  {[
                    { label: 'Quiénes Somos',            icon: 'fa-store',           destino: '/nosotros' },
                    { label: 'Envíos y Logística',        icon: 'fa-motorcycle',      destino: '/envios' },
                    { label: 'Medios de Pago',            icon: 'fa-credit-card',     destino: '/pagos' },
                    { label: 'Legales y Términos',        icon: 'fa-file-contract',   destino: '/terminos' },
                    { label: 'Botón de Arrepentimiento',  icon: 'fa-rotate-left',     destino: '/arrepentimiento' },
                  ].map(item => (
                    <Link key={item.label} href={item.destino} prefetch={false} onClick={() => setIsMenuOpen(false)} className="text-left py-3 text-sm font-normal text-[#111111] border-b border-gray-100 active:opacity-60 transition-opacity last:border-0 flex items-center gap-3">
                      <i className={`fas ${item.icon} text-gray-600 text-sm w-4 text-center`}></i>
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Redes */}
                <div className="pt-6 flex items-center gap-3">
                  <a href="https://www.tiktok.com/@028.import" target="_blank" rel="noreferrer" aria-label="TikTok" className="flex-1 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-[#111111] active:bg-[#fcdb00] transition-all">
                    <i className="fab fa-tiktok text-lg"></i>
                  </a>
                  <a href="https://www.instagram.com/028.import" target="_blank" rel="noreferrer" aria-label="Instagram" className="flex-1 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-[#111111] active:bg-[#fcdb00] transition-all">
                    <i className="fab fa-instagram text-lg"></i>
                  </a>
                  <a href={`https://wa.me/${CONFIG.whatsappNumber}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="flex-1 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-[#111111] active:bg-[#25D366] active:text-white transition-all">
                    <i className="fab fa-whatsapp text-lg"></i>
                  </a>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- INICIO CONTENIDO --- */}
      {/* Sólo en la portada. En las demás páginas ni se dibuja: así el marquee queda
          únicamente acá y esas páginas no cargan de más. */}
      {modo === 'inicio' && (
      <div style={{ display: currentView === 'home' ? '' : 'none' }}>
          <div className="w-full bg-[#111111] h-8 overflow-hidden m-0 p-0 border-b border-white/10 relative z-30 flex items-center">
            <div className="animate-marquee whitespace-nowrap flex items-center">
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{color: '#f5d000'}} className="font-bebas flex items-center gap-8 px-4 font-bold italic text-[13px] md:text-[15px] tracking-widest uppercase">
                  <span> ENVIOS 24HS CABA/AMBA </span><span style={{color: '#787878'}}>•</span>
                  <span> 028 IMPORT </span><span style={{color: '#787878'}}>•</span>
                  <span> DESCUENTOS ABONANDO EN EFECTIVO </span><span style={{color: '#787878'}}>•</span>
                  <span> PEDIME TE LLEGA EN 30'</span><span style={{color: '#787878'}}>•</span>
                </div>
              ))}
            </div>
          </div>
          <h1 className="sr-only">028 Import — Vapes y tecnología con envío en 30 minutos por CABA y AMBA</h1>
          <div className="relative w-full h-[230px] md:h-[475px] overflow-hidden">
            <Image
              src="/banner-original.webp"
              alt="Banner 028 Import"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          {vape3dPosition === 'banner' && <LazyVapeSpecs3D />}
          <main className="flex-grow px-4 md:px-10 lg:px-20 xl:px-32 pt-10 w-full min-h-[50vh] pb-8 md:pb-16 animate-view-enter">
            <div className="mb-16 hidden">
              <h3 className="font-bebas text-2xl text-[#111111] mb-4 pl-2 reveal-title reveal-on-scroll hidden"></h3>
              <HorizontalScroll className="flex overflow-x-auto gap-2 md:gap-3 no-scrollbar pb-6 snap-x mask-image-gradient pr-8">
                {virtualDepts.map((vd, i) => (
                  <Link key={`vd-${vd.name}`} href="/catalogo" prefetch={false} className={`animate-bounce-in stagger-${Math.min(i, 9)} snap-start flex-shrink-0 w-32 h-32 md:w-44 md:h-44 bg-gray-50 backdrop-blur-xl rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-200 flex flex-col items-center justify-center gap-4 cursor-pointer hover:scale-105 hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] hover:border-[#fcdb00]/60 transition-all duration-500 group`}>
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden group-hover:bg-[#fcdb00] transition-colors">
                      {vd.icon?.startsWith('http') ? <img src={vd.icon} alt={vd.name} className="w-9 h-9 md:w-10 md:h-10 object-contain icon-bounce" /> : <i className={`fas ${vd.icon || 'fa-store'} text-2xl md:text-3xl text-[#111111] group-hover:text-[#111111] icon-bounce`}></i>}
                    </div>
                    <span className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-center px-2 text-[#111111]/70 group-hover:text-[#111111] transition-colors font-poppins">{vd.name}</span>
                  </Link>
                ))}
                {departments.map((dept, i) => {
                  const iconId = deptIcons[dept] || 'fa-box';
                  const iconObj = DEPT_ICONS.find(ic => ic.id === iconId) || { id: 'fa-box', prefix: 'fas' };
                  const staggerIdx = Math.min(virtualDepts.length + i, 9);
                  return (
                  <Link key={dept} href={`/${aSlug(dept)}`} prefetch={false} className={`animate-bounce-in stagger-${staggerIdx} snap-start flex-shrink-0 w-32 h-32 md:w-44 md:h-44 bg-gray-50 backdrop-blur-xl rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-200 flex flex-col items-center justify-center gap-4 cursor-pointer hover:scale-105 hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] hover:border-[#fcdb00]/60 transition-all duration-500 group`}>
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center text-[#111111] text-2xl md:text-3xl group-hover:bg-[#fcdb00] group-hover:text-[#111111] transition-colors"><i className={`${iconObj.prefix} ${iconObj.id} icon-bounce`}></i></div>
                    <span className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-center px-2 text-[#111111]/70 group-hover:text-[#111111] transition-colors font-poppins">{dept}</span>
                  </Link>
                )})}
              </HorizontalScroll>
            </div>
            {renderOrderedHomeBlocks()}
            {renderOpinionesSection()}
          </main>
      </div>
      )}

      {modo !== 'contenido' && modo !== 'checkout' && currentView === 'catalog' && (
        <>
          {/* Barra de filtros */}
          <div className="bg-white/90 backdrop-blur-2xl z-40 border-b border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] sticky top-[72px]">
            <div className="px-4 md:px-10 lg:px-20 xl:px-32">
              <div className="flex items-center gap-3 pt-3 pb-1">
                <Link href="/" className="text-gray-500 hover:text-[#111111] text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5"><i className="fas fa-home"></i> Inicio</Link>
                <span className="text-gray-400 text-[10px]"><i className="fas fa-chevron-right"></i></span>
                <span className="text-[#111111] font-bold uppercase tracking-widest text-[10px]">CATÁLOGO COMPLETO</span>
              </div>
              <div className="flex items-center justify-between py-3 gap-3">
                <span className="text-[11px] text-gray-500 font-poppins font-medium flex-shrink-0">{catalogProducts.length} producto{catalogProducts.length !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-2">
                  <div className="relative" ref={sortDropdownRef}>
                    <button onClick={() => setShowSortDropdown(v => !v)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-[11px] font-bold text-[#111111] hover:border-gray-300 transition-all font-poppins">
                      Ordenar <i className={`fas fa-chevron-${showSortDropdown ? 'up' : 'down'} text-[8px]`}></i>
                    </button>
                    {showSortDropdown && (
                      <div className="absolute top-full mt-2 right-0 w-52 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                        {[{id:'relevante',label:'Más relevante'},{id:'reciente',label:'Más reciente'},{id:'mayor_precio',label:'Mayor precio'},{id:'menor_precio',label:'Menor precio'}].map(opt => (
                          <button key={opt.id} onClick={() => { setSortBy(opt.id); setShowSortDropdown(false); }} className={`w-full text-left px-5 py-3.5 text-[11px] font-bold font-poppins transition-colors flex items-center justify-between ${sortBy === opt.id ? 'bg-[#fcdb00] text-[#111111]' : 'hover:bg-gray-50 text-[#111111]/70'}`}>
                            {opt.label}{sortBy === opt.id && <i className="fas fa-check text-[#111111]"></i>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={openFilterDrawer} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all font-poppins border ${activeFilterCount > 0 ? 'bg-[#fcdb00] text-[#111111] border-[#fcdb00]' : 'bg-gray-100 border-gray-200 text-[#111111] hover:border-gray-300'}`}>
                    <i className="fas fa-sliders-h text-[10px]"></i> Filtrar{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Productos */}
          <main className="flex-grow px-4 md:px-10 lg:px-20 xl:px-32 py-10 w-full min-h-[50vh] pb-8 md:pb-16 animate-view-enter">
            {catalogProducts.length === 0 && (
              <div className="text-center py-24 bg-gray-50 backdrop-blur-xl rounded-[2rem] border border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"><i className="fas fa-ghost text-3xl text-gray-500"></i></div>
                <h3 className="text-3xl font-bebas uppercase tracking-wide text-[#111111] mb-2">No encontramos nada</h3>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-poppins">Intentá con otros filtros o buscá otra cosa.</p>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {catalogProducts.map((p, index) => renderProductCard(p, index, false, 'vertical'))}
            </div>
          </main>

          {showSortDropdown && <div className="fixed inset-0 z-[39]" onClick={() => setShowSortDropdown(false)} />}

          {/* Drawer de filtros */}
          {showFilterDrawer && (
            <>
              <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm" onClick={() => setShowFilterDrawer(false)} />
              <div className="fixed right-0 top-0 bottom-0 z-[100] w-full max-w-sm bg-[#111111] flex flex-col shadow-2xl border-l border-white/10">
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 flex-shrink-0">
                  <h2 className="text-2xl font-bebas uppercase tracking-wide text-white">Filtros</h2>
                  <button onClick={() => setShowFilterDrawer(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"><i className="fas fa-times"></i></button>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">

                  {/* Gustos */}
                  <div>
                    <button onClick={() => setExpandedFilterSection(expandedFilterSection === 'gustos' ? null : 'gustos')} className="w-full flex items-center justify-between px-6 py-4">
                      <span className="text-[12px] font-bold uppercase tracking-widest text-white font-poppins flex items-center gap-2">Gustos{pendingFlavors.length > 0 && <span className="text-[9px] bg-[#fcdb00] text-[#111111] rounded-full w-4 h-4 flex items-center justify-center">{pendingFlavors.length}</span>}</span>
                      <i className={`fas fa-chevron-${expandedFilterSection === 'gustos' ? 'up' : 'down'} text-[10px] text-gray-500`}></i>
                    </button>
                    {expandedFilterSection === 'gustos' && (
                      <div className="px-6 pb-5 grid grid-cols-2 gap-2">
                        {FLAVOR_OPTIONS.map(flavor => { const sel = pendingFlavors.includes(flavor); return (
                          <button key={flavor} onClick={() => setPendingFlavors(prev => sel ? prev.filter(f => f !== flavor) : [...prev, flavor])} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left ${sel ? 'bg-[#fcdb00] border-[#fcdb00] text-[#111111]' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${sel ? 'bg-[#111111]' : 'border border-white/20'}`}>{sel && <i className="fas fa-check text-[#fcdb00] text-[8px]"></i>}</div>
                            <span className="text-[10px] font-bold uppercase tracking-widest font-poppins">{flavor}</span>
                          </button>
                        );})}
                      </div>
                    )}
                  </div>

                  {/* Marcas */}
                  <div>
                    <button onClick={() => setExpandedFilterSection(expandedFilterSection === 'marcas' ? null : 'marcas')} className="w-full flex items-center justify-between px-6 py-4">
                      <span className="text-[12px] font-bold uppercase tracking-widest text-white font-poppins flex items-center gap-2">Marcas{pendingBrands.length > 0 && <span className="text-[9px] bg-[#fcdb00] text-[#111111] rounded-full w-4 h-4 flex items-center justify-center">{pendingBrands.length}</span>}</span>
                      <i className={`fas fa-chevron-${expandedFilterSection === 'marcas' ? 'up' : 'down'} text-[10px] text-gray-500`}></i>
                    </button>
                    {expandedFilterSection === 'marcas' && (
                      <div className="px-6 pb-5 flex flex-col gap-0.5">
                        {allUniqueCategories.map(cat => { const sel = pendingBrands.includes(cat); return (
                          <button key={cat} onClick={() => setPendingBrands(prev => sel ? prev.filter(c => c !== cat) : [...prev, cat])} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${sel ? 'bg-[#fcdb00] border-[#fcdb00] text-[#111111]' : 'border-transparent text-gray-400 hover:bg-white/5'}`}>
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${sel ? 'bg-[#111111]' : 'border border-white/20'}`}>{sel && <i className="fas fa-check text-[#fcdb00] text-[8px]"></i>}</div>
                            <span className="text-[11px] font-bold uppercase tracking-widest font-poppins">{cat}</span>
                          </button>
                        );})}
                      </div>
                    )}
                  </div>

                  {/* Tipo de producto */}
                  <div>
                    <button onClick={() => setExpandedFilterSection(expandedFilterSection === 'tipo' ? null : 'tipo')} className="w-full flex items-center justify-between px-6 py-4">
                      <span className="text-[12px] font-bold uppercase tracking-widest text-white font-poppins flex items-center gap-2">Tipo de producto{pendingDepts.length > 0 && <span className="text-[9px] bg-[#fcdb00] text-[#111111] rounded-full w-4 h-4 flex items-center justify-center">{pendingDepts.length}</span>}</span>
                      <i className={`fas fa-chevron-${expandedFilterSection === 'tipo' ? 'up' : 'down'} text-[10px] text-gray-500`}></i>
                    </button>
                    {expandedFilterSection === 'tipo' && (
                      <div className="px-6 pb-5 flex flex-col gap-0.5">
                        {allDepartments.map(dept => { const sel = pendingDepts.includes(dept); return (
                          <button key={dept} onClick={() => setPendingDepts(prev => sel ? prev.filter(d => d !== dept) : [...prev, dept])} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${sel ? 'bg-[#fcdb00] border-[#fcdb00] text-[#111111]' : 'border-transparent text-gray-400 hover:bg-white/5'}`}>
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${sel ? 'bg-[#111111]' : 'border border-white/20'}`}>{sel && <i className="fas fa-check text-[#fcdb00] text-[8px]"></i>}</div>
                            <span className="text-[11px] font-bold uppercase tracking-widest font-poppins">{dept}</span>
                          </button>
                        );})}
                      </div>
                    )}
                  </div>

                  {/* Puff */}
                  {uniquePuffs.length > 0 && (
                    <div>
                      <button onClick={() => setExpandedFilterSection(expandedFilterSection === 'puff' ? null : 'puff')} className="w-full flex items-center justify-between px-6 py-4">
                        <span className="text-[12px] font-bold uppercase tracking-widest text-white font-poppins flex items-center gap-2">Puff{pendingPuffs.length > 0 && <span className="text-[9px] bg-[#fcdb00] text-[#111111] rounded-full w-4 h-4 flex items-center justify-center">{pendingPuffs.length}</span>}</span>
                        <i className={`fas fa-chevron-${expandedFilterSection === 'puff' ? 'up' : 'down'} text-[10px] text-gray-500`}></i>
                      </button>
                      {expandedFilterSection === 'puff' && (
                        <div className="px-6 pb-5 flex flex-col gap-0.5">
                          {uniquePuffs.map(puff => { const sel = pendingPuffs.includes(puff); return (
                            <button key={puff} onClick={() => setPendingPuffs(prev => sel ? prev.filter(p => p !== puff) : [...prev, puff])} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${sel ? 'bg-[#fcdb00] border-[#fcdb00] text-[#111111]' : 'border-transparent text-gray-400 hover:bg-white/5'}`}>
                              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${sel ? 'bg-[#111111]' : 'border border-white/20'}`}>{sel && <i className="fas fa-check text-[#fcdb00] text-[8px]"></i>}</div>
                              <span className="text-[11px] font-bold uppercase tracking-widest font-poppins">{Number(puff).toLocaleString('es-AR')} puffs</span>
                            </button>
                          );})}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Precio */}
                  <div>
                    <button onClick={() => setExpandedFilterSection(expandedFilterSection === 'precio' ? null : 'precio')} className="w-full flex items-center justify-between px-6 py-4">
                      <span className="text-[12px] font-bold uppercase tracking-widest text-white font-poppins">Precio</span>
                      <i className={`fas fa-chevron-${expandedFilterSection === 'precio' ? 'up' : 'down'} text-[10px] text-gray-500`}></i>
                    </button>
                    {expandedFilterSection === 'precio' && (
                      <div className="px-6 pb-6">
                        <div className="flex justify-between mb-4">
                          <span className="text-[13px] font-bold font-poppins text-white">${formatPrice(pendingPriceRange[0])}</span>
                          <span className="text-[13px] font-bold font-poppins text-white">${formatPrice(pendingPriceRange[1])}</span>
                        </div>
                        <div className="relative flex items-center h-6">
                          <div className="absolute left-0 right-0 h-1 bg-white/20 rounded-full pointer-events-none">
                            <div className="absolute h-full bg-[#fcdb00] rounded-full" style={{left:`${((pendingPriceRange[0]-minPrice)/((maxPrice-minPrice)||1))*100}%`,right:`${100-((pendingPriceRange[1]-minPrice)/((maxPrice-minPrice)||1))*100}%`}} />
                          </div>
                          <input type="range" min={minPrice} max={maxPrice} step={Math.max(500,Math.floor((maxPrice-minPrice)/100))} value={pendingPriceRange[0]} onChange={(e) => { const v=Number(e.target.value); if(v<pendingPriceRange[1]) setPendingPriceRange([v,pendingPriceRange[1]]); }} className="absolute w-full appearance-none bg-transparent outline-none cursor-pointer [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#fcdb00] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#111111] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#fcdb00] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#111111] [&::-moz-range-track]:bg-transparent" />
                          <input type="range" min={minPrice} max={maxPrice} step={Math.max(500,Math.floor((maxPrice-minPrice)/100))} value={pendingPriceRange[1]} onChange={(e) => { const v=Number(e.target.value); if(v>pendingPriceRange[0]) setPendingPriceRange([pendingPriceRange[0],v]); }} className="absolute w-full appearance-none bg-transparent outline-none cursor-pointer [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#fcdb00] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#111111] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#fcdb00] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#111111] [&::-moz-range-track]:bg-transparent" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-white/10 flex gap-3 bg-[#111111] flex-shrink-0">
                  <button onClick={clearPendingFilters} className="flex-1 py-3.5 rounded-xl bg-white/10 text-white text-[11px] font-black uppercase tracking-widest font-poppins hover:bg-white/20 transition-colors">Limpiar</button>
                  <button onClick={applyFilters} className="flex-1 py-3.5 rounded-xl bg-[#111111] text-white text-[11px] font-black uppercase tracking-widest font-poppins hover:bg-[#333] transition-colors">Aplicar</button>
                </div>
              </div>
            </>
          )}
        </>
      )}
      {/* La página de turno: ficha de producto, departamento, marca o institucional.
          Va acá adentro para que comparta la barra, el carrito y el pie con la home. */}
      {modo === 'contenido' && (
        <div className="flex-grow">
          {children}
        </div>
      )}

      <footer className="block bg-[#111111] text-white pt-8 md:pt-12 pb-6 md:pb-8 mt-auto relative z-30 rounded-t-[2rem] overflow-hidden">
          <div className="max-w-7xl mx-auto px-5 md:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-6 mb-6 md:mb-10 text-xs md:text-sm">
                  <div className="space-y-6"><div className="flex items-center gap-3"><img src={CONFIG.logoImage} alt="028Import Logo" className="h-12 md:h-14 w-auto object-contain drop-shadow-[0_0_15px_rgba(252,219,0,0.25)]" /></div><p className="text-gray-400 font-medium leading-relaxed md:pr-4 font-poppins max-w-sm">Compra rápida, referencias reales y atención directa por WhatsApp.</p></div>
                  <div><h4 className="font-bebas text-[#fcdb00] text-xl md:text-2xl uppercase tracking-wider mb-4 md:mb-6">Contacto</h4><ul className="space-y-3 md:space-y-5 text-gray-300 font-poppins"><li className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#fcdb00]"><i className="fab fa-whatsapp text-lg"></i></div><span className="text-base font-bold tracking-wider">11 5341 2358</span></li></ul></div>
                  <div>
                    <h4 className="font-bebas text-[#fcdb00] text-xl md:text-2xl uppercase tracking-wider mb-4 md:mb-6">Información Legal</h4>
                    <ul className="space-y-3 md:space-y-4 text-gray-400 font-poppins font-medium">
                      <li><Link href="/nosotros" prefetch={false} className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-angle-right text-[#fcdb00] text-[10px]"></i> Quiénes Somos</Link></li>
                      <li><Link href="/envios" prefetch={false} className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-angle-right text-[#fcdb00] text-[10px]"></i> Logística de Envío</Link></li>
                      <li><Link href="/pagos" prefetch={false} className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-angle-right text-[#fcdb00] text-[10px]"></i> Medios de Pago</Link></li>
                      <li><Link href="/terminos" prefetch={false} className="hover:text-white transition-colors flex items-center gap-2 mt-4 pt-4 border-t border-white/10"><i className="fas fa-file-contract text-gray-600 text-[10px]"></i> Términos y Condiciones</Link></li>
                      <li><Link href="/privacidad" prefetch={false} className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-shield-alt text-gray-600 text-[10px]"></i> Política de Privacidad</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bebas text-[#fcdb00] text-xl md:text-2xl uppercase tracking-wider mb-4 md:mb-6">Nuestras Redes</h4>
                    <div className="flex gap-4">
                      <a href="https://www.tiktok.com/@028.import" target="_blank" rel="noreferrer" aria-label="TikTok" className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-[#fcdb00] hover:text-[#111111] transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(252,219,0,0.3)]"><i className="fab fa-tiktok text-2xl"></i></a>
                      <a href="https://www.instagram.com/028.import" target="_blank" rel="noreferrer" aria-label="Instagram" className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-[#fcdb00] hover:text-[#111111] transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(252,219,0,0.3)]"><i className="fab fa-instagram text-2xl"></i></a>
                      <a href={`https://wa.me/${CONFIG.whatsappNumber}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-[#25D366] hover:text-white transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(37,211,102,0.3)]"><i className="fab fa-whatsapp text-2xl"></i></a>
                    </div>
                  </div>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/10 pt-8 text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest text-center md:text-left gap-4 font-poppins">
                  <p>© {new Date().getFullYear()} 028IMPORT. Todos los derechos reservados.</p>
                  <div className="flex gap-4"><Link href="/arrepentimiento" prefetch={false} className="hover:text-white transition-colors underline underline-offset-4">Botón de Arrepentimiento</Link></div>
              </div>
          </div>
      </footer>


      {/* ===== DRAWER DEL CARRITO ===== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[120]">
          {/* Backdrop — cubre toda la pantalla, aparece instantáneo */}
          <div
            className="hidden md:block absolute inset-0 bg-black/50"
            onClick={() => closeCart()}
          />

          {/* Panel lateral */}
          <div
            className="absolute top-0 right-0 h-full w-full md:w-[460px] bg-white flex flex-col shadow-2xl z-10"
            style={{ transform: isCartVisible ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.18s ease-out' }}
          >

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <button onClick={() => closeCart()} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-[#111111]">
                <i className="fas fa-arrow-left text-xs"></i>
              </button>
              <div className="flex items-center gap-2">
                <span className="font-bebas text-xl uppercase tracking-wide text-[#111111]">Tu Bolsa</span>
                <span className="bg-[#111111] text-[#fcdb00] font-bebas text-xs px-2 py-0.5 rounded-full">{getTotalItems()}</span>
              </div>
              <div className="w-8" />
            </div>

            {/* Productos — scroll */}
            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 cart-scroll">

              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-20">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-shopping-bag text-xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest font-poppins">Tu bolsa está vacía</p>
                  <button onClick={() => closeCart()} className="bg-[#111111] text-[#fcdb00] font-bebas text-base uppercase px-6 py-2.5 rounded-xl hover:brightness-110 transition-all">Ver productos</button>
                </div>
              )}

              {cart.map(item => {
                const unitPrice = item.isUpsell ? item.upsellPrice : getUnitPromoPrice(item);
                return (
                  <div key={item.id} className="flex gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    {/* Imagen */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center p-1 flex-shrink-0" style={{width:'62px',height:'62px'}}>
                      <img src={item.image} loading="lazy" className="w-full h-full object-contain" alt=""/>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <p className="font-bebas text-lg uppercase tracking-wide text-[#111111] leading-tight break-words max-w-[140px]" style={{display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{item.name}</p>
                      {/* Controles qty */}
                      <div className="flex items-center gap-2">
                        <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-md hover:border-[#fcdb00] hover:bg-[#fcdb00] transition-colors text-[#111111]">
                          <i className="fas fa-plus text-[10px]"></i>
                        </button>
                        <span className="font-bebas text-lg w-5 text-center">{item.qty}</span>
                        <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-md hover:bg-gray-100 transition-colors text-[#111111]">
                          <i className="fas fa-minus text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                    {/* Columna derecha: eliminar + precio */}
                    <div className="flex flex-col items-end justify-between flex-shrink-0 ml-auto">
                      <button onClick={() => changeQty(item.id, -item.qty)} className="w-7 h-7 flex items-center justify-center hover:text-red-400 text-gray-500 transition-colors">
                        <i className="far fa-trash-alt text-[14px]"></i>
                      </button>
                      <p className="font-bebas text-lg text-[#111111] leading-none">${formatPrice(item.qty * unitPrice)}</p>
                    </div>
                  </div>
                );
              })}


            </div>

            {/* Footer fijo: ofertas + calcular envío + subtotal + botón */}
            {cart.length > 0 && (
              <div className="flex-shrink-0 border-t border-gray-100 bg-white">

                {/* Upsells — muestra uno a la vez, rota cada 1.5s */}
                {(() => {
                  const upsellItems = upsellsList.filter(u => u.active !== false && !cart.find(c => String(c.id) === String(u.productId)));
                  const carritoItems = carritoDestacados.filter(u => u.active !== false && !cart.find(c => String(c.id) === String(u.productId)));
                  const activeUpsells = [...upsellItems, ...carritoItems];
                  const upsell = activeUpsells[upsellIndex % (activeUpsells.length || 1)];
                  if (!upsell) return null;
                  const prod = products.find(p => String(p.id) === String(upsell.productId));
                  if (!prod || prod.inStock === false || prod.isDeleted) return null;
                  const prevUpsell = prevUpsellIndex !== null ? activeUpsells[prevUpsellIndex % activeUpsells.length] : null;
                  const prevProd = prevUpsell ? products.find(p => String(p.id) === String(prevUpsell.productId)) : null;
                  return (
                    <div className="px-4 pt-3 pb-2 border-b border-gray-100 overflow-hidden relative" style={{minHeight: '60px'}}>
                      {/* Saliente */}
                      {prevUpsell && prevProd && (
                        <div className="upsell-exit flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-2">
                          <div className="relative w-12 h-12 flex-shrink-0">
                            {prevUpsell.price && <span className="absolute top-0 left-0 bg-[#fcdb00] text-[#111111] text-[6px] font-black uppercase px-0.5 py-px rounded-md z-10 font-poppins leading-none">Oferta</span>}
                            <img src={prevProd.image} loading="lazy" className="w-full h-full object-contain drop-shadow-md" alt=""/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bebas text-sm uppercase text-[#111111] leading-tight truncate">{prevProd.name}</p>
                            {prevUpsell.price
                              ? <p className="font-bebas text-base text-[#111111] leading-none">${formatPrice(prevUpsell.price)} <span className="line-through text-gray-400 text-[9px] font-poppins">${formatPrice(prevProd.price)}</span></p>
                              : <p className="font-bebas text-base text-[#111111] leading-none">${formatPrice(prevProd.price)}</p>
                            }
                          </div>
                          <div className="flex-shrink-0 px-3 py-1.5 bg-[#111111] text-[#fcdb00] rounded-lg font-bebas text-sm uppercase opacity-50">+ Agregar</div>
                        </div>
                      )}
                      {/* Entrante */}
                      <div key={upsellIndex} className="upsell-enter flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-2">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          {upsell.price && <span className="absolute top-0 left-0 bg-[#fcdb00] text-[#111111] text-[6px] font-black uppercase px-0.5 py-px rounded-md z-10 font-poppins leading-none">Oferta</span>}
                          <img src={prod.image} loading="lazy" className="w-full h-full object-contain drop-shadow-md" alt=""/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bebas text-sm uppercase text-[#111111] leading-tight truncate">{prod.name}</p>
                          {upsell.price
                            ? <p className="font-bebas text-base text-[#111111] leading-none">${formatPrice(upsell.price)} <span className="line-through text-gray-400 text-[9px] font-poppins">${formatPrice(prod.price)}</span></p>
                            : <p className="font-bebas text-base text-[#111111] leading-none">${formatPrice(prod.price)}</p>
                          }
                        </div>
                        <button onClick={() => handleAddUpsellToCart(upsell)} className="flex-shrink-0 px-3 py-1.5 bg-[#111111] text-white rounded-lg font-bebas text-sm uppercase hover:bg-[#fcdb00] hover:text-[#111111] transition-colors active:scale-95">
                          + Agregar
                        </button>
                      </div>
                      {/* Dots */}
                      {activeUpsells.length > 1 && (
                        <div className="flex justify-center gap-1.5 mt-2">
                          {activeUpsells.map((_, i) => (
                            <div
                              key={i}
                              className="rounded-full transition-all duration-300"
                              style={{
                                width:  i === upsellIndex % activeUpsells.length ? '16px' : '6px',
                                height: '6px',
                                background: i === upsellIndex % activeUpsells.length ? '#111111' : '#d1d5db',
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Calcular envío */}
                <div className="px-4 pt-4 pb-4 border-b border-gray-100">
                  <CalculadorEnvioSimple
                    address={address} setAddress={setAddress}
                    setZone={setZone}
                    setShippingCost={setShippingCost}
                  />
                </div>
                {/* Subtotal + botón */}
                <div className="px-4 py-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-poppins">Subtotal</span>
                    <span className="font-bebas text-3xl text-[#111111] tracking-wide">{CONFIG.currencySymbol}{formatPrice(cart.reduce((a, i) => a + i.qty * (i.isUpsell ? i.upsellPrice : getUnitPromoPrice(i)), 0))}</span>
                  </div>
                  <button
                    onClick={() => closeCart(() => router.push('/checkout'))}
                    className="w-full bg-[#111111] text-[#fcdb00] font-bebas py-4 rounded-xl uppercase tracking-wider text-xl flex justify-center items-center gap-3 hover:brightness-110 active:scale-95 transition-all"
                  >
                    Finalizar Compra <i className="fas fa-arrow-right text-lg"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== PANTALLA DE CHECKOUT ===== */}
      {isCheckoutOpen && (() => {
        const isFormValid = clientName.trim() && clientPhone.trim() && (
          (shippingType === 'flash' && address.trim()) ||
          (shippingType === 'moto' && address.trim() && zone.trim())
        );
        return (
        <div className="fixed inset-0 z-[125] bg-[#f5f5f5] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-4 flex-shrink-0 shadow-sm">
            <button onClick={() => { if (modo === 'checkout') { router.back(); return; } setIsCheckoutOpen(false); openCart(); }} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-[#111111]">
              <i className="fas fa-arrow-left text-sm"></i>
            </button>
            <div>
              <h2 className="font-bebas text-2xl uppercase tracking-wide text-[#111111] leading-none">Finalizar Compra</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-poppins">{getTotalItems()} producto{getTotalItems() !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Contenido — dos columnas en desktop, una en mobile */}
          <div className={`flex-1 overflow-y-auto overscroll-contain md:overflow-hidden no-scrollbar ${showDiscountBreakdown ? 'pb-[420px]' : 'pb-[220px]'} md:pb-0`}>
            <div className="checkout-grid max-w-full gap-0 px-0 md:pl-4">

              {/* ── COLUMNA IZQUIERDA: formularios ── */}
              <div className="checkout-left flex flex-col gap-3 md:gap-4 px-4 md:px-0 md:pr-6 py-4 md:py-6 no-scrollbar">

                {/* Datos personales */}
                <div className="bg-white rounded-none border border-gray-200 p-5">
                  <p className="font-bebas text-xl mb-4 uppercase tracking-wider text-[#111111] flex items-center gap-2">
                    <i className="fas fa-user text-[#fcdb00]"></i> Tus Datos
                  </p>
                  <div className="flex flex-col gap-3 font-poppins">
                    <input type="text" placeholder="Nombre completo *" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-300 rounded-none text-xs font-bold text-[#111111] outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" />
                    <input type="tel" placeholder="Número de WhatsApp *" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-300 rounded-none text-xs font-bold text-[#111111] outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" />
                    {/* Cupón */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <i className="fas fa-ticket-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                        <input
                          type="text"
                          placeholder="Código de cupón"
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); if (appliedCoupon) setAppliedCoupon(null); }}
                          disabled={!!appliedCoupon}
                          className="w-full pl-8 pr-3 py-4 bg-gray-50 border border-gray-300 rounded-none text-xs font-bold text-[#111111] outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400 uppercase disabled:opacity-60"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          if (appliedCoupon) { setAppliedCoupon(null); setCouponCode(''); setCouponError(''); return; }
                          const codigo = couponCode.trim().toUpperCase();
                          if (!codigo) return;
                          try {
                            const r = await fetch('/api/cupon', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ code: codigo }),
                            });
                            const datos = await r.json();
                            if (datos.valido) { setAppliedCoupon({ code: datos.code, discount: datos.discount }); setCouponError(''); }
                            else setCouponError('Cupón inválido o expirado');
                          } catch {
                            setCouponError('No se pudo validar el cupón, probá de nuevo');
                          }
                        }}
                        className={`px-4 py-2 rounded-none text-xs font-bold uppercase tracking-widest transition-all flex-shrink-0 ${appliedCoupon ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-[#111111] text-[#fcdb00] hover:bg-[#222]'}`}
                      >
                        {appliedCoupon ? 'Quitar' : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{couponError}</p>}
                    {appliedCoupon && <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"><i className="fas fa-check-circle"></i> Cupón aplicado: {appliedCoupon.discount}% off</p>}
                  </div>
                </div>

                {/* Entrega */}
                <div className="bg-white rounded-none border border-gray-200 p-5">
                  <p className="font-bebas text-xl mb-4 uppercase tracking-wider text-[#111111] flex items-center gap-2">
                    <i className="fas fa-map-marked-alt text-[#fcdb00]"></i> Entrega
                  </p>
                  {deliveryMethod === 'envio' && (
                    <div className="flex flex-col gap-3 font-poppins">
                      <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Elegí tu opción:</label>
                      <div onClick={() => { setShippingType('flash'); setShippingCost(0); if (firebaseRefs.db) setDoc(doc(firebaseRefs.db, 'stats', 'shipping'), { flash: increment(1) }, { merge: true }).catch(console.error); }} className={`p-4 rounded-none border-2 cursor-pointer transition-all flex gap-3 items-center ${shippingType === 'flash' ? 'border-[#fcdb00] bg-[#fcdb00]/10' : 'border-gray-300 bg-gray-50 hover:border-[#fcdb00]/40 rounded-none'}`}>
                        <div className="w-9 h-9 bg-[#111111] rounded-full flex items-center justify-center text-[#fcdb00] flex-shrink-0"><i className="fas fa-bolt"></i></div>
                        <div className="flex-1"><span className={`font-bebas text-lg leading-none block mb-1 ${shippingType === 'flash' ? 'text-[#fcdb00]' : 'text-[#111111]/70'}`}>Envío Flash</span><span className="text-[9px] font-bold text-gray-500">⏱️ Menos de 30 min · Solo transferencia</span></div>
                        {shippingType === 'flash' && <i className="fas fa-check-circle text-[#fcdb00] text-lg"></i>}
                      </div>
                      <div onClick={() => { setShippingType('moto'); if (firebaseRefs.db) setDoc(doc(firebaseRefs.db, 'stats', 'shipping'), { moto: increment(1) }, { merge: true }).catch(console.error); }} className={`p-4 rounded-none border-2 cursor-pointer transition-all flex gap-3 items-center ${shippingType === 'moto' ? 'border-[#fcdb00] bg-[#fcdb00]/10' : 'border-gray-300 bg-gray-50 hover:border-[#fcdb00]/40 rounded-none'}`}>
                        <div className="w-9 h-9 bg-[#111111] rounded-full flex items-center justify-center text-[#fcdb00] flex-shrink-0"><i className="fas fa-motorcycle"></i></div>
                        <div className="flex-1"><span className={`font-bebas text-lg leading-none block mb-1 ${shippingType === 'moto' ? 'text-[#fcdb00]' : 'text-[#111111]/70'}`}>Motomensajería</span><span className="text-[9px] font-bold text-gray-500">⏲️ Horarios: 13:00 · 16:00 · 20:00hs</span></div>
                        {shippingType === 'moto' && <i className="fas fa-check-circle text-[#fcdb00] text-lg"></i>}
                      </div>

                      {shippingType === 'flash' && (
                        <div className="flex flex-col gap-3 mt-1">
                          <div className="relative"><i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-[#fcdb00]"></i><input type="text" placeholder="Dirección completa *" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-none text-xs font-bold text-[#111111] outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" /></div>
                          <div className="relative"><i className="fas fa-city absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i><input type="text" placeholder="Barrio / CP" value={zone} onChange={(e) => setZone(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-none text-xs font-bold text-[#111111] outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" /></div>
                          <div className="relative"><i className="fas fa-building absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i><input type="text" placeholder="Piso / Depto (Opcional)" value={aptDetails} onChange={(e) => setAptDetails(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-none text-xs font-bold text-[#111111] outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" /></div>
                        </div>
                      )}

                      {shippingType === 'moto' && (
                        <div className="flex flex-col gap-3 mt-1">
                          <CalculadorEnvio address={address} setAddress={setAddress} zone={zone} setZone={setZone} shippingType={shippingType} setShippingCost={setShippingCost} aptDetails={aptDetails} setAptDetails={setAptDetails} />
                          <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest mt-1">¿Cuándo querés recibirlo?</label>
                          <div className="relative"><i className="fas fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i><select value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-none text-[11px] font-bold uppercase tracking-wider outline-none focus:border-[#fcdb00] transition-all appearance-none cursor-pointer text-[#111111]">{next7Days.map(d => (<option key={d.value} value={d.value}>{d.label}</option>))}</select><i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]"></i></div>
                          <div className="flex gap-2 bg-gray-100 p-1.5 rounded-none border border-gray-300">
                            <button onClick={() => setDeliveryTime('13:00')} className={`flex-1 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${deliveryTime === '13:00' ? 'bg-[#fcdb00] text-[#111111] shadow-sm' : 'text-gray-500'}`}>13:00</button>
                            <button onClick={() => setDeliveryTime('16:00')} className={`flex-1 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${deliveryTime === '16:00' ? 'bg-[#fcdb00] text-[#111111] shadow-sm' : 'text-gray-500'}`}>16:00</button>
                            <button onClick={() => setDeliveryTime('20:00')} className={`flex-1 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${deliveryTime === '20:00' ? 'bg-[#fcdb00] text-[#111111] shadow-sm' : 'text-gray-500'}`}>20:00</button>
                          </div>
                          <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">¿Cómo querés abonar?</label>
                          <div className="flex gap-2 bg-gray-100 p-1.5 rounded-none border border-gray-300">
                            <button onClick={() => setPaymentMethod('transferencia')} className={`flex-1 py-3 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${paymentMethod === 'transferencia' ? 'bg-[#fcdb00] text-[#111111] shadow-sm' : 'text-gray-500'}`}><i className="fas fa-university"></i> Transferencia</button>
                            <button onClick={() => setPaymentMethod('efectivo')} className={`flex-1 py-3 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${paymentMethod === 'efectivo' ? 'bg-[#fcdb00] text-[#111111] shadow-sm' : 'text-gray-500'}`}><i className="fas fa-money-bill-wave"></i> Efectivo</button>
                          </div>
                          {paymentMethod !== 'efectivo' && <p className="text-[10px] text-emerald-600 font-bold text-center font-poppins flex items-center justify-center gap-1.5"><i className="fas fa-tag text-[11px]"></i> Pagando en efectivo tenés descuento</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── COLUMNA DERECHA: resumen + total + botón ── */}
              <div className="checkout-right flex flex-col">

                {/* Resumen + total juntos */}
                <div className="flex flex-col md:flex-1 md:overflow-hidden md:rounded-b-2xl md:border md:border-gray-200">
                  {/* Productos */}
                  <div className="bg-white p-5 md:flex-1 md:overflow-y-auto no-scrollbar">
                    <p className="font-bebas text-xl uppercase tracking-wider text-[#111111] mb-4 flex items-center gap-2">
                      <i className="fas fa-shopping-bag text-[#fcdb00]"></i> Resumen de Compra
                    </p>
                    <div className="flex flex-col gap-3">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 p-1">
                            <img src={item.image} alt="" loading="lazy" className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bebas text-xl uppercase tracking-wide text-[#111111] leading-tight truncate">{item.name}</p>
                            <p className="text-xs font-bold text-gray-400 font-poppins">x{item.qty}</p>
                            {/* Si el precio bajó por una promo de cantidad (no por un cupón), se
                                aclara acá mismo: sin esto, el precio parece bajar solo. */}
                            {!item.isUpsell && getUnitPromoPrice(item) < item.price && (
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Promo x{item.qty}</p>
                            )}
                          </div>
                          <span className="font-bebas text-2xl text-[#111111] flex-shrink-0">${formatPrice(item.qty * (item.isUpsell ? item.upsellPrice : getUnitPromoPrice(item)))}</span>
                        </div>
                      ))}
                    </div>
                    {shippingCost > 0 && (
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest font-poppins">Envío</span>
                        <span className="font-bebas text-lg text-[#111111]">${formatPrice(shippingCost)}</span>
                      </div>
                    )}

                    {/* Pago Seguro: cubre el pedido si se pierde en el envío. Un
                        interruptor grande, no un check chiquito, porque cambia lo que
                        se va a pagar y la persona tiene que verlo antes de confirmar. */}
                    <div className="flex items-start gap-3 mt-4 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={pagoSeguroActivo}
                        onClick={() => { setPagoSeguroActivo(v => !v) }}
                        className={`relative w-11 h-6 rounded-full flex-shrink-0 mt-0.5 transition-colors ${pagoSeguroActivo ? 'bg-[#fcdb00]' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${pagoSeguroActivo ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <button type="button" onClick={() => { setPagoSeguroActivo(v => !v) }} className="flex items-center gap-1.5 text-left">
                          <i className="fas fa-shield-alt text-[#fcdb00] text-sm"></i>
                          <span className="font-bebas text-lg uppercase tracking-wide text-[#111111]">Pago Seguro</span>
                        </button>
                        <p className="text-[11px] text-gray-500 font-poppins leading-snug mt-0.5">
                          Si tu pedido se pierde en el envío, te lo cubrimos nosotros.
                          {' '}
                          <button type="button" onClick={() => setShowPagoSeguroInfo(true)} className="text-[#8a6d00] font-bold underline underline-offset-2">
                            ¿Cómo funciona?
                          </button>
                        </p>

                      </div>
                      <span className="font-bebas text-lg text-[#111111] flex-shrink-0">+${formatPrice(PRECIO_PAGO_SEGURO)}</span>
                    </div>
                  </div>
                  {/* Total + botón */}
                  <div className="checkout-total bg-[#111111] p-5 flex flex-col gap-4">
                    {(() => {
                      const precioOriginal = cart.reduce((acc, item) => acc + item.qty * item.price, 0) + shippingCost;
                      const totalFinal = calculateTotal();
                      // El Pago Seguro suma al total, pero no es un descuento negativo:
                      // se resta acá para que "ahorro" siga reflejando sólo las promos y
                      // el pago en efectivo, no se vea afectado por un servicio aparte.
                      const pagoSeguroMonto = pagoSeguroActivo ? PRECIO_PAGO_SEGURO : 0;
                      const ahorro = precioOriginal - (totalFinal - pagoSeguroMonto);
                      const promoSavings = cart.reduce((acc, item) => {
                        if (item.isUpsell) return acc;
                        const promo = getUnitPromoPrice(item);
                        return acc + (item.price - promo) * item.qty;
                      }, 0);
                      const upsellSavings = cart.reduce((acc, item) => {
                        if (!item.isUpsell) return acc;
                        return acc + (item.price - item.upsellPrice) * item.qty;
                      }, 0);
                      const subtotalParaCalc = cart.reduce((acc, item) => acc + item.qty * (item.isUpsell ? item.upsellPrice : getUnitPromoPrice(item)), 0);
                      const cashDisc = deliveryMethod === 'envio' && shippingType === 'moto' && paymentMethod === 'efectivo'
                        ? (subtotalParaCalc >= 50000 ? 2500 : 1500) : 0;
                      const couponDisc = appliedCoupon ? Math.round(subtotalParaCalc * appliedCoupon.discount / 100) : 0;
                      return (
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-end">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-gray-300 text-[10px] uppercase tracking-widest font-poppins">Total a Pagar</span>
                              {ahorro > 0 && (
                                <button onClick={() => setShowDiscountBreakdown(v => !v)} className="flex items-center gap-1 text-left">
                                  <span className="font-bebas text-gray-300 text-sm tracking-wide">Descuento Total {CONFIG.currencySymbol}{formatPrice(ahorro)}</span>
                                  <i className={`fas fa-chevron-down text-gray-400 text-[10px] transition-transform duration-300 ${showDiscountBreakdown ? 'rotate-180' : ''}`}></i>
                                </button>
                              )}
                            </div>
                            <div className="flex flex-col items-end">
                              {ahorro > 0 && <span className="font-bebas text-lg text-gray-500 line-through leading-none">{CONFIG.currencySymbol}{formatPrice(precioOriginal)}</span>}
                              <span className="font-bebas text-5xl text-white tracking-wide leading-none"><span className="text-[#fcdb00] text-3xl mr-1">{CONFIG.currencySymbol}</span>{formatPrice(totalFinal)}</span>
                              {pagoSeguroActivo && (
                                <span className="text-[10px] text-gray-400 font-poppins flex items-center gap-1 mt-0.5">
                                  <i className="fas fa-shield-alt text-[#fcdb00]"></i> Incluye Pago Seguro {CONFIG.currencySymbol}{formatPrice(PRECIO_PAGO_SEGURO)}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Desglose deslizable */}
                          <div style={{maxHeight: showDiscountBreakdown && ahorro > 0 ? '200px' : '0px', overflow:'hidden', transition:'max-height 0.3s ease'}}>
                            <div className="flex flex-col gap-2 pt-1 border-t border-white/10">
                              {promoSavings > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-poppins flex items-center gap-1.5"><i className="fas fa-layer-group text-[9px] text-[#fcdb00]"></i> Promo cantidad</span>
                                  <span className="font-bebas text-base text-emerald-400">-{CONFIG.currencySymbol}{formatPrice(promoSavings)}</span>
                                </div>
                              )}
                              {upsellSavings > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-poppins flex items-center gap-1.5"><i className="fas fa-tag text-[9px] text-[#fcdb00]"></i> Precio oferta</span>
                                  <span className="font-bebas text-base text-emerald-400">-{CONFIG.currencySymbol}{formatPrice(upsellSavings)}</span>
                                </div>
                              )}
                              {cashDisc > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-poppins flex items-center gap-1.5"><i className="fas fa-money-bill-wave text-[9px] text-[#fcdb00]"></i> Pago en efectivo</span>
                                  <span className="font-bebas text-base text-emerald-400">-{CONFIG.currencySymbol}{formatPrice(cashDisc)}</span>
                                </div>
                              )}
                              {couponDisc > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-poppins flex items-center gap-1.5"><i className="fas fa-ticket-alt text-[9px] text-[#fcdb00]"></i> Cupón {appliedCoupon.code} ({appliedCoupon.discount}%)</span>
                                  <span className="font-bebas text-base text-emerald-400">-{CONFIG.currencySymbol}{formatPrice(couponDisc)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <button
                      onClick={() => { if (!pagoSeguroActivo) { setShowConfirmarSinPagoSeguro(true); return; } handleCheckout(); }}
                      disabled={!isFormValid}
                      className={`w-full font-bebas py-4 rounded-xl uppercase tracking-wider text-xl flex justify-center items-center gap-3 transition-all ${isFormValid ? 'bg-[#fcdb00] text-[#111111] active:scale-95 hover:brightness-95' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                    >
                      <i className="fas fa-check-circle text-2xl"></i> Confirmar Pedido
                    </button>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        );
      })()}

      {/* --- ÚLTIMO AVISO: CONFIRMAR SIN PAGO SEGURO ---
          Se muestra sólo cuando la persona va a confirmar sin haber activado el Pago
          Seguro. Es la última oportunidad de que lo note antes de que el pedido salga:
          decidir "no" al lado del interruptor es fácil de hacer sin pensarlo. */}
      {showConfirmarSinPagoSeguro && (
        <div className="fixed inset-0 z-[131] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm transition-opacity" onClick={() => setShowConfirmarSinPagoSeguro(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-gray-200">
            <div className="bg-gray-50 p-6 text-center relative border-b border-gray-200">
              <button onClick={() => setShowConfirmarSinPagoSeguro(false)} aria-label="Cerrar" className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[#111111] hover:bg-[#fcdb00] transition-colors"><i className="fas fa-times"></i></button>
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-shield-alt text-3xl text-gray-400"></i>
              </div>
              <h2 className="text-2xl font-bebas text-[#111111] uppercase tracking-wide leading-tight">¿Seguro que no querés<br/>Pago Seguro?</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p className="text-[13px] text-gray-600 font-poppins leading-snug">
                Sin Pago Seguro, si tu pedido se pierde en el envío <strong className="text-[#111111]">no podemos hacernos cargo</strong> de esa pérdida.
              </p>
              <p className="text-[13px] text-gray-600 font-poppins leading-snug">
                Por sólo <strong className="text-[#111111]">{CONFIG.currencySymbol}{formatPrice(PRECIO_PAGO_SEGURO)}</strong> más, si se pierde en el camino te lo reenviamos o te devolvemos la plata.
              </p>
              <button
                onClick={() => { setPagoSeguroActivo(true); setShowConfirmarSinPagoSeguro(false); }}
                className="w-full bg-[#fcdb00] text-[#111111] py-3.5 rounded-xl font-bebas text-lg uppercase tracking-widest hover:brightness-95 transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-shield-alt"></i> Sí, sumar Pago Seguro
              </button>
              <button
                onClick={() => { setShowConfirmarSinPagoSeguro(false); handleCheckout(); }}
                className="w-full text-gray-400 py-2 font-poppins text-[12px] font-bold uppercase tracking-widest hover:text-gray-600 transition-colors"
              >
                Continuar sin Pago Seguro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EXPLICATIVO: PAGO SEGURO ---
          Se cierra tocando la X o afuera, como cualquier modal de la tienda. Es
          texto corto a propósito: la idea es que se entienda de un vistazo, no que
          haga falta leer un reglamento para decidir si conviene. */}
      {showPagoSeguroInfo && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm transition-opacity" onClick={() => setShowPagoSeguroInfo(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-gray-200">
            <div className="bg-gray-50 p-6 text-center relative border-b border-gray-200">
              <button onClick={() => setShowPagoSeguroInfo(false)} aria-label="Cerrar" className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[#111111] hover:bg-[#fcdb00] transition-colors"><i className="fas fa-times"></i></button>
              <div className="w-16 h-16 bg-[#fcdb00] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                <i className="fas fa-shield-alt text-3xl text-[#111111]"></i>
              </div>
              <h2 className="text-3xl font-bebas text-[#111111] uppercase tracking-wide">Pago Seguro</h2>
              <p className="text-[#8a6d00] text-[11px] font-bold uppercase tracking-widest font-poppins">+{CONFIG.currencySymbol}{formatPrice(PRECIO_PAGO_SEGURO)} por pedido</p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5"><i className="fas fa-check text-xs"></i></span>
                <p className="text-[13px] text-gray-600 font-poppins leading-snug">
                  <strong className="text-[#111111]">Si activás Pago Seguro</strong> y tu pedido se pierde en el camino (un problema del cadete, del envío), lo cubrimos nosotros: te lo reenviamos o te devolvemos la plata, como prefieras.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0 mt-0.5"><i className="fas fa-times text-xs"></i></span>
                <p className="text-[13px] text-gray-600 font-poppins leading-snug">
                  <strong className="text-[#111111]">Sin Pago Seguro</strong>, si el pedido se pierde en el envío, no podemos hacernos cargo de esa pérdida.
                </p>
              </div>
              <p className="text-[10px] text-gray-400 font-poppins leading-snug pt-2 border-t border-gray-100">
                No cubre errores de dirección cargados por vos ni el rechazo del pedido al recibirlo.
              </p>
              <button onClick={() => setShowPagoSeguroInfo(false)} className="w-full bg-[#111111] text-white py-3.5 rounded-xl font-bebas text-lg uppercase tracking-widest hover:bg-[#fcdb00] hover:text-[#111111] transition-colors">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BOTONES FLOTANTES INDEPENDIENTES (Se esconden si el carrito se abre) --- */}

      {/* --- MODAL DE PAGO OFFLINE --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm transition-opacity" onClick={() => setShowPaymentModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-gray-200">
            <div className="bg-gray-50 p-6 text-center relative border-b border-gray-200">
              <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[#111111] hover:bg-[#fcdb00] hover:text-[#111111] transition-colors"><i className="fas fa-times"></i></button>
              <div className="w-16 h-16 bg-[#fcdb00] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <i className="fas fa-university text-3xl text-[#111111]"></i>
              </div>
              <h2 className="text-3xl font-bebas text-[#111111] uppercase tracking-wide">¡Pedido Reservado!</h2>
              <p className="text-[#fcdb00] text-[11px] font-bold uppercase tracking-widest font-poppins">Falta 1 paso para despacharlo</p>
            </div>
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="text-center">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1 font-poppins">Total a transferir</p>
                  <p className="text-5xl font-bebas text-[#111111] leading-none tracking-wide"><span className="text-[#fcdb00] text-3xl mr-1">$</span>{formatPrice(calculateTotal())}</p>
              </div>

              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#fcdb00]"></div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 font-poppins"><i className="fas fa-university text-[#fcdb00] mr-1"></i> Transferir a:</p>
                  <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200">
                          <span className="font-bebas text-2xl text-[#111111] tracking-wider truncate">{CONFIG.paymentAlias}</span>
                          <button onClick={copyAliasToClipboard} className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-[#111111] hover:bg-[#fcdb00] hover:text-[#111111] transition-colors flex-shrink-0">
                              <i className="fas fa-copy"></i>
                          </button>
                      </div>
                      <div className="bg-gray-100 p-2.5 rounded-lg border border-gray-200 text-center">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-poppins">TITULAR: {CONFIG.paymentName}</p>
                      </div>
                  </div>
              </div>
              
              <div className="space-y-3">
                  <button onClick={executeOrder} disabled={isSending} className={`w-full ${isSending ? 'bg-gray-300 text-gray-500' : 'bg-[#25D366] text-white hover:scale-[1.02] shadow-lg shadow-[#25D366]/30'} py-4 rounded-xl font-bebas text-xl uppercase tracking-wider transition-all flex items-center justify-center gap-3`}>
                      {isSending ? <><i className="fas fa-circle-notch fa-spin text-lg"></i> Procesando...</> : <><i className="fab fa-whatsapp text-2xl mb-0.5"></i> Enviar Comprobante</>}
                  </button>
                  <p className="text-[9px] text-gray-400 font-medium text-center font-poppins uppercase tracking-widest leading-relaxed">
                      Realizá la transferencia y envianos la captura por WhatsApp tocando el botón verde.
                  </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE CALCULADORA DE ENVÍO INDEPENDIENTE --- */}
      {showShippingCalculatorModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm transition-opacity" onClick={() => setShowShippingCalculatorModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-gray-200">
            <div className="bg-gray-50 p-6 text-center relative border-b border-gray-200">
                <button onClick={() => setShowShippingCalculatorModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[#111111] hover:bg-[#fcdb00] hover:text-[#111111] transition-colors"><i className="fas fa-times"></i></button>
                <div className="w-16 h-16 bg-[#fcdb00] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <i className="fas fa-motorcycle text-3xl text-[#111111]"></i>
                </div>
                <h2 className="text-3xl font-bebas text-[#111111] uppercase tracking-wide">Cotizar Envío</h2>
                <p className="text-[#fcdb00] text-[11px] font-bold uppercase tracking-widest font-poppins">Solo válido para Motomensajería</p>
            </div>
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <CalculadorEnvio 
                  address={address} 
                  setAddress={setAddress} 
                  zone={zone} 
                  setZone={setZone} 
                  shippingType="moto" 
                  setShippingCost={setShippingCost} 
                  aptDetails={aptDetails} 
                  setAptDetails={setAptDetails} 
              />
              <button 
                  onClick={() => setShowShippingCalculatorModal(false)} 
                  className="w-full bg-[#111111] text-white hover:bg-[#fcdb00] hover:text-[#111111] py-4 rounded-xl font-bebas text-xl uppercase tracking-wider transition-all shadow-lg active:scale-95"
              >
                  Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL DE AUTENTICACIÓN === */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[120] overflow-y-auto">
          <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}></div>
          <div className="flex min-h-full items-end sm:items-center justify-center sm:p-4">
          <div className="relative bg-[#111111] w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">

            {/* Pill handle */}
            <div className="flex justify-center pt-3 pb-0 sm:hidden">
              <div className="w-10 h-1 bg-white/20 rounded-full"></div>
            </div>

            {/* Header negro */}
            <div className="p-5 text-center relative">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-3 right-3 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#fcdb00] hover:text-[#111111] transition-colors">
                <i className="fas fa-times text-sm"></i>
              </button>
              <div className="w-12 h-12 bg-[#fcdb00] rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                <i className="fas fa-user text-xl text-[#111111]"></i>
              </div>
              <h2 className="font-bebas text-2xl text-white uppercase tracking-wide leading-tight">
                {authMode === 'login' ? 'Iniciá Sesión' : 'Crear Cuenta'}
              </h2>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest font-poppins">
                {authMode === 'login' ? 'Accedé a tu cuenta 028' : 'Unite a la comunidad 028'}
              </p>
            </div>

            {/* Formulario blanco */}
            <div className="bg-white rounded-t-3xl p-5 space-y-3 pb-10 sm:pb-6 sm:rounded-b-3xl">
              {/* Google */}
              <button
                onClick={() => { setShowAuthModal(false); handleGoogleLogin(); }}
                className="w-full border-2 border-gray-200 text-[#111111] py-3 rounded-2xl font-bold text-sm uppercase tracking-widest hover:border-[#fcdb00] hover:bg-[#fcdb00]/5 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <i className="fab fa-google text-lg text-[#EA4335]"></i> Continuar con Google
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-poppins">o con email</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-2.5">
                {authMode === 'register' && (
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base font-semibold text-[#111111] placeholder-gray-400 focus:outline-none focus:border-[#fcdb00] transition-colors"
                  />
                )}
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base font-semibold text-[#111111] placeholder-gray-400 focus:outline-none focus:border-[#fcdb00] transition-colors"
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base font-semibold text-[#111111] placeholder-gray-400 focus:outline-none focus:border-[#fcdb00] transition-colors"
                />
                {authMode === 'register' && (
                  <input
                    type="password"
                    placeholder="Repetí tu contraseña"
                    value={authConfirmPassword}
                    onChange={e => setAuthConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base font-semibold text-[#111111] placeholder-gray-400 focus:outline-none focus:border-[#fcdb00] transition-colors"
                  />
                )}
                {authError && (
                  <p className="text-red-500 text-[11px] font-bold text-center font-poppins">{authError}</p>
                )}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#111111] text-white py-3.5 rounded-2xl font-bebas text-xl uppercase tracking-wider hover:bg-[#fcdb00] hover:text-[#111111] transition-all shadow-lg active:scale-95 disabled:opacity-60"
                >
                  {authLoading ? <><i className="fas fa-circle-notch fa-spin mr-2"></i>Procesando...</> : authMode === 'login' ? 'Ingresar' : 'Crear Cuenta'}
                </button>
              </form>

              <button
                onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); setAuthConfirmPassword(''); }}
                className="w-full text-center text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#111111] transition-colors font-poppins py-1"
              >
                {authMode === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* === BOTÓN FLOTANTE WHATSAPP === */}
      <div className="fixed bottom-6 right-5 z-[200] flex flex-col items-end">
        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-3 bg-white text-[#111111] text-xs font-semibold font-poppins px-4 py-2.5 rounded-2xl shadow-xl border border-gray-200 w-[200px] text-center leading-snug animate-in fade-in slide-in-from-bottom-2 duration-300">
            ¿Tenés dudas? <span className="text-[#25D366]">¡Escribinos por WhatsApp!</span> 💬
            <div className="absolute bottom-[-6px] right-5 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45"></div>
          </div>
        )}
        <div className="relative">
          <span className="wa-ring-1 absolute inset-0 rounded-full bg-[#25D366] pointer-events-none"></span>
          <span className="wa-ring-2 absolute inset-0 rounded-full bg-[#25D366] pointer-events-none"></span>
          <a
            href={`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent('Hola! Tengo una consulta sobre 028 Import 👋')}`}
            target="_blank"
            rel="noreferrer"
            className="relative w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/40 hover:scale-110 hover:shadow-[#25D366]/60 active:scale-95 transition-all duration-200"
            aria-label="Contactar por WhatsApp"
          >
            <i className="fab fa-whatsapp text-3xl text-white"></i>
          </a>
        </div>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    </div>
  );
}