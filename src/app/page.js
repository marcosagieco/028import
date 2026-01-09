"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from "firebase/auth";

// --- CONFIGURACIÓN DE FIREBASE (Segura para Build) ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "shop-028.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "shop-028",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "shop-028.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "12345",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "12345"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '028import';

// --- CONFIGURACIÓN DE LA TIENDA ---
const CONFIG = {
  whatsappNumber: "5491155669960",
  brandName: "028",
  bannerImage: "https://i.postimg.cc/wBdHsm94/banner-web.jpg", 
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png"
};

const INITIAL_PRODUCTS = [
  // VAPES NICOTINA (1-17)
  { id: 1, name: "BAJA SPLASH", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png" },
  { id: 2, name: "BLUE RAZZ ICE", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/s2Tmw67w/BLUE-RAZZ-ICE.webp" },
  { id: 3, name: "CHERRY FUSE", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/yd5PzDfx/CHERRY-FUSE.png" },
  { id: 4, name: "CHERRY STRAZZ", price: 27000, category: "VAPES NICOTINA", tag: "Destacado", image: "https://i.postimg.cc/7PFVsTG2/CHERRY-STRAZZ.jpg" },
  { id: 5, name: "DOUBLE APPLE ICE", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/QN9mJqtk/DOUBLE-APPLE-ICE.webp" },
  { id: 6, name: "DRAGON STRAWNANA", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/9X6p8qRB/DRAGON-STRAWNANA.png" },
  { id: 7, name: "GRAPE ICE", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/hPV0HPTw/GRAPE-ICE.webp" },
  { id: 8, name: "MANGO MAGIC", price: 27000, category: "VAPES NICOTINA", tag: "Best Seller", image: "https://i.postimg.cc/tCFzLCFC/MANGO-MAGIC.png" },
  { id: 9, name: "PEACH", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/4xZ1Zk1f/PEACH.webp" },
  { id: 10, name: "SCARY BERRY", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/K8F5FS5D/SCARY-BERRY.png" },
  { id: 11, name: "SOUR LUSH GUMMY", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/P54Q536R/SOUR-LUSH-GUMMY.png" },
  { id: 12, name: "STRAWBERRY DRAGON FRUIT", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/QMdk9QwW/STRAWBERRY-DRAGON-FRUIT.png" },
  { id: 13, name: "STRAWBERRY ICE", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/7Lt1gCrC/STRAWBERRY-ICE.png" },
  { id: 14, name: "STRAWBERRY WATERMELON", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/MG30ycJD/STRAWBERRY-WATERMELON.webp" },
  { id: 15, name: "SUMMER SPLASH", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/LXqtvHmV/SUMMER-SPLASH.png" },
  { id: 16, name: "TIGERS BLOOD", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/3RyX9K3P/TIGERS-BLOOD.jpg" },
  { id: 17, name: "WATERMELON ICE", price: 27000, category: "VAPES NICOTINA", image: "https://i.postimg.cc/63DdmD3s/WATERMELON-ICE.webp" },
  // VAPES THC (18-20)
  { id: 18, name: "BLOW THC", price: 60000, category: "VAPES THC", tag: "THC", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp" },
  { id: 19, name: "TORCH 7.5G", price: 53000, category: "VAPES THC", tag: "THC", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png" },
  { id: 20, name: "PHENOM 6G", price: 56000, category: "VAPES THC", tag: "THC", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg" },
  // CARGADORES (21-24)
  { id: 21, name: "CARGADOR 20W", price: 16500, category: "CARGADORES", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg" },
  { id: 22, name: "CARGADOR 35W", price: 20500, category: "CARGADORES", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg" },
  { id: 23, name: "CABLE USB-C A USB-C", price: 13500, category: "CARGADORES", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg" },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M", price: 13500, category: "CARGADORES", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg" }
];

// ICONOS SVG NATIVOS
const IconCart = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.56-7.43H5.12"/></svg>;
const IconMenu = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>;
const IconX = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
const IconPlus = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconMinus = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/></svg>;

export default function Store() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState('TODOS');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [delivery, setDelivery] = useState('retiro');
  const [address, setAddress] = useState({ street: '', zone: '' });

  // 1. Autenticación Anónima (Obligatoria para Firestore)
  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (!u) signInAnonymously(auth).catch(() => {});
      setUser(u);
    });
  }, []);

  // 2. Sincronización en Tiempo Real con ID corregido
  useEffect(() => {
    if (!user) return;
    const prodsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const unsub = onSnapshot(prodsRef, (snap) => {
      const dbData = {};
      snap.forEach(d => { dbData[d.id] = d.data(); });
      
      setProducts(prev => INITIAL_PRODUCTS.map(p => {
        const remote = dbData[p.id.toString()]; // Match por ID de TEXTO
        return {
          ...p,
          price: remote?.price ?? p.price,
          inStock: remote?.inStock ?? true
        };
      }));
    });
    return () => unsub();
  }, [user]);

  const formatP = (n) => n?.toLocaleString('es-AR');
  const getUnitPrice = (p) => {
    if (p.category !== "VAPES NICOTINA") return p.price;
    const count = cart.filter(i => i.category === "VAPES NICOTINA").reduce((a, b) => a + b.qty, 0);
    if (count >= 5) return 24500;
    if (count >= 2) return 26000;
    return p.price;
  };
  const totalCart = cart.reduce((acc, item) => acc + (getUnitPrice(item) * item.qty), 0);

  const addToCart = (p) => {
    if (p.inStock === false) return;
    setCart(prev => {
      const exists = prev.find(i => i.id === p.id);
      return exists ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const handleCheckout = async () => {
    if (delivery === 'envio' && (!address.street || !address.zone)) return;
    try {
      const orderData = {
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: getUnitPrice(i) })),
        total: totalCart,
        delivery,
        address: delivery === 'envio' ? address : 'RETIRO EN LOCAL',
        createdAt: serverTimestamp(),
        status: 'pending'
      };
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderData);
      
      let msg = `*Pedido 028*\n\n`;
      cart.forEach(i => msg += `• ${i.qty}x ${i.name} ($${formatP(getUnitPrice(i))})\n`);
      msg += `\n*TOTAL:* $${formatP(totalCart)}`;
      window.location.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-['Montserrat',sans-serif] pb-24">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');`}</style>
      
      {/* Navbar Premium */}
      <nav className="bg-[#0a0a0a] p-4 sticky top-0 z-50 border-b border-[#d4af37]/20 flex justify-between items-center shadow-xl">
        <img src={CONFIG.logoImage} className="h-10 object-contain" alt="028" />
        <button onClick={() => setIsMenuOpen(true)} className="text-[#d4af37] p-2 hover:scale-110 transition-transform">
          <IconMenu />
        </button>
      </nav>

      {/* Menú Lateral */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center gap-10 p-10 animate-in fade-in duration-300">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white"><IconX /></button>
          <button onClick={() => setIsMenuOpen(false)} className="text-white font-black text-4xl hover:text-[#d4af37] tracking-tighter">TIENDA</button>
          <button onClick={() => {setIsCartOpen(true); setIsMenuOpen(false)}} className="text-white font-black text-4xl hover:text-[#d4af37] tracking-tighter">CARRITO</button>
          <a href="/admin" className="text-slate-700 font-bold text-xs tracking-[0.5em] mt-16 hover:text-white border border-slate-900 px-10 py-4 rounded-full uppercase">Panel Control</a>
        </div>
      )}

      {/* Banner Centrado */}
      <header className="relative h-[28vh] md:h-[50vh] bg-black overflow-hidden flex items-center justify-center shadow-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-no-repeat opacity-70 transition-opacity duration-1000"
          style={{ backgroundImage: `url(${CONFIG.bannerImage})`, backgroundPosition: 'center 30%' }}
        />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-8xl font-black text-[#d4af37] tracking-tighter uppercase drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">028IMPORT</h1>
        </div>
      </header>

      {/* Filtro Categorías */}
      <div className="sticky top-[73px] z-40 bg-white/95 backdrop-blur-md border-b flex overflow-x-auto no-scrollbar shadow-sm">
        {['TODOS', 'VAPES NICOTINA', 'VAPES THC', 'CARGADORES'].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-1 py-5 px-6 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'border-b-[3px] border-[#d4af37] text-black' : 'text-gray-400'}`}>
            {cat.replace('VAPES ', '')}
          </button>
        ))}
      </div>

      {/* Catálogo */}
      <section className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-10 max-w-7xl mx-auto mt-10">
        {products.filter(p => activeCategory === 'TODOS' || p.category === activeCategory).map(p => {
          const inCart = cart.find(i => i.id === p.id);
          const noStock = p.inStock === false;
          return (
            <div key={p.id} className={`bg-white rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${noStock ? 'opacity-60 grayscale' : ''}`}>
              <div className="relative aspect-square">
                <img src={p.image} className="w-full h-full object-cover" alt="" />
                {noStock && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-black text-xs uppercase tracking-widest bg-rose-600/80">AGOTADO</div>}
                {p.tag && !noStock && <span className="absolute top-4 left-4 bg-black text-[#d4af37] text-[8px] font-black px-3 py-1 rounded-sm uppercase">{p.tag}</span>}
              </div>
              <div className="p-5 md:p-8 flex-grow flex flex-col">
                <h3 className="font-bold text-[11px] md:text-sm uppercase mb-3 line-clamp-2 leading-tight text-slate-900 h-10">{p.name}</h3>
                <p className="font-black text-xl md:text-2xl mb-5 tracking-tighter text-slate-900">${formatP(p.price)}</p>
                <div className="mt-auto">
                  {inCart ? (
                    <div className="flex items-center justify-between bg-black text-white h-12 rounded-2xl font-bold overflow-hidden">
                      <button className="w-12 h-full flex items-center justify-center hover:bg-slate-800" onClick={() => changeQty(p.id, -1)}><IconMinus /></button>
                      <span className="text-lg">{inCart.qty}</span>
                      <button className="w-12 h-full flex items-center justify-center hover:bg-slate-800" onClick={() => addToCart(p)}><IconPlus /></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(p)}
                      disabled={noStock}
                      className="w-full bg-[#d4af37] text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {noStock ? 'AGOTADO' : 'AÑADIR'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Resumen Carrito Flotante */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-[#0a0a0a]/98 backdrop-blur-xl p-6 border-t border-[#d4af37]/30 text-white flex justify-between items-center z-50 shadow-2xl animate-in slide-in-from-bottom duration-500">
          <div><p className="text-[10px] text-[#d4af37] font-black mb-1 uppercase tracking-widest opacity-80">Total del pedido</p><p className="text-3xl font-black tracking-tighter">${formatP(totalCart)}</p></div>
          <button onClick={() => setIsCartOpen(true)} className="bg-[#d4af37] text-black px-12 py-4 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-transform">Ver Pedido ({cart.reduce((a,b)=>a+b.qty,0)})</button>
        </div>
      )}

      {/* Modal Carrito */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsCartOpen(false)} />
          <div className="relative bg-white p-8 rounded-t-[3.5rem] max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Mi Pedido</h2>
              <button onClick={() => setIsCartOpen(false)}><IconX /></button>
            </div>
            
            <div className="space-y-6 mb-10">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b border-slate-50 pb-6">
                  <div className="flex items-center gap-4">
                    <img src={item.image} className="w-16 h-16 rounded-[1rem] object-cover" alt="" />
                    <div>
                      <p className="font-black text-sm uppercase leading-tight">{item.name}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <button onClick={() => changeQty(item.id, -1)} className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100"><IconMinus /></button>
                        <span className="text-lg font-black">{item.qty}</span>
                        <button onClick={() => addToCart(item)} className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100"><IconPlus /></button>
                      </div>
                    </div>
                  </div>
                  <p className="font-black text-slate-900 text-xl tracking-tighter">${formatP(item.qty * getUnitPrice(item))}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-6 rounded-[2.5rem] mb-10 border border-slate-100">
              <p className="font-black text-[10px] mb-4 uppercase text-slate-400 tracking-widest text-center">Entrega</p>
              <div className="flex gap-3 mb-6">
                <button onClick={() => setDelivery('retiro')} className={`flex-1 py-4 rounded-2xl font-black text-[11px] uppercase transition-all ${delivery === 'retiro' ? 'bg-black text-[#d4af37]' : 'bg-white border text-slate-400'}`}>RETIRO</button>
                <button onClick={() => setDelivery('envio')} className={`flex-1 py-4 rounded-2xl font-black text-[11px] uppercase transition-all ${delivery === 'envio' ? 'bg-black text-[#d4af37]' : 'bg-white border text-slate-400'}`}>ENVÍO</button>
              </div>
              {delivery === 'envio' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-4">
                  <input type="text" placeholder="Calle y número" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-[#d4af37]" />
                  <input type="text" placeholder="Barrio / Localidad" value={address.zone} onChange={(e) => setAddress({...address, zone: e.target.value})} className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-[#d4af37]" />
                </div>
              )}
            </div>

            <button onClick={handleCheckout} className="w-full bg-[#25D366] text-white py-6 rounded-[2.5rem] font-black text-sm uppercase flex justify-center items-center gap-3 shadow-xl active:scale-95 transition-all">
              <IconCart /> ENVIAR PEDIDO A WHATSAPP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}