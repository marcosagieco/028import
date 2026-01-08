"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// --- CONFIGURACIÓN DE LA TIENDA ---
const CONFIG = {
  whatsappNumber: "5491155669960",
  brandName: "028",
  brandSuffix: "import",
  currencySymbol: "$",
  shippingText: "Espero confirmacion para abonar",
  bannerImage: "https://i.postimg.cc/GtQfRVK4/028banner.jpg",
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png"
};

const productsDB = [
  { id: 1, name: "BAJA SPLASH", price: 27000, category: "Vapes", tag: "Nuevo", image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png", desc: "Sabor Premium Importado" },
  { id: 2, name: "BLUE RAZZ ICE", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/s2Tmw67w/BLUE-RAZZ-ICE.webp", desc: "Sabor Premium Importado" },
  { id: 3, name: "CHERRY FUSE", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/yd5PzDfx/CHERRY-FUSE.png", desc: "Sabor Premium Importado" },
  { id: 4, name: "CHERRY STRAZZ", price: 27000, category: "Vapes", tag: "Destacado", image: "https://i.postimg.cc/7PFVsTG2/CHERRY-STRAZZ.jpg", desc: "Sabor Premium Importado" },
  { id: 5, name: "DOUBLE APPLE ICE", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/QN9mJqtk/DOUBLE-APPLE-ICE.webp", desc: "Sabor Premium Importado" },
  { id: 6, name: "DRAGON STRAWNANA", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/9X6p8qRB/DRAGON-STRAWNANA.png", desc: "Sabor Premium Importado" },
  { id: 7, name: "GRAPE ICE", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/hPV0HPTw/GRAPE-ICE.webp", desc: "Sabor Premium Importado" },
  { id: 8, name: "MANGO MAGIC", price: 27000, category: "Vapes", tag: "Best Seller", image: "https://i.postimg.cc/tCFzLCFC/MANGO-MAGIC.png", desc: "Sabor Premium Importado" },
  { id: 9, name: "PEACH", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/4xZ1Zk1f/PEACH.webp", desc: "Sabor Premium Importado" },
  { id: 10, name: "SCARY BERRY", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/K8F5FS5D/SCARY-BERRY.png", desc: "Sabor Premium Importado" },
  { id: 11, name: "SOUR LUSH GUMMY", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/P54Q536R/SOUR-LUSH-GUMMY.png", desc: "Sabor Premium Importado" },
  { id: 12, name: "STRAWBERRY DRAGON FRUIT", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/QMdk9QwW/STRAWBERRY-DRAGON-FRUIT.png", desc: "Sabor Premium Importado" },
  { id: 13, name: "STRAWBERRY ICE", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/7Lt1gCrC/STRAWBERRY-ICE.png", desc: "Sabor Premium Importado" },
  { id: 14, name: "STRAWBERRY WATERMELON", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/MG30ycJD/STRAWBERRY-WATERMELON.webp", desc: "Sabor Premium Importado" },
  { id: 15, name: "SUMMER SPLASH", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/LXqtvHmV/SUMMER-SPLASH.png", desc: "Sabor Premium Importado" },
  { id: 16, name: "TIGERS BLOOD", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/3RyX9K3P/TIGERS-BLOOD.jpg", desc: "Sabor Premium Importado" },
  { id: 17, name: "WATERMELON ICE", price: 27000, category: "Vapes", tag: "Refrescante", image: "https://i.postimg.cc/63DdmD3s/WATERMELON-ICE.webp", desc: "Sabor Premium Importado" }
];

export default function Home() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('retiro');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('');
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Instancias de Firebase
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
    if (firebaseRefs.auth) {
      signInAnonymously(firebaseRefs.auth)
        .then(() => setFirebaseReady(true))
        .catch(() => setFirebaseReady(true)); // Continuar aunque falle auth para no bloquear al usuario

      const unsubscribe = onAuthStateChanged(firebaseRefs.auth, (u) => setUser(u));
      return () => unsubscribe();
    }
  }, [firebaseRefs]);

  const formatPrice = (n) => n ? n.toLocaleString('es-AR') : '0';
  const getTotalItems = () => cart.reduce((acc, item) => acc + item.qty, 0);
  const getUnitPromoPrice = () => {
    const count = getTotalItems();
    if (count >= 5) return 24500;
    if (count >= 2) return 26000;
    return 27000;
  };
  const calculateTotal = () => cart.reduce((acc, item) => acc + (item.qty * getUnitPromoPrice()), 0);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
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

    const unitPrice = getUnitPromoPrice();
    const finalTotal = calculateTotal();
    
    let msg = `Hola *${CONFIG.brandName}*, mi pedido:\n`;
    cart.forEach(item => {
      msg += `- ${item.qty}x ${item.name} ($${formatPrice(unitPrice)} c/u)\n`;
    });
    msg += `\n*TOTAL: ${CONFIG.currencySymbol}${formatPrice(finalTotal)}*\n`;
    msg += deliveryMethod === 'envio' ? `*ENVIO:* ${address}, ${zone}\n` : `*RETIRO EN LOCAL*\n`;

    const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;

    try {
      if (firebaseRefs.db) {
        await addDoc(collection(firebaseRefs.db, 'orders'), {
          userId: user?.uid || "anon",
          items: cart.map(i => ({ name: i.name, qty: i.qty, price: unitPrice })),
          total: finalTotal,
          delivery: deliveryMethod,
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Error al guardar pedido:", e);
    } finally {
      // Redirección inmediata
      window.location.href = whatsappUrl;
    }
  };

  return (
    <div className="bg-[#f4f4f4] text-[#1a1a1a] min-h-screen font-sans pb-24">
      <nav className="bg-[#121212] py-3 px-4 sticky top-0 z-40 border-b border-[#d4af37]/30 text-white shadow-xl">
        <div className="container mx-auto flex justify-between items-center">
          <img src={CONFIG.logoImage} alt="028 Logo" className="h-10 md:h-12 w-auto object-contain" />
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-xl p-2">
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-[#121212] p-6 flex flex-col gap-4 text-center font-bold border-t border-[#d4af37]/20 shadow-2xl">
            <a href="#catalogo" onClick={() => setIsMenuOpen(false)} className="hover:text-[#d4af37] transition-colors">CATÁLOGO</a>
            <button onClick={() => {setIsCartOpen(true); setIsMenuOpen(false)}} className="hover:text-[#d4af37] transition-colors uppercase">MI CARRITO</button>
          </div>
        )}
      </nav>

      <header className="relative h-[30vh] md:h-[45vh] flex items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{backgroundImage: `url(${CONFIG.bannerImage})`}} />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-7xl font-bold text-[#d4af37] tracking-tighter uppercase drop-shadow-2xl">
            {CONFIG.brandName}{CONFIG.brandSuffix}
          </h1>
          <p className="text-white text-[10px] md:text-xs tracking-[0.4em] font-light mt-2 uppercase opacity-80">Premium Boutique & Lifestyle</p>
        </div>
      </header>

      <section id="catalogo" className="py-8 px-4 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-8 gap-3">
          <h2 className="text-xl md:text-2xl font-black border-l-4 border-[#d4af37] pl-4 uppercase tracking-tight">Selección Exclusiva</h2>
          <div className="bg-[#d4af37] text-black px-3 py-1 text-[10px] font-black rounded uppercase tracking-widest">
            2+ un: $26.000 | 5+ un: $24.500
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {productsDB.map(p => {
            const inCart = cart.find(i => i.id === p.id);
            return (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col hover:shadow-lg transition-all duration-300">
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  {p.tag && (
                    <span className="absolute top-2 left-2 bg-black text-[#d4af37] text-[8px] font-black px-2 py-1 uppercase rounded-sm">
                      {p.tag}
                    </span>
                  )}
                </div>
                <div className="p-3 md:p-4 flex-grow flex flex-col">
                  <h3 className="font-bold text-[11px] md:text-sm uppercase mb-1 text-gray-800 line-clamp-1">{p.name}</h3>
                  <div className="mt-auto">
                    <p className="text-[#d4af37] font-black text-base md:text-lg mb-3 tracking-tighter">{CONFIG.currencySymbol}{formatPrice(p.price)}</p>
                    {inCart ? (
                      <div className="flex items-center justify-between bg-black text-white h-9 rounded-md font-bold text-xs">
                        <button className="w-9 h-full" onClick={() => changeQty(p.id, -1)}>-</button>
                        <span>{inCart.qty}</span>
                        <button className="w-9 h-full" onClick={() => addToCart(p)}>+</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(p)} 
                        className="w-full bg-[#d4af37] hover:bg-black hover:text-[#d4af37] py-2.5 text-[10px] font-bold uppercase rounded-md transition-all"
                      >
                        Añadir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-[#121212]/95 backdrop-blur-md p-4 border-t border-[#d4af37]/40 text-white flex justify-between items-center z-50 shadow-2xl">
          <div>
            <p className="text-[9px] text-[#d4af37] font-black uppercase tracking-widest">Total</p>
            <p className="text-xl font-black tracking-tighter">{CONFIG.currencySymbol}{formatPrice(calculateTotal())}</p>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="bg-[#d4af37] text-black px-6 py-2.5 rounded-md font-black text-[11px] uppercase"
          >
            Ver Pedido
          </button>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/80" onClick={() => setIsCartOpen(false)} />
          <div className="relative bg-white p-6 rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase">Resumen</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-3">
                    <img src={item.image} className="w-10 h-10 rounded object-cover" alt="" />
                    <div>
                      <p className="font-bold text-[11px] uppercase">{item.name}</p>
                      <p className="text-[9px] text-gray-400">{item.qty} un.</p>
                    </div>
                  </div>
                  <p className="font-black text-[#d4af37] text-xs">{CONFIG.currencySymbol}{formatPrice(item.qty * getUnitPromoPrice())}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <p className="font-bold text-[10px] mb-3 uppercase text-gray-500">Opciones de Entrega</p>
              <div className="flex gap-3 mb-4 text-[10px] font-bold">
                <button 
                  onClick={() => setDeliveryMethod('retiro')}
                  className={`flex-1 py-2 rounded-lg border ${deliveryMethod === 'retiro' ? 'bg-black text-white' : 'bg-white text-gray-400'}`}
                >
                  Retiro
                </button>
                <button 
                  onClick={() => setDeliveryMethod('envio')}
                  className={`flex-1 py-2 rounded-lg border ${deliveryMethod === 'envio' ? 'bg-black text-white' : 'bg-white text-gray-400'}`}
                >
                  Envío
                </button>
              </div>
              {deliveryMethod === 'envio' && (
                <div className="flex flex-col gap-2">
                  <input type="text" placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} className="p-3 border rounded-lg text-xs outline-none focus:border-[#d4af37]" />
                  <input type="text" placeholder="Barrio" value={zone} onChange={(e) => setZone(e.target.value)} className="p-3 border rounded-lg text-xs outline-none focus:border-[#d4af37]" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
               <div className="flex justify-between items-baseline">
                  <span className="font-bold text-gray-400 text-[10px] uppercase">Final</span>
                  <span className="font-black text-2xl text-black tracking-tighter">{CONFIG.currencySymbol}{formatPrice(calculateTotal())}</span>
               </div>
               <button 
                onClick={handleCheckout} 
                disabled={isSending}
                className={`w-full ${isSending ? 'bg-gray-400' : 'bg-[#25D366]'} text-white font-black py-4 rounded-xl uppercase text-xs flex justify-center items-center gap-2 transition-all`}
              >
                {isSending ? (
                  <>Cargando...</>
                ) : (
                  <>
                    <i className="fab fa-whatsapp text-xl"></i> Finalizar por WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FontAwesome Loader */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
}