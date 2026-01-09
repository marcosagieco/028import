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

const ALL_PRODUCTS_BASE = [
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

// ICONOS SVG
const IconCart = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.56-7.43H5.12"/></svg>;
const IconMenu = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>;
const IconX = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;

export default function Home() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState(ALL_PRODUCTS_BASE);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('TODOS');
  const [deliveryMethod, setDeliveryMethod] = useState('retiro');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('');

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsubAuth = onAuthStateChanged(auth, setUser);

    const prodsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const unsubProds = onSnapshot(prodsRef, (snap) => {
      const dbData = {};
      snap.forEach(d => dbData[d.id] = d.data());
      
      setProducts(prev => ALL_PRODUCTS_BASE.map(p => {
        const remote = dbData[p.id.toString()];
        return {
          ...p,
          price: remote?.price || p.price,
          inStock: remote?.inStock ?? true
        };
      }));
    });

    return () => { unsubAuth(); unsubProds(); };
  }, []);

  const formatP = (n) => n?.toLocaleString('es-AR');
  
  // Lógica de Precios Promo solo para Nicotina
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
      const ex = prev.find(i => i.id === p.id);
      return ex ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const handleCheckout = async () => {
    if (!user) return;
    try {
      const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
      await addDoc(ordersRef, {
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: getUnitPrice(i) })),
        total: totalCart,
        delivery: deliveryMethod,
        address, zone,
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      const msg = `*Pedido 028*\n${cart.map(i => `• ${i.qty}x ${i.name} ($${formatP(getUnitPrice(i))})`).join('\n')}\n\n*Total:* $${formatP(totalCart)}`;
      window.location.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans pb-24">
      {/* Estilos Montserrat */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap'); body { font-family: 'Montserrat', sans-serif; }`}</style>

      {/* Navbar */}
      <nav className="bg-[#0a0a0a] p-4 sticky top-0 z-50 border-b border-[#d4af37]/20 flex justify-between items-center shadow-xl">
        <img src={CONFIG.logoImage} className="h-10" alt="028 Logo" />
        <button onClick={() => setIsMenuOpen(true)} className="text-[#d4af37] p-2">
          <IconMenu />
        </button>
      </nav>

      {/* Menú */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center gap-8 animate-in fade-in duration-300">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white p-2"><IconX /></button>
          <button onClick={() => setIsMenuOpen(false)} className="text-white font-black text-3xl hover:text-[#d4af37]">TIENDA</button>
          <button onClick={() => {setIsCartOpen(true); setIsMenuOpen(false)}} className="text-white font-black text-3xl hover:text-[#d4af37]">MI CARRITO</button>
          <a href="/admin" className="text-gray-600 font-bold border border-gray-800 px-8 py-3 rounded-full mt-10">ADMIN</a>
        </div>
      )}

      {/* Banner */}
      <header className="relative h-[25vh] md:h-[50vh] bg-black overflow-hidden flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-no-repeat opacity-70"
          style={{ backgroundImage: `url(${CONFIG.bannerImage})`, backgroundPosition: 'center 30%' }}
        />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-8xl font-black text-[#d4af37] tracking-tighter uppercase drop-shadow-2xl">028IMPORT</h1>
        </div>
      </header>

      {/* Categorías Sticky */}
      <div className="sticky top-[73px] z-40 bg-white/90 backdrop-blur-md border-b flex overflow-x-auto no-scrollbar shadow-sm">
        {['TODOS', 'VAPES NICOTINA', 'VAPES THC', 'CARGADORES'].map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-4 px-6 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'border-b-2 border-[#d4af37] text-black' : 'text-gray-400'}`}
          >
            {cat.replace('VAPES ', '')}
          </button>
        ))}
      </div>

      {/* Grilla */}
      <section className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto mt-8">
        {products
          .filter(p => activeCategory === 'TODOS' || p.category === activeCategory)
          .map(p => {
            const inCart = cart.find(i => i.id === p.id);
            return (
              <div key={p.id} className={`bg-white rounded-3xl overflow-hidden shadow-sm flex flex-col hover:shadow-xl transition-all ${!p.inStock ? 'opacity-60 grayscale' : ''}`}>
                <div className="relative aspect-square">
                  <img src={p.image} className="w-full h-full object-cover" alt="" />
                  {!p.inStock && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-black text-xs">SIN STOCK</div>}
                  {p.tag && p.inStock && <span className="absolute top-3 left-3 bg-black text-[#d4af37] text-[8px] font-black px-2 py-1 rounded-sm uppercase">{p.tag}</span>}
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="font-bold text-[11px] md:text-xs uppercase mb-1 line-clamp-2 h-10">{p.name}</h3>
                  <p className="font-black text-lg mb-4 text-slate-900">${formatP(p.price)}</p>
                  <button 
                    onClick={() => addToCart(p)}
                    disabled={!p.inStock}
                    className="mt-auto bg-[#d4af37] text-black py-3 rounded-xl font-black text-[10px] uppercase disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {!p.inStock ? 'AGOTADO' : 'AÑADIR'}
                  </button>
                </div>
              </div>
            );
          })}
      </section>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-[#121212] p-6 border-t border-[#d4af37]/30 text-white flex justify-between items-center z-50 shadow-2xl">
          <div><p className="text-2xl font-black tracking-tighter">${formatP(totalCart)}</p></div>
          <button onClick={() => setIsCartOpen(true)} className="bg-[#d4af37] text-black px-8 py-4 rounded-2xl font-black text-[11px] uppercase shadow-lg">Ver Pedido</button>
        </div>
      )}

      {/* Modal Carrito */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/80" onClick={() => setIsCartOpen(false)} />
          <div className="relative bg-white p-6 rounded-t-[3rem] max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-black uppercase mb-6 flex justify-between items-center">Pedido <button onClick={() => setIsCartOpen(false)}><IconX /></button></h2>
            <div className="space-y-4 mb-8">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-3">
                    <img src={item.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                    <div><p className="font-black text-[10px] uppercase leading-tight">{item.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => changeQty(item.id, -1)} className="bg-slate-100 w-6 h-6 flex items-center justify-center rounded">-</button>
                      <span className="font-bold text-xs">{item.qty}</span>
                      <button onClick={() => addToCart(item)} className="bg-slate-100 w-6 h-6 flex items-center justify-center rounded">+</button>
                    </div></div>
                  </div>
                  <p className="font-black text-sm">${formatP(item.qty * getUnitPrice(item))}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-5 rounded-3xl mb-8">
              <p className="text-[10px] font-black uppercase mb-3 text-slate-400">Entrega</p>
              <div className="flex gap-3 mb-4">
                <button onClick={() => setDeliveryMethod('retiro')} className={`flex-1 py-3 rounded-xl font-bold text-[11px] uppercase ${deliveryMethod === 'retiro' ? 'bg-black text-white' : 'bg-white border text-slate-400'}`}>Retiro</button>
                <button onClick={() => setDeliveryMethod('envio')} className={`flex-1 py-3 rounded-xl font-bold text-[11px] uppercase ${deliveryMethod === 'envio' ? 'bg-black text-white' : 'bg-white border text-slate-400'}`}>Envío</button>
              </div>
              {deliveryMethod === 'envio' && (
                <div className="flex flex-col gap-2">
                  <input type="text" placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} className="p-3 border rounded-xl text-xs outline-none focus:border-[#d4af37]" />
                  <input type="text" placeholder="Localidad" value={zone} onChange={(e) => setZone(e.target.value)} className="p-3 border rounded-xl text-xs outline-none focus:border-[#d4af37]" />
                </div>
              )}
            </div>

            <button onClick={handleCheckout} className="w-full bg-[#25D366] text-white py-5 rounded-[2rem] font-black text-sm uppercase flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all">
              ENVIAR A WHATSAPP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}