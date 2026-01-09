"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot 
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from "firebase/auth";

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '028import';

// --- CONFIGURACIÓN DE TIENDA ---
const CONFIG = {
  whatsappNumber: "5491155669960",
  brandName: "028",
  bannerImage: "https://i.postimg.cc/wBdHsm94/banner-web.jpg",
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png"
};

const INITIAL_PRODUCTS = [
  // Nicotina (1-17)
  { id: 1, name: "BAJA SPLASH", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png" },
  { id: 2, name: "BLUE RAZZ ICE", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/s2Tmw67w/BLUE-RAZZ-ICE.webp" },
  { id: 3, name: "CHERRY FUSE", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/yd5PzDfx/CHERRY-FUSE.png" },
  { id: 4, name: "CHERRY STRAZZ", price: 27000, category: "VAPES NICOTINA", tag: "Destacado", image: "https://i.postimg.cc/7PFVsTG2/CHERRY-STRAZZ.jpg" },
  { id: 5, name: "DOUBLE APPLE ICE", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/QN9mJqtk/DOUBLE-APPLE-ICE.webp" },
  { id: 6, name: "DRAGON STRAWNANA", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/9X6p8qRB/DRAGON-STRAWNANA.png" },
  { id: 7, name: "GRAPE ICE", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/hPV0HPTw/GRAPE-ICE.webp" },
  { id: 8, name: "MANGO MAGIC", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/tCFzLCFC/MANGO-MAGIC.png" },
  { id: 9, name: "PEACH", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/4xZ1Zk1f/PEACH.webp" },
  { id: 10, name: "SCARY BERRY", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/K8F5FS5D/SCARY-BERRY.png" },
  { id: 11, name: "SOUR LUSH GUMMY", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/P54Q536R/SOUR-LUSH-GUMMY.png" },
  { id: 12, name: "STRAWBERRY DRAGON FRUIT", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/QMdk9QwW/STRAWBERRY-DRAGON-FRUIT.png" },
  { id: 13, name: "STRAWBERRY ICE", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/7Lt1gCrC/STRAWBERRY-ICE.png" },
  { id: 14, name: "STRAWBERRY WATERMELON", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/MG30ycJD/STRAWBERRY-WATERMELON.webp" },
  { id: 15, name: "SUMMER SPLASH", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/LXqtvHmV/SUMMER-SPLASH.png" },
  { id: 16, name: "TIGERS BLOOD", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/3RyX9K3P/TIGERS-BLOOD.jpg" },
  { id: 17, name: "WATERMELON ICE", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/63DdmD3s/WATERMELON-ICE.webp" },
  // THC (18-20)
  { id: 18, name: "BLOW THC", price: 60000, category: "VAPES THC", tag: "THC", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp" },
  { id: 19, name: "TORCH 7.5G", price: 53000, category: "VAPES THC", tag: "THC", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png" },
  { id: 20, name: "PHENOM 6G", price: 56000, category: "VAPES THC", tag: "THC", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg" },
  // Cargadores (21-24)
  { id: 21, name: "CARGADOR 20W", price: 16500, category: "CARGADORES", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg" },
  { id: 22, name: "CARGADOR 35W", price: 20500, category: "CARGADORES", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg" },
  { id: 23, name: "CABLE USB-C A USB-C", price: 13500, category: "CARGADORES", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg" },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M", price: 13500, category: "CARGADORES", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg" }
];

export default function StorePage() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('TODOS');
  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (!u) signInAnonymously(auth);
      setUser(u);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const prodsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const unsub = onSnapshot(prodsRef, (snap) => {
      const dbData = {};
      snap.forEach(d => dbData[d.id] = d.data());
      setProducts(INITIAL_PRODUCTS.map(p => ({
        ...p,
        price: dbData[p.id.toString()]?.price || p.price,
        inStock: dbData[p.id.toString()]?.inStock ?? true
      })));
    });
    return () => unsub();
  }, [user]);

  const formatP = (n) => n?.toLocaleString('es-AR');

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans pb-24">
      <nav className="bg-[#0a0a0a] p-4 sticky top-0 z-50 border-b border-[#d4af37]/20 flex justify-between items-center shadow-xl">
        <img src={CONFIG.logoImage} className="h-10 object-contain" alt="028" />
        <button className="text-[#d4af37] p-2">
           <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
      </nav>

      <header className="relative h-[28vh] md:h-[55vh] bg-black overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-cover bg-no-repeat opacity-70" style={{ backgroundImage: `url(${CONFIG.bannerImage})`, backgroundPosition: 'center 30%' }} />
      </header>

      <div className="sticky top-[73px] z-40 bg-white/95 backdrop-blur-md border-b flex overflow-x-auto">
        {['TODOS', 'VAPES NICOTINA', 'VAPES THC', 'CARGADORES'].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-1 py-5 px-6 text-[10px] font-black uppercase tracking-widest ${activeCategory === cat ? 'border-b-[3px] border-[#d4af37] text-black' : 'text-gray-400'}`}>
            {cat.replace('VAPES ', '')}
          </button>
        ))}
      </div>

      <section className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-10 max-w-7xl mx-auto mt-10">
        {products.filter(p => activeCategory === 'TODOS' || p.category === activeCategory).map(p => (
          <div key={p.id} className={`bg-white rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col hover:shadow-xl transition-all ${p.inStock === false ? 'opacity-60 grayscale' : ''}`}>
            <div className="relative aspect-square">
              <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
              {p.inStock === false && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><span className="text-white font-black text-[11px] uppercase tracking-tighter bg-rose-600 px-4 py-1.5 rounded-full">AGOTADO</span></div>}
            </div>
            <div className="p-5 md:p-8 flex-grow flex flex-col">
              <h3 className="font-bold text-[12px] md:text-[14px] uppercase mb-3 line-clamp-2 min-h-[2.5rem] text-slate-900 leading-tight">{p.name}</h3>
              <p className="font-black text-xl md:text-2xl mb-5 tracking-tighter text-slate-900">${formatP(p.price)}</p>
              <button disabled={p.inStock === false} className="w-full bg-[#d4af37] text-black py-4 rounded-3xl font-black text-[10px] uppercase transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-400">
                {p.inStock === false ? 'SIN STOCK' : 'Añadir al Carrito'}
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}