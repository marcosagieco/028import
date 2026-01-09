"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from "firebase/auth";

// --- ICONOS SVG NATIVOS (Para evitar errores de dependencias en Vercel) ---
const IconCart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.56-7.43H5.12"/></svg>
);
const IconMenu = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
);
const IconX = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const IconPlus = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
);
const IconMinus = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"/></svg>
);

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
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
const appId = typeof __app_id !== 'undefined' ? __app_id : (firebaseConfig.projectId || '028import');

// --- CONFIGURACIÓN DE TIENDA ---
const CONFIG = {
  whatsappNumber: "5491155669960",
  brandName: "028",
  currencySymbol: "$",
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

export default function App() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('TODOS');
  const [user, setUser] = useState(null);

  // 1. Autenticación (Regla 3)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Init Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Sincronización con Lógica de ID String (Coincide con Admin)
  useEffect(() => {
    if (!user) return;
    
    // Ruta estricta obligatoria (Regla 1)
    const prodsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    
    const unsub = onSnapshot(prodsRef, (snap) => {
      const dbData = {};
      snap.forEach(d => {
        dbData[d.id] = d.data(); // d.id es el String de Firebase
      });
      
      setProducts(prev => INITIAL_PRODUCTS.map(p => {
        const remote = dbData[p.id.toString()]; 
        return {
          ...p,
          price: remote?.price ?? p.price,
          inStock: remote?.inStock ?? true
        };
      }));
    }, (error) => console.error("Firestore sync error:", error));

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
      if (exists) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0));
  };

  const handleCheckout = async () => {
    if (!user) return;
    try {
      const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
      await addDoc(ordersRef, {
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: getUnitPrice(i) })),
        total: totalCart,
        createdAt: serverTimestamp(),
        status: 'pendiente'
      });

      const msg = `*Pedido 028*\n${cart.map(i => `• ${i.qty}x ${i.name} ($${formatP(getUnitPrice(i))})`).join('\n')}\n\n*Total:* $${formatP(totalCart)}`;
      window.location.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans pb-24">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');
        body { font-family: 'Montserrat', sans-serif; }
      `}</style>

      {/* Navbar */}
      <nav className="bg-[#0a0a0a] p-4 sticky top-0 z-50 border-b border-[#d4af37]/20 flex justify-between items-center shadow-xl">
        <img src={CONFIG.logoImage} className="h-10 object-contain" alt="028" />
        <div className="flex items-center gap-4">
          <button onClick={() => setIsCartOpen(true)} className="text-[#d4af37] relative p-2">
            <IconCart />
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 bg-white text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-black">
                {cart.reduce((a, b) => a + b.qty, 0)}
              </span>
            )}
          </button>
          <button onClick={() => setIsMenuOpen(true)} className="text-[#d4af37] p-2">
            <IconMenu />
          </button>
        </div>
      </nav>

      {/* Menú Lateral */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center gap-8 p-10 animate-in fade-in duration-300">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white p-2"><IconX /></button>
          <button onClick={() => setIsMenuOpen(false)} className="text-white font-black text-3xl hover:text-[#d4af37] transition-all">TIENDA</button>
          <button onClick={() => {setIsCartOpen(true); setIsMenuOpen(false)}} className="text-white font-black text-3xl hover:text-[#d4af37] transition-all tracking-tighter">MI CARRITO</button>
          <a href="/admin" className="text-slate-700 font-bold text-xs tracking-widest mt-10 hover:text-white border border-slate-900 px-8 py-3 rounded-full uppercase transition-colors">Admin Panel</a>
        </div>
      )}

      {/* Banner Optimizado (Opacidad 70% y encuadre 30%) */}
      <header className="relative h-[28vh] md:h-[55vh] bg-black overflow-hidden flex items-center justify-center shadow-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-no-repeat opacity-70"
          style={{ backgroundImage: `url(${CONFIG.bannerImage})`, backgroundPosition: 'center 30%' }}
        />
      </header>

      {/* Categorías Sticky */}
      <div className="sticky top-[73px] z-40 bg-white/95 backdrop-blur-md border-b flex overflow-x-auto no-scrollbar shadow-sm">
        {['TODOS', 'VAPES NICOTINA', 'VAPES THC', 'CARGADORES'].map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-5 px-6 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'border-b-[3px] border-[#d4af37] text-black' : 'text-gray-400'}`}
          >
            {cat.replace('VAPES ', '')}
          </button>
        ))}
      </div>

      {/* Catálogo de Productos */}
      <section className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-10 max-w-7xl mx-auto mt-10">
        {products
          .filter(p => activeCategory === 'TODOS' || p.category === activeCategory)
          .map(p => {
            const inCart = cart.find(i => i.id === p.id);
            return (
              <div key={p.id} className={`bg-white rounded-[2.5rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${p.inStock === false ? 'opacity-60 grayscale' : ''}`}>
                <div className="relative aspect-square bg-slate-50">
                  <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                  {p.inStock === false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <span className="text-white font-black text-[11px] uppercase tracking-tighter bg-rose-600 px-4 py-1.5 rounded-full">AGOTADO</span>
                    </div>
                  )}
                  {p.tag && p.inStock !== false && (
                    <span className="absolute top-4 left-4 bg-black text-[#d4af37] text-[8px] font-black px-3 py-1 rounded-full uppercase shadow-lg">
                      {p.tag}
                    </span>
                  )}
                </div>
                <div className="p-5 md:p-8 flex-grow flex flex-col">
                  <h3 className="font-bold text-[12px] md:text-[14px] uppercase mb-3 line-clamp-2 min-h-[2.5rem] leading-tight text-slate-900">{p.name}</h3>
                  <div className="mt-auto">
                    <p className="font-black text-xl md:text-2xl mb-5 tracking-tighter text-slate-900">${formatP(p.price)}</p>
                    {inCart ? (
                      <div className="flex items-center justify-between bg-black text-white h-12 rounded-3xl font-bold overflow-hidden shadow-xl">
                        <button className="w-12 h-full hover:bg-slate-800 flex items-center justify-center" onClick={() => removeFromCart(p.id)}><IconMinus size={18}/></button>
                        <span className="text-lg">{inCart.qty}</span>
                        <button className="w-12 h-full hover:bg-slate-800 flex items-center justify-center" onClick={() => addToCart(p)}><IconPlus size={18}/></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(p)}
                        disabled={p.inStock === false}
                        className="w-full bg-[#d4af37] text-black py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {p.inStock === false ? 'SIN STOCK' : 'Añadir al Carrito'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </section>

      {/* Botón Flotante de Pedido */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-[#0a0a0a]/98 backdrop-blur-xl p-6 border-t border-[#d4af37]/30 text-white flex justify-between items-center z-50 animate-in slide-in-from-bottom duration-500 shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
          <div>
            <p className="text-[10px] text-[#d4af37] font-black mb-1 uppercase tracking-widest">Total del pedido</p>
            <p className="text-3xl font-black tracking-tighter">${formatP(totalCart)}</p>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="bg-[#d4af37] text-black px-12 py-4 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-transform"
          >
            Ver Pedido ({cart.reduce((a,b)=>a+b.qty,0)})
          </button>
        </div>
      )}

      {/* Modal Carrito Completo */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsCartOpen(false)} />
          <div className="relative bg-white p-10 rounded-t-[3.5rem] max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-black">Mi Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-300 hover:text-black p-2"><IconX /></button>
            </div>
            
            <div className="space-y-8 mb-10">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b border-slate-50 pb-6">
                  <div className="flex items-center gap-5">
                    <img src={item.image} className="w-20 h-20 rounded-[1.5rem] object-cover shadow-sm" alt="" />
                    <div>
                      <p className="font-black text-sm uppercase text-slate-900 leading-tight mb-1">{item.name}</p>
                      <p className="text-[10px] text-[#d4af37] font-black uppercase">{item.category}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <button onClick={() => removeFromCart(item.id)} className="w-9 h-9 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100"><IconMinus size={16}/></button>
                        <span className="text-lg font-black w-6 text-center">{item.qty}</span>
                        <button onClick={() => addToCart(item)} className="w-9 h-9 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100"><IconPlus size={16}/></button>
                      </div>
                    </div>
                  </div>
                  <p className="font-black text-slate-900 text-xl tracking-tighter">${formatP(item.qty * getUnitPrice(item))}</p>
                </div>
              ))}
            </div>

            <button 
              onClick={handleCheckout} 
              className="w-full bg-[#25D366] text-white py-6 rounded-[2.5rem] font-black text-sm uppercase flex justify-center items-center gap-4 shadow-[0_20px_50px_rgba(37,211,102,0.3)] active:scale-95 transition-all tracking-widest"
            >
              <IconCart /> ENVIAR PEDIDO A WHATSAPP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}