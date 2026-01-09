"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

// --- CONFIGURACIÓN DE LA TIENDA ---
const CONFIG = {
  whatsappNumber: "5491155669960",
  brandName: "028",
  brandSuffix: "import",
  currencySymbol: "$",
  shippingText: "Espero confirmacion para abonar",
  bannerImage: "https://i.postimg.cc/wBdHsm94/banner-web.jpg", 
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png"
};

const INITIAL_PRODUCTS = [
  // Nicotina
  { id: 1, name: "BAJA SPLASH", price: 27000, category: "VAPES NICOTINA", tag: "Nuevo", image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png" },
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
  // THC
  { id: 18, name: "BLOW THC", price: 60000, category: "VAPES THC", tag: "THC", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp" },
  { id: 19, name: "TORCH 7.5G", price: 53000, category: "VAPES THC", tag: "THC", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png" },
  { id: 20, name: "PHENOM 6G", price: 56000, category: "VAPES THC", tag: "THC", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg" },
  // Cargadores
  { id: 21, name: "CARGADOR 20W", price: 16500, category: "CARGADORES", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg" },
  { id: 22, name: "CARGADOR 35W", price: 20500, category: "CARGADORES", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg" },
  { id: 23, name: "CABLE USB-C A USB-C", price: 13500, category: "CARGADORES", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg" },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M", price: 13500, category: "CARGADORES", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg" }
];

const IconCart = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.56-7.43H5.12"/></svg>;
const IconMenu = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>;
const IconX = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;

export default function Home() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('TODOS');

  const firebase = useMemo(() => {
    if (typeof window === "undefined") return { auth: null, db: null, appId: 'default' };
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };
    if (!config.apiKey) return { auth: null, db: null, appId: '028import' };
    const appInstance = !getApps().length ? initializeApp(config) : getApp();
    return { auth: getAuth(appInstance), db: getFirestore(appInstance), appId: config.projectId || '028import' };
  }, []);

  useEffect(() => {
    if (!firebase.auth) return;
    onAuthStateChanged(firebase.auth, (u) => {
      if (!u) signInAnonymously(firebase.auth).catch(() => {});
      setUser(u);
    });
  }, [firebase.auth]);

  useEffect(() => {
    if (!firebase.db) return;
    const prodsRef = collection(firebase.db, 'artifacts', firebase.appId, 'public', 'data', 'products');
    const unsub = onSnapshot(prodsRef, (snap) => {
      const dbData = {};
      snap.forEach(d => dbData[d.id] = d.data());
      setProducts(prev => prev.map(p => ({
        ...p,
        price: dbData[p.id]?.price ?? p.price,
        inStock: dbData[p.id]?.inStock ?? true
      })));
    });
    return () => unsub();
  }, [firebase.db, firebase.appId]);

  const formatP = (n) => n?.toLocaleString('es-AR');
  const getUnitPrice = (p) => {
    if (p.category !== "VAPES NICOTINA") return p.price;
    const count = cart.filter(i => i.category === "VAPES NICOTINA").reduce((a, b) => a + b.qty, 0);
    return count >= 5 ? 24500 : (count >= 2 ? 26000 : p.price);
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
    if (!firebase.db) return;
    const orderData = { 
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: getUnitPrice(i) })), 
      total: totalCart, 
      createdAt: serverTimestamp() 
    };
    await addDoc(collection(firebase.db, 'artifacts', firebase.appId, 'public', 'data', 'orders'), orderData);
    const msg = `*Pedido 028*\n${cart.map(i => `• ${i.qty}x ${i.name}`).join('\n')}\n*Total:* $${formatP(totalCart)}`;
    window.location.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="bg-[#f4f4f4] min-h-screen font-sans pb-24">
      <nav className="bg-[#121212] py-3 px-4 sticky top-0 z-50 border-b border-[#d4af37]/30 text-white flex justify-between items-center shadow-xl">
        <img src={CONFIG.logoImage} alt="Logo" className="h-10 w-auto object-contain" />
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#d4af37] p-2">{isMenuOpen ? <IconX /> : <IconMenu />}</button>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-[#121212]/95 flex flex-col items-center justify-center gap-6 p-10">
          <button onClick={() => setIsMenuOpen(false)} className="text-white font-bold text-2xl uppercase">Tienda</button>
          <button onClick={() => {setIsCartOpen(true); setIsMenuOpen(false)}} className="text-white font-bold text-2xl uppercase">Carrito</button>
          <a href="/admin" className="text-gray-500 font-bold text-sm tracking-widest mt-10 border border-gray-800 px-6 py-2 rounded-full uppercase">Acceso Admin</a>
        </div>
      )}

      <header className="relative h-[25vh] md:h-[45vh] bg-black overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-cover bg-no-repeat opacity-70" style={{ backgroundImage: `url(${CONFIG.bannerImage})`, backgroundPosition: 'center 30%' }} />
      </header>

      <div className="sticky top-[64px] z-40 bg-white/90 backdrop-blur-md border-b flex overflow-x-auto no-scrollbar shadow-sm">
        {['TODOS', 'VAPES NICOTINA', 'VAPES THC', 'CARGADORES'].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-1 py-4 px-6 text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'border-b-2 border-[#d4af37] text-black' : 'text-gray-400'}`}>
            {cat.replace('VAPES ', '')}
          </button>
        ))}
      </div>

      <section className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto mt-8">
        {products.filter(p => activeCategory === 'TODOS' || p.category === activeCategory).map(p => (
          <div key={p.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-lg transition-all ${p.inStock === false ? 'opacity-60 grayscale' : ''}`}>
            <div className="relative aspect-square">
              <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
              {p.inStock === false && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><span className="text-white font-black text-xs uppercase">SIN STOCK</span></div>}
            </div>
            <div className="p-4 flex-grow flex flex-col">
              <h3 className="font-bold text-[11px] md:text-sm uppercase mb-1 text-gray-800 line-clamp-2 leading-tight h-10">{p.name}</h3>
              <p className="font-black text-lg mb-4 text-[#d4af37]">${formatP(p.price)}</p>
              <button onClick={() => addToCart(p)} disabled={p.inStock === false} className="w-full bg-[#d4af37] text-black py-3 rounded-xl font-black text-[10px] uppercase transition-all active:scale-95 disabled:bg-gray-200">
                {p.inStock === false ? 'Agotado' : 'Añadir'}
              </button>
            </div>
          </div>
        ))}
      </section>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-[#121212]/95 p-4 border-t border-[#d4af37]/30 text-white flex justify-between items-center z-50 shadow-2xl">
          <div><p className="text-[10px] text-[#d4af37] font-black uppercase tracking-widest">Total</p><p className="text-xl font-black">${formatP(totalCart)}</p></div>
          <button onClick={() => setIsCartOpen(true)} className="bg-[#d4af37] text-black px-6 py-3 rounded-xl font-black text-[11px] uppercase shadow-lg">Ver Pedido</button>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/80" onClick={() => setIsCartOpen(false)} />
          <div className="relative bg-white p-6 rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase">Mi Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400"><IconX /></button>
            </div>
            <div className="space-y-4 mb-8">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b pb-4">
                  <div className="flex items-center gap-3">
                    <img src={item.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                    <div><p className="font-black text-[10px] uppercase">{item.name}</p><div className="flex items-center gap-2 mt-1">
                      <button onClick={() => changeQty(item.id, -1)} className="bg-gray-100 p-1 rounded px-2">-</button>
                      <span className="font-bold">{item.qty}</span>
                      <button onClick={() => addToCart(item)} className="bg-gray-100 p-1 rounded px-2">+</button>
                    </div></div>
                  </div>
                  <p className="font-black text-sm">${formatP(item.qty * getUnitPrice(item))}</p>
                </div>
              ))}
            </div>
            <button onClick={handleCheckout} className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase flex justify-center items-center gap-2 shadow-lg">
              ENVIAR A WHATSAPP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}