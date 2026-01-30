"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

// --- CONFIGURACIÓN DE TU MARCA (EDITAR AQUÍ) ---
const CONFIG = {
  brandName: "028", // NOMBRE DE LA PESTAÑA
  whatsappNumber: "5491155669960", 
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png", // ICONO DE LA PESTAÑA
  bannerImage: "https://i.postimg.cc/wBdHsm94/banner-web.jpg", 
  currencySymbol: "$",
  shippingText: "Espero confirmacion para abonar",
};

const initialProducts = [
  // --- ELFBAR ICE KING (Ex Vapes) ---
  { id: 1, name: "BAJA SPLASH", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png" },
  { id: 2, name: "BLUE RAZZ ICE", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/s2Tmw67w/BLUE-RAZZ-ICE.webp" },
  { id: 3, name: "CHERRY FUSE", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/yd5PzDfx/CHERRY-FUSE.png" },
  { id: 4, name: "CHERRY STRAZZ", price: 27000, category: "Elfbar Ice King", tag: "Destacado", image: "https://i.postimg.cc/7PFVsTG2/CHERRY-STRAZZ.jpg" },
  { id: 5, name: "DOUBLE APPLE ICE", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/QN9mJqtk/DOUBLE-APPLE-ICE.webp" },
  { id: 6, name: "DRAGON STRAWNANA", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/9X6p8qRB/DRAGON-STRAWNANA.png" },
  { id: 7, name: "GRAPE ICE", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/hPV0HPTw/GRAPE-ICE.webp" },
  { id: 8, name: "MANGO MAGIC", price: 27000, category: "Elfbar Ice King", tag: "Best Seller", image: "https://i.postimg.cc/tCFzLCFC/MANGO-MAGIC.png" },
  { id: 9, name: "PEACH", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/4xZ1Zk1f/PEACH.webp" },
  { id: 10, name: "SCARY BERRY", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/K8F5FS5D/SCARY-BERRY.png" },
  { id: 11, name: "SOUR LUSH GUMMY", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/P54Q536R/SOUR-LUSH-GUMMY.png" },
  { id: 12, name: "STRAWBERRY DRAGON FRUIT", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/QMdk9QwW/STRAWBERRY-DRAGON-FRUIT.png" },
  { id: 13, name: "STRAWBERRY ICE", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/7Lt1gCrC/STRAWBERRY-ICE.png" },
  { id: 14, name: "STRAWBERRY WATERMELON", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/MG30ycJD/STRAWBERRY-WATERMELON.webp" },
  { id: 15, name: "SUMMER SPLASH", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/LXqtvHmV/SUMMER-SPLASH.png" },
  { id: 16, name: "TIGERS BLOOD", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/3RyX9K3P/TIGERS-BLOOD.jpg" },
  { id: 17, name: "WATERMELON ICE", price: 27000, category: "Elfbar Ice King", tag: "Refrescante", image: "https://i.postimg.cc/63DdmD3s/WATERMELON-ICE.webp" },
  { id: 25, name: "SOUR APPLE ICE", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/X7QqQDGS/SOUR-APPLE-ICE.jpg" },
  { id: 26, name: "MIAMI MINT", price: 27000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/bJhqzQDS/MIAMI-MINT.jpg" },

  // --- IGNITE V400 ---
  { id: 30, name: "BLUE RAZZ LEMON", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/Jh48hT4x/ignite-v400-BLUE-RAZZ-LEMON.jpg" },
  { id: 31, name: "CHERRY WATERMELON", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/nLRJ9vCd/ignite-v400-cherry-watermelon.jpg" },
  { id: 32, name: "GRAPE", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/0QzqYbSv/ignite-v400-GRAPE.jpg" },
  { id: 33, name: "MIAMI MINT", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/gJ1bNmyJ/ignite-v400-miami-mint.jpg" },
  { id: 34, name: "PASSION FRUIT", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/vT9FKkXt/Ignite-v400-PASSION-FRUIT.jpg" },
  { id: 35, name: "STRAWBERRY WATERMELON", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/FFJ41kmG/Ignite-v400-STRAWBERR-WATERMELON.jpg" },
  { id: 36, name: "STRAWBERRY KIWI", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/Hsw19GrJ/ignite-v400-STRAWBERRY-KIWI.jpg" },
  { id: 37, name: "STRAWBERRY", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/cLdyDD35/ignite-v400-strawberry.jpg" },
  { id: 38, name: "TUTTI FRUTI", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/mgVxKQ3v/ignite-v400-TUTI-FRUTI.jpg" },

  // --- LOST MARY 20000 ---
  { id: 39, name: "BLUE RAZZ ICE", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/yYk7mpF9/Lost-mary-20000-BLUE-RAZZ-ICE.jpg" },
  { id: 40, name: "GRAPE ICE", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/wTZg05VC/Lost-mary-20000-GRAPE-ICE.jpg" },
  { id: 41, name: "ICE MINT", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/wTZg05V5/lost-mary-20000-ICE-MINT.jpg" },
  { id: 42, name: "LIME GRAPE FRUIT", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/7LqcVbpW/Lost-mary-20000-LIME-GRAPE-FRUIT.jpg" },
  { id: 43, name: "MANGO MAGIC", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/8CwYnNGc/Lost-mary-20000-MANGO-TWIST.jpg" },
  { id: 44, name: "MEXICAN MANGO", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/bvL5FpPx/Lost-mary-20000-MEXICAN-MANGO.jpg" },
  { id: 45, name: "MIAMI MINT", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/yWqpSNmv/Lost-mary-20000-MIAMI-MINT.jpg" },
  { id: 46, name: "STRAWBERRY ICE", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/zDLJWPw3/Lost-mary-20000-STRAWBERRY-ICE.jpg" },
  { id: 47, name: "STRAWBERRY KIWI", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/59Hxvk5q/Lost-mary-20000-STRAWBERRY-KIWI.jpg" },
  
  // --- VAPES THC ---
  { id: 18, name: "BLOW THC", price: 55000, category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp" },
  { id: 19, name: "TORCH 7.5G", price: 53000, category: "Vapes THC", tag: "", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png" },
  { id: 29, name: "TORCH 4.5G", price: 52500, category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/vmFK42hC/TORCH-4-5G.jpg" },
  { id: 20, name: "PHENOM 6G", price: 56000, category: "Vapes THC", tag: "Destacado", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg" },

  // --- PLAYSTATION ---
  { id: 27, name: "PLAYSTATION 5", price: 550, category: "PlayStation", tag: "USD", image: "https://i.postimg.cc/RFGS0Wzt/PLAY-5.jpg" },

  // --- PRODUCTOS APPLE ---
  { id: 28, name: "AIRPODS PRO", price: 35000, category: "PRODUCTOS APPLE", tag: "Nuevo", image: "https://i.postimg.cc/X7gzDt0p/AIRPODS-PRO.jpg" },
  { id: 21, name: "CARGADOR 20W", price: 16500, category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg" },
  { id: 22, name: "CARGADOR 35W", price: 20500, category: "PRODUCTOS APPLE", tag: "Potente", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg" },
  { id: 23, name: "CABLE USB-C A USB-C", price: 13500, category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg" },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M", price: 13500, category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg" }
];

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

  // --- EFECTO PARA CAMBIAR TÍTULO DE PESTAÑA Y FAVICON ---
  useEffect(() => {
    // Cambiar Título
    document.title = CONFIG.brandName;

    // Cambiar Favicon (Icono de pestaña)
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = CONFIG.logoImage;
  }, []);

  // Inicialización de Firebase
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

      // ESCUCHAR STOCK Y PRECIOS EN TIEMPO REAL
      const unsubscribeStock = onSnapshot(collection(firebaseRefs.db, 'products'), (snapshot) => {
        if (!snapshot.empty) {
          const dbProducts = snapshot.docs.map(doc => ({ dbId: doc.id, ...doc.data() }));
          setProducts(prev => prev.map(p => {
            const match = dbProducts.find(dbP => dbP.id === p.id);
            return match 
              ? { ...p, inStock: match.inStock, price: match.price !== undefined ? match.price : p.price } 
              : { ...p, inStock: true };
          }));
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
  
  // Lógica de precios promocionales
  const getUnitPromoPrice = (productPrice) => {
    if (productPrice !== 27000) return productPrice;

    const count = getTotalItems();
    if (count >= 5) return 24500;
    if (count >= 2) return 26000;
    return 27000;
  };

  const calculateTotal = () => cart.reduce((acc, item) => acc + (item.qty * getUnitPromoPrice(item.price)), 0);

  const addToCart = (product) => {
    if (product.inStock === false) return;
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
    const finalTotal = calculateTotal();
    
    let msg = `Hola *${CONFIG.brandName}*, mi pedido:\n`;
    cart.forEach(item => {
      const unitPrice = getUnitPromoPrice(item.price);
      const currency = item.price < 2000 ? "USD" : "$"; 
      msg += `- ${item.qty}x ${item.name} (${currency}${formatPrice(unitPrice)} c/u)\n`;
    });
    msg += `\n*TOTAL ESTIMADO: ${CONFIG.currencySymbol}${formatPrice(finalTotal)}*\n`;
    msg += deliveryMethod === 'envio' ? `*ENVIO:* ${address}, ${zone}\n` : `*RETIRO EN LOCAL*\n`;

    const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;

    try {
      if (firebaseRefs.db) {
        await addDoc(collection(firebaseRefs.db, 'orders'), {
          userId: user?.uid || "anon",
          items: cart.map(i => ({ name: i.name, qty: i.qty, price: getUnitPromoPrice(i.price) })),
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

  // Helper para renderizar secciones
  const renderProductSection = (title, categoryFilter, sectionId, promoText = null) => {
    const sectionProducts = products.filter(p => {
        if (categoryFilter === 'Elfbar Ice King') return p.category === 'Elfbar Ice King';
        if (categoryFilter === 'Ignite v400') return p.category === 'Ignite v400';
        if (categoryFilter === 'Lost Mary 20000') return p.category === 'Lost Mary 20000';
        if (categoryFilter === 'Vapes THC') return p.category === 'Vapes THC';
        if (categoryFilter === 'PlayStation') return p.category === 'PlayStation';
        if (categoryFilter === 'PRODUCTOS APPLE') return p.category === 'PRODUCTOS APPLE';
        return false;
    });

    // Permitir renderizar secciones vacías si son las nuevas para mantener la estructura
    const alwaysShowCategories = ['Ignite v400', 'Lost Mary 20000'];
    if (sectionProducts.length === 0 && !alwaysShowCategories.includes(categoryFilter)) return null;

    return (
      <section id={sectionId} className="mb-12 scroll-mt-28 transition-all duration-500">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-6 gap-3 border-b border-gray-200 pb-4">
          <h2 className="text-xl md:text-2xl font-black border-l-4 border-[#d4af37] pl-4 uppercase tracking-tight">{title}</h2>
          {promoText && <div className="bg-[#d4af37] text-black px-3 py-1 text-[10px] font-black rounded uppercase tracking-widest">{promoText}</div>}
        </div>

        {sectionProducts.length === 0 ? (
           <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100 border-dashed">
             <p className="text-[10px] font-bold uppercase tracking-widest">Próximamente</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {sectionProducts.map(p => {
              const inCart = cart.find(i => i.id === p.id);
              const isOutOfStock = p.inStock === false;
              return (
                <div key={p.id} className={`bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col hover:shadow-lg transition-all duration-300 ${isOutOfStock ? 'opacity-70 grayscale' : ''}`}>
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    {isOutOfStock ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-tighter">SIN STOCK</span>
                      </div>
                    ) : p.tag && (
                      <span className="absolute top-2 left-2 bg-black text-[#d4af37] text-[8px] font-black px-2 py-1 uppercase rounded-sm">{p.tag}</span>
                    )}
                  </div>
                  <div className="p-3 md:p-4 flex-grow flex flex-col">
                    <h3 className="font-bold text-[11px] md:text-sm uppercase mb-1 text-gray-800 line-clamp-1">{p.name}</h3>
                    <div className="mt-auto">
                      <p className="text-[#d4af37] font-black text-base md:text-lg mb-3 tracking-tighter">{CONFIG.currencySymbol}{formatPrice(p.price)}</p>
                      {isOutOfStock ? (
                          <button disabled className="w-full bg-gray-200 text-gray-400 py-2.5 text-[10px] font-bold uppercase rounded-md cursor-not-allowed">No Disponible</button>
                      ) : inCart ? (
                        <div className="flex items-center justify-between bg-black text-white h-9 rounded-md font-bold text-xs">
                          <button className="w-9 h-full" onClick={() => changeQty(p.id, -1)}>-</button>
                          <span>{inCart.qty}</span>
                          <button className="w-9 h-full" onClick={() => addToCart(p)}>+</button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(p)} className="w-full bg-[#d4af37] hover:bg-black hover:text-[#d4af37] py-2.5 text-[10px] font-bold uppercase rounded-md transition-all">Añadir</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="bg-[#f4f4f4] text-[#1a1a1a] min-h-screen font-sans pb-24">
      <nav className="bg-[#121212] py-3 px-4 sticky top-0 z-40 border-b border-[#d4af37]/30 text-white shadow-xl">
        <div className="container mx-auto flex justify-between items-center">
          <img src={CONFIG.logoImage} alt={`${CONFIG.brandName} Logo`} className="h-10 md:h-12 w-auto object-contain" />
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-xl p-2"><i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i></button>
        </div>
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-[#121212] p-6 flex flex-col gap-4 text-center font-bold border-t border-[#d4af37]/20 shadow-2xl z-50">
            <a href="#elfbar" onClick={() => setIsMenuOpen(false)} className="hover:text-[#d4af37] transition-colors py-2 border-b border-gray-800">ELFBAR ICE KING</a>
            <a href="#ignite" onClick={() => setIsMenuOpen(false)} className="hover:text-[#d4af37] transition-colors py-2 border-b border-gray-800">IGNITE V400</a>
            <a href="#lostmary" onClick={() => setIsMenuOpen(false)} className="hover:text-[#d4af37] transition-colors py-2 border-b border-gray-800">LOST MARY</a>
            <a href="#thc" onClick={() => setIsMenuOpen(false)} className="hover:text-[#d4af37] transition-colors py-2 border-b border-gray-800">VAPES THC</a>
            <a href="#playstation" onClick={() => setIsMenuOpen(false)} className="hover:text-[#d4af37] transition-colors py-2 border-b border-gray-800">PLAYSTATION</a>
            <a href="#apple" onClick={() => setIsMenuOpen(false)} className="hover:text-[#d4af37] transition-colors py-2 border-b border-gray-800">PRODUCTOS APPLE</a>
            <button onClick={() => {setIsCartOpen(true); setIsMenuOpen(false)}} className="hover:text-[#d4af37] transition-colors uppercase py-2 mt-2">MI CARRITO</button>
          </div>
        )}
      </nav>

      <header className="relative h-[30vh] md:h-[45vh] flex items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-cover opacity-50" style={{backgroundImage: `url(${CONFIG.bannerImage})`, backgroundPosition: 'center 40%'}} />
      </header>

      <div id="catalogo" className="py-8 px-4 max-w-6xl mx-auto">
        <div className="flex gap-3 overflow-x-auto pb-4 mb-4 no-scrollbar sticky top-[60px] md:top-[70px] z-30 bg-[#f4f4f4]/95 backdrop-blur-sm py-3 -mx-4 px-4 md:mx-0 md:px-0 mask-image-gradient">
            {/* Secciones de Vapes */}
            <a href="#elfbar" className="whitespace-nowrap bg-white border border-gray-200 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-[#d4af37] hover:border-black transition-all shadow-sm flex-shrink-0">
                Elfbar
            </a>
            <a href="#ignite" className="whitespace-nowrap bg-white border border-gray-200 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-[#d4af37] hover:border-black transition-all shadow-sm flex-shrink-0">
                Ignite
            </a>
             <a href="#lostmary" className="whitespace-nowrap bg-white border border-gray-200 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-[#d4af37] hover:border-black transition-all shadow-sm flex-shrink-0">
                Lost Mary
            </a>
            {/* Resto de Categorías */}
            <a href="#thc" className="whitespace-nowrap bg-white border border-gray-200 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-[#d4af37] hover:border-black transition-all shadow-sm flex-shrink-0">
                Vapes THC
            </a>
            <a href="#playstation" className="whitespace-nowrap bg-white border border-gray-200 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-[#d4af37] hover:border-black transition-all shadow-sm flex-shrink-0">
                PlayStation
            </a>
            <a href="#apple" className="whitespace-nowrap bg-white border border-gray-200 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-[#d4af37] hover:border-black transition-all shadow-sm flex-shrink-0">
                Productos Apple
            </a>
        </div>

        {/* Sección Contenedora VAPES */}
        <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-center mb-10 text-gray-200 uppercase tracking-tighter opacity-30 select-none">VAPE ZONE</h2>
            
            {renderProductSection("Elfbar Ice King", "Elfbar Ice King", "elfbar", "2+ un: $26.000 | 5+ un: $24.500")}
            {renderProductSection("Ignite v400", "Ignite v400", "ignite")}
            {renderProductSection("Lost Mary 20000", "Lost Mary 20000", "lostmary")}
        </div>

        {renderProductSection("Vapes de THC", "Vapes THC", "thc")}
        {renderProductSection("PlayStation 5", "PlayStation", "playstation")}
        {renderProductSection("Productos Apple", "PRODUCTOS APPLE", "apple")}
      </div>

      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-[#121212]/95 backdrop-blur-md p-4 border-t border-[#d4af37]/40 text-white flex justify-between items-center z-50 shadow-2xl">
          <div><p className="text-[9px] text-[#d4af37] font-black uppercase tracking-widest">Total</p><p className="text-xl font-black tracking-tighter">{CONFIG.currencySymbol}{formatPrice(calculateTotal())}</p></div>
          <button onClick={() => setIsCartOpen(true)} className="bg-[#d4af37] text-black px-6 py-2.5 rounded-md font-black text-[11px] uppercase">Ver Pedido</button>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/80" onClick={() => setIsCartOpen(false)} />
          <div className="relative bg-white p-6 rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black uppercase">Resumen</h2><button onClick={() => setIsCartOpen(false)} className="text-gray-400"><i className="fas fa-times text-xl"></i></button></div>
            <div className="space-y-4 mb-6">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-3"><img src={item.image} className="w-10 h-10 rounded object-cover" alt="" /><div><p className="font-bold text-[11px] uppercase">{item.name}</p><p className="text-[9px] text-gray-400">{item.qty} un.</p></div></div>
                  <p className="font-black text-[#d4af37] text-xs">{CONFIG.currencySymbol}{formatPrice(item.qty * getUnitPromoPrice(item.price))}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <p className="font-bold text-[10px] mb-3 uppercase text-gray-500">Opciones de Entrega</p>
              <div className="flex gap-3 mb-4 text-[10px] font-bold">
                <button onClick={() => setDeliveryMethod('retiro')} className={`flex-1 py-2 rounded-lg border ${deliveryMethod === 'retiro' ? 'bg-black text-white' : 'bg-white text-gray-400'}`}>Retiro</button>
                <button onClick={() => setDeliveryMethod('envio')} className={`flex-1 py-2 rounded-lg border ${deliveryMethod === 'envio' ? 'bg-black text-white' : 'bg-white text-gray-400'}`}>Envío</button>
              </div>
              {deliveryMethod === 'envio' && (
                <div className="flex flex-col gap-2">
                  <input type="text" placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} className="p-3 border rounded-lg text-xs outline-none focus:border-[#d4af37]" />
                  <input type="text" placeholder="Barrio" value={zone} onChange={(e) => setZone(e.target.value)} className="p-3 border rounded-lg text-xs outline-none focus:border-[#d4af37]" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
               <div className="flex justify-between items-baseline"><span className="font-bold text-gray-400 text-[10px] uppercase">Final</span><span className="font-black text-2xl text-black tracking-tighter">{CONFIG.currencySymbol}{formatPrice(calculateTotal())}</span></div>
               <button onClick={handleCheckout} disabled={isSending} className={`w-full ${isSending ? 'bg-gray-400 shadow-none' : 'bg-[#25D366] shadow-lg'} text-white font-black py-4 rounded-xl uppercase text-xs flex justify-center items-center gap-2 transition-all`}>
                {isSending ? <>Procesando pedido...</> : <><i className="fab fa-whatsapp text-xl"></i> Finalizar por WhatsApp</>}
              </button>
            </div>
          </div>
        </div>
      )}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
}