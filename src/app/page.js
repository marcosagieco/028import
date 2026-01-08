"use client";

import React, { useState, useEffect } from 'react';
// Importamos solo lo necesario de Firebase
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// --- CONFIGURACIÓN DE FIREBASE (EXTERNA PARA EVITAR DUPLICADOS) ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicialización segura de Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

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

  useEffect(() => {
    // Autenticación anónima al cargar
    signInAnonymously(auth).catch(() => {});
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

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
    if (!user) return alert("Cargando sesión segura...");
    if (deliveryMethod === 'envio' && (!address.trim() || !zone.trim())) return alert("Por favor completa los datos de envío.");

    const unitPrice = getUnitPromoPrice();
    const finalTotal = calculateTotal();
    
    let msg = `Hola *${CONFIG.brandName}*, mi pedido:\n`;
    cart.forEach(item => {
      msg += `- ${item.qty}x ${item.name} ($${formatPrice(unitPrice)} c/u)\n`;
    });
    msg += `\n*TOTAL: ${CONFIG.currencySymbol}${formatPrice(finalTotal)}*\n`;
    msg += deliveryMethod === 'envio' ? `*ENVIO:* ${address}, ${zone}\n` : `*RETIRO EN LOCAL*\n`;

    try {
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: unitPrice })),
        total: finalTotal,
        delivery: deliveryMethod,
        createdAt: serverTimestamp()
      });
      window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (e) {
      console.error("Error al guardar pedido:", e);
      // Intentamos abrir WhatsApp de todos modos si falla la base de datos
      window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  return (
    <div className="bg-[#f4f4f4] text-[#1a1a1a] min-h-screen font-sans pb-24">
      {/* Navbar con Logo */}
      <nav className="bg-[#121212] py-3 px-4 sticky top-0 z-40 border-b border-[#d4af37]/30 text-white shadow-xl">
        <div className="container mx-auto flex justify-between items-center">
          <img src={CONFIG.logoImage} alt="028 Logo" className="h-12 w-auto object-contain" />
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-xl p-2">
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-[#121212] p-6 flex flex-col gap-4 text-center font-bold border-t border-[#d4af37]/20 shadow-2xl animate-in fade-in slide-in-from-top-2">
            <a href="#catalogo" onClick={() => setIsMenuOpen(false)} className="hover:text-[#d4af37] transition-colors">CATÁLOGO</a>
            <button onClick={() => {setIsCartOpen(true); setIsMenuOpen(false)}} className="hover:text-[#d4af37] transition-colors uppercase">MI CARRITO</button>
          </div>
        )}
      </nav>

      {/* Banner Principal */}
      <header className="relative h-[35vh] md:h-[50vh] flex items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40 scale-105" style={{backgroundImage: `url(${CONFIG.bannerImage})`}} />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-[#d4af37] tracking-tighter uppercase drop-shadow-2xl">
            {CONFIG.brandName}{CONFIG.brandSuffix}
          </h1>
          <p className="text-white text-xs md:text-sm tracking-[0.3em] font-light mt-2 uppercase opacity-80">Premium Boutique & Lifestyle</p>
        </div>
      </header>

      {/* Catálogo de Productos */}
      <section id="catalogo" className="py-10 px-4 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-8 gap-2">
          <h2 className="text-2xl font-bold border-l-4 border-[#d4af37] pl-4 uppercase tracking-tight">Catálogo Exclusivo</h2>
          <div className="bg-[#d4af37] text-black px-3 py-1 text-[10px] md:text-xs font-black rounded uppercase tracking-widest shadow-lg">
            2+ unidades: $26.000 | 5+ unidades: $24.500
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productsDB.map(p => {
            const inCart = cart.find(i => i.id === p.id);
            return (
              <div key={p.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  {p.tag && (
                    <span className="absolute top-3 left-3 bg-[#d4af37] text-black text-[9px] font-black px-2 py-1 uppercase rounded-sm shadow-md">
                      {p.tag}
                    </span>
                  )}
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="font-bold text-xs md:text-sm uppercase mb-1 text-gray-800 line-clamp-1">{p.name}</h3>
                  <p className="text-[10px] text-gray-400 mb-3 italic">Imported Quality</p>
                  <div className="mt-auto">
                    <p className="text-[#d4af37] font-black text-lg mb-3 tracking-tighter">{CONFIG.currencySymbol}{formatPrice(p.price)}</p>
                    {inCart ? (
                      <div className="flex items-center justify-between bg-black text-white h-10 rounded-md overflow-hidden shadow-inner font-bold">
                        <button className="w-10 h-full hover:bg-gray-800 transition-colors" onClick={() => changeQty(p.id, -1)}>-</button>
                        <span className="text-sm">{inCart.qty}</span>
                        <button className="w-10 h-full hover:bg-gray-800 transition-colors" onClick={() => addToCart(p)}>+</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(p)} 
                        className="w-full bg-[#d4af37] hover:bg-black hover:text-[#d4af37] py-3 text-[10px] font-bold uppercase rounded-md transition-all duration-300 shadow-md"
                      >
                        Añadir al Carrito
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Flotante del Carrito */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-[#121212]/95 backdrop-blur-md p-5 border-t border-[#d4af37]/40 text-white flex justify-between items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-full duration-500">
          <div>
            <p className="text-[9px] text-[#d4af37] font-black uppercase tracking-[0.2em] mb-1">Total Estimado</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black tracking-tighter">{CONFIG.currencySymbol}{formatPrice(calculateTotal())}</p>
              <span className="text-[10px] text-gray-400">({getTotalItems()} ítems)</span>
            </div>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="bg-[#d4af37] text-black px-8 py-3 rounded-md font-black text-xs uppercase shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all"
          >
            Pagar Pedido
          </button>
        </div>
      )}

      {/* Modal del Carrito Pro */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="relative bg-white p-6 rounded-t-[2.5rem] max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" onClick={() => setIsCartOpen(false)} />
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tight">Mi Selección</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-300 hover:text-black transition-colors">
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            <div className="space-y-4 mb-8">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-xs md:text-sm uppercase text-gray-800">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{item.qty} unidad{item.qty > 1 ? 'es' : ''}</p>
                    </div>
                  </div>
                  <p className="font-black text-[#d4af37] text-sm tracking-tighter">{CONFIG.currencySymbol}{formatPrice(item.qty * getUnitPromoPrice())}</p>
                </div>
              ))}
              {cart.length === 0 && <p className="text-center py-12 text-gray-300 font-medium italic underline decoration-[#d4af37]/30">Tu carrito está esperando ser llenado...</p>}
            </div>

            {/* Opciones de Entrega */}
            {cart.length > 0 && (
              <div className="bg-gray-50 p-5 rounded-2xl mb-8 border border-gray-100 shadow-inner">
                <p className="font-black text-[10px] mb-4 uppercase text-gray-500 tracking-widest">Información de Entrega</p>
                <div className="flex gap-4 mb-5 text-xs font-bold">
                  <button 
                    onClick={() => setDeliveryMethod('retiro')}
                    className={`flex-1 py-3 rounded-xl border transition-all ${deliveryMethod === 'retiro' ? 'bg-black text-white border-black shadow-lg scale-105' : 'bg-white text-gray-400 border-gray-200'}`}
                  >
                    Retiro Local
                  </button>
                  <button 
                    onClick={() => setDeliveryMethod('envio')}
                    className={`flex-1 py-3 rounded-xl border transition-all ${deliveryMethod === 'envio' ? 'bg-black text-white border-black shadow-lg scale-105' : 'bg-white text-gray-400 border-gray-200'}`}
                  >
                    Envío Moto
                  </button>
                </div>
                {deliveryMethod === 'envio' && (
                  <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-300">
                    <input type="text" placeholder="Calle y número exacto" value={address} onChange={(e) => setAddress(e.target.value)} className="p-4 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 ring-[#d4af37]/20 shadow-sm" />
                    <input type="text" placeholder="Barrio / Zona / Localidad" value={zone} onChange={(e) => setZone(e.target.value)} className="p-4 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 ring-[#d4af37]/20 shadow-sm" />
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-4">
               <div className="flex justify-between items-center px-2">
                  <span className="font-bold text-gray-400 text-xs uppercase tracking-widest">Total Final</span>
                  <span className="font-black text-3xl text-black tracking-tighter">{CONFIG.currencySymbol}{formatPrice(calculateTotal())}</span>
               </div>
               <button 
                onClick={handleCheckout} 
                disabled={cart.length === 0}
                className="w-full bg-[#25D366] text-white font-black py-5 rounded-2xl uppercase text-xs flex justify-center items-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-green-200 disabled:grayscale disabled:opacity-50"
              >
                <i className="fab fa-whatsapp text-2xl"></i> Confirmar Pedido
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