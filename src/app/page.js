"use client";

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// Configuración de la Tienda
const CONFIG = {
  whatsappNumber: "5491155669960",
  brandName: "028",
  brandSuffix: "import",
  currencySymbol: "$",
  shippingText: "Espero confirmacion para abonar",
  bannerImage: "https://i.postimg.cc/GtQfRVK4/028banner.jpg",
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png"
};

// Base de datos de productos
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
  // --- ESTADOS (REACT) ---
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('retiro');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('');
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- FIREBASE INIT ---
  useEffect(() => {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };

    if (!getApps().length) {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      signInAnonymously(auth).catch(console.error);
      onAuthStateChanged(auth, setUser);
    }
  }, []);

  // --- LÓGICA DE NEGOCIO ---
  const formatPrice = (n) => n.toLocaleString('es-AR');

  const getTotalItems = () => cart.reduce((acc, item) => acc + item.qty, 0);

  const getUnitPromoPrice = () => {
    const count = getTotalItems();
    if (count >= 5) return 24500;
    if (count >= 2) return 26000;
    return 27000;
  };

  const calculateTotal = () => {
    const price = getUnitPromoPrice();
    return cart.reduce((acc, item) => acc + (item.qty * price), 0);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleCheckout = async () => {
    if (!user) return alert("Iniciando sesión segura, intenta en un segundo.");
    if (deliveryMethod === 'envio' && (!address.trim() || !zone.trim())) {
      return alert("⚠️ Completa los datos de envío.");
    }

    const unitPrice = getUnitPromoPrice();
    const totalCount = getTotalItems();
    const finalTotal = calculateTotal();

    let msg = `Hola *${CONFIG.brandName}*, mi pedido:\n`;
    if (totalCount >= 5) msg += `*PROMO MAYORISTA ($24.500 c/u)*\n\n`;
    else if (totalCount >= 2) msg += `*PROMO APLICADA ($26.000 c/u)*\n\n`;

    cart.forEach(item => {
      msg += `- ${item.qty}x ${item.name} ($${formatPrice(unitPrice)} c/u) = $${formatPrice(unitPrice * item.qty)}\n`;
    });

    msg += `\n*TOTAL: ${CONFIG.currencySymbol}${formatPrice(finalTotal)}*\n`;
    msg += `----------------------------\n`;
    msg += deliveryMethod === 'envio' 
      ? `*ENVIO A DOMICILIO*\nDireccion: ${address}\nZona: ${zone}\n` 
      : `*RETIRO POR LOCAL*\n`;
    msg += `\n${CONFIG.shippingText}`;

    // Guardar en Firestore
    try {
      const db = getFirestore();
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: unitPrice })),
        total: finalTotal,
        delivery: deliveryMethod,
        address,
        zone,
        createdAt: serverTimestamp()
      });
      window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (e) {
      console.error(e);
      alert("Error al procesar el pedido.");
    }
  };

  return (
    <div className="bg-[#f4f4f4] text-[#1a1a1a] min-h-screen font-sans antialiased pb-24">
      {/* Navbar */}
      <nav className="bg-[#121212] py-3 px-4 sticky top-0 z-40 border-b border-[#d4af37]/30 shadow-lg text-white w-full">
        <div className="container mx-auto flex justify-between items-center">
          <a href="#" className="font-bold flex items-center">
            <img src={CONFIG.logoImage} alt="Logo" className="h-14 w-auto object-contain" />
          </a>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-xl">
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
        {isMenuOpen && (
          <div className="bg-[#121212] border-t border-[#d4af37]/30 absolute w-full left-0 top-full p-6 shadow-2xl z-50">
            <div className="flex flex-col space-y-4 text-center uppercase font-bold tracking-widest text-sm">
              <a href="#inicio" onClick={() => setIsMenuOpen(false)} className="hover:text-[#d4af37]">Inicio</a>
              <a href="#catalogo" onClick={() => setIsMenuOpen(false)} className="hover:text-[#d4af37]">Catálogo</a>
              <button onClick={() => { setIsCartOpen(true); setIsMenuOpen(false); }} className="hover:text-[#d4af37]">Ver Carrito</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header id="inicio" className="relative h-[50vh] flex items-center justify-center bg-[#121212] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 opacity-60" 
          style={{ backgroundImage: `url(${CONFIG.bannerImage})` }}
        />
        <div className="relative z-20 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-[#d4af37] drop-shadow-lg mb-2">
            {CONFIG.brandName}{CONFIG.brandSuffix}
          </h1>
          <p className="text-lg font-medium tracking-widest">ENVIOS Y RETIROS 24/7 !</p>
        </div>
      </header>

      {/* Catálogo */}
      <section id="catalogo" className="py-10 px-3 container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8 px-1">
          <h2 className="text-2xl font-bold border-l-4 border-[#d4af37] pl-3 uppercase">Catálogo</h2>
          <div className="text-[10px] md:text-xs bg-[#d4af37] text-black font-bold px-3 py-1 rounded shadow-sm leading-tight text-center">
            2 o más: $26.000<br/>5 o más: $24.500
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {productsDB.map(product => {
            const inCart = cart.find(i => i.id === product.id);
            return (
              <article key={product.id} className="bg-white border border-gray-200 rounded-sm overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <div className="relative pt-[110%] bg-gray-100 overflow-hidden">
                  <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
                  {product.tag && (
                    <span className="absolute top-2 right-2 bg-[#d4af37] text-black text-[9px] font-bold px-2 py-1 uppercase">
                      {product.tag}
                    </span>
                  )}
                </div>
                <div className="p-3 flex flex-col flex-grow">
                  <h3 className="font-bold text-sm mb-1 uppercase">{product.name}</h3>
                  <p className="text-[10px] text-gray-500 mb-3 truncate">{product.desc}</p>
                  <div className="mt-auto">
                    <div className="text-[#d4af37] font-bold text-lg mb-2">
                      {CONFIG.currencySymbol}{formatPrice(product.price)}
                    </div>
                    {inCart ? (
                      <div className="flex items-center justify-between bg-[#121212] text-[#d4af37] rounded-sm h-8">
                        <button onClick={() => changeQty(product.id, -1)} className="w-8 h-full font-bold">-</button>
                        <span className="text-white text-xs font-bold">{inCart.qty}</span>
                        <button onClick={() => changeQty(product.id, 1)} className="w-8 h-full font-bold">+</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(product)}
                        className="w-full bg-[#d4af37] text-black font-bold text-[10px] py-2 uppercase tracking-tighter hover:bg-[#b8962e] transition-colors rounded-sm"
                      >
                        Agregar
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Sticky Footer */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-[#121212] text-white p-4 z-40 border-t border-[#d4af37]/30 animate-slide-up">
          <div className="container mx-auto max-w-4xl flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#d4af37] font-bold uppercase tracking-widest">Tu Pedido</span>
              <div className="flex items-center gap-2">
                <span className="bg-[#d4af37] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{getTotalItems()}</span>
                <span className="text-xl font-bold">{CONFIG.currencySymbol}{formatPrice(calculateTotal())}</span>
              </div>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-[#d4af37] text-black font-bold py-2 px-6 rounded-sm uppercase text-xs flex items-center gap-2"
            >
              Ver Carrito <i className="fas fa-chevron-up"></i>
            </button>
          </div>
        </div>
      )}

      {/* Modal Carrito */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/80" onClick={() => setIsCartOpen(false)} />
          <div className="relative bg-white rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold uppercase">Tu Carrito</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400 text-2xl">&times;</button>
            </div>

            {/* Alerta Promo */}
            <div className={`mb-4 p-3 rounded text-center text-xs font-bold ${
              getTotalItems() >= 5 ? 'bg-green-100 text-green-800' : 
              getTotalItems() >= 2 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {getTotalItems() >= 5 ? '🌟 PROMO MAYORISTA ACTIVADA: $24.500 c/u' : 
               getTotalItems() >= 2 ? '✨ PROMO ACTIVADA: $26.000 c/u' : '💡 Sumá 1 más para pagar $26.000 c/u'}
            </div>

            {/* Items */}
            <div className="space-y-4 mb-6">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
                  <div>
                    <h4 className="font-bold text-sm uppercase">{item.name}</h4>
                    <p className="text-xs text-gray-500">{CONFIG.currencySymbol}{formatPrice(getUnitPromoPrice())} x {item.qty}</p>
                  </div>
                  <span className="font-bold text-[#d4af37]">{CONFIG.currencySymbol}{formatPrice(getUnitPromoPrice() * item.qty)}</span>
                </div>
              ))}
              {cart.length === 0 && <p className="text-center py-10 text-gray-400">Carrito vacío</p>}
            </div>

            {/* Entrega */}
            <div className="mb-6 bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-bold text-sm mb-3 uppercase">Método de Entrega</h3>
              <div className="flex gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                  <input type="radio" checked={deliveryMethod === 'retiro'} onChange={() => setDeliveryMethod('retiro')} className="accent-[#d4af37]" /> Retiro
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                  <input type="radio" checked={deliveryMethod === 'envio'} onChange={() => setDeliveryMethod('envio')} className="accent-[#d4af37]" /> Envío
                </label>
              </div>
              {deliveryMethod === 'envio' && (
                <div className="space-y-2 animate-fade-in">
                  <input 
                    type="text" placeholder="Dirección y Altura" 
                    value={address} onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded text-sm focus:border-[#d4af37] outline-none" 
                  />
                  <input 
                    type="text" placeholder="Barrio / Localidad" 
                    value={zone} onChange={(e) => setZone(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded text-sm focus:border-[#d4af37] outline-none" 
                  />
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-6 text-xl font-bold">
                <span>TOTAL:</span>
                <span className="text-[#d4af37]">{CONFIG.currencySymbol}{formatPrice(calculateTotal())}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-green-600 text-white font-bold py-4 rounded-lg uppercase flex justify-center items-center gap-3 hover:bg-green-700 disabled:opacity-50 transition-all shadow-lg"
              >
                <i className="fab fa-whatsapp text-2xl"></i> Finalizar Compra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FontAwesome Loader (Para no romper el diseño mientras migramos iconos) */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      
      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
        .animate-fade-in { opacity: 0; animation: fadeIn 0.3s forwards; }
        @keyframes fadeIn { to { opacity: 1; } }
      `}</style>
    </div>
  );
}