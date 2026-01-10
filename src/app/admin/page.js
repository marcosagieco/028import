"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc,
  setDoc
} from "firebase/firestore";

const CONFIG = {
  brandName: "028",
  brandSuffix: "import",
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png"
};

const initialProducts = [
  // --- VAPES REGULARES ---
  { id: 1, name: "BAJA SPLASH", price: 27000, category: "Vapes", tag: "Nuevo", image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png" },
  { id: 2, name: "BLUE RAZZ ICE", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/s2Tmw67w/BLUE-RAZZ-ICE.webp" },
  { id: 3, name: "CHERRY FUSE", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/yd5PzDfx/CHERRY-FUSE.png" },
  { id: 4, name: "CHERRY STRAZZ", price: 27000, category: "Vapes", tag: "Destacado", image: "https://i.postimg.cc/7PFVsTG2/CHERRY-STRAZZ.jpg" },
  { id: 5, name: "DOUBLE APPLE ICE", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/QN9mJqtk/DOUBLE-APPLE-ICE.webp" },
  { id: 6, name: "DRAGON STRAWNANA", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/9X6p8qRB/DRAGON-STRAWNANA.png" },
  { id: 7, name: "GRAPE ICE", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/hPV0HPTw/GRAPE-ICE.webp" },
  { id: 8, name: "MANGO MAGIC", price: 27000, category: "Vapes", tag: "Best Seller", image: "https://i.postimg.cc/tCFzLCFC/MANGO-MAGIC.png" },
  { id: 9, name: "PEACH", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/4xZ1Zk1f/PEACH.webp" },
  { id: 10, name: "SCARY BERRY", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/K8F5FS5D/SCARY-BERRY.png" },
  { id: 11, name: "SOUR LUSH GUMMY", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/P54Q536R/SOUR-LUSH-GUMMY.png" },
  { id: 12, name: "STRAWBERRY DRAGON FRUIT", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/QMdk9QwW/STRAWBERRY-DRAGON-FRUIT.png" },
  { id: 13, name: "STRAWBERRY ICE", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/7Lt1gCrC/STRAWBERRY-ICE.png" },
  { id: 14, name: "STRAWBERRY WATERMELON", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/MG30ycJD/STRAWBERRY-WATERMELON.webp" },
  { id: 15, name: "SUMMER SPLASH", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/LXqtvHmV/SUMMER-SPLASH.png" },
  { id: 16, name: "TIGERS BLOOD", price: 27000, category: "Vapes", tag: "", image: "https://i.postimg.cc/3RyX9K3P/TIGERS-BLOOD.jpg" },
  { id: 17, name: "WATERMELON ICE", price: 27000, category: "Vapes", tag: "Refrescante", image: "https://i.postimg.cc/63DdmD3s/WATERMELON-ICE.webp" },
  
  // --- VAPES THC ---
  { id: 18, name: "BLOW THC", price: 55000, category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp" },
  { id: 19, name: "TORCH 7.5G", price: 53000, category: "Vapes THC", tag: "", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png" },
  { id: 20, name: "PHENOM 6G", price: 56000, category: "Vapes THC", tag: "Destacado", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg" },

  // --- CARGADORES ---
  { id: 21, name: "CARGADOR 20W", price: 16500, category: "Cargadores", tag: "", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg" },
  { id: 22, name: "CARGADOR 35W", price: 20500, category: "Cargadores", tag: "Potente", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg" },
  { id: 23, name: "CABLE USB-C A USB-C", price: 13500, category: "Cargadores", tag: "", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg" },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M", price: 13500, category: "Cargadores", tag: "", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg" }
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('pendientes'); 
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const firebaseRefs = useMemo(() => {
    if (typeof window === "undefined") return { auth: null, db: null };
    try {
      const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };
      const app = !getApps().length ? initializeApp(config) : getApp();
      return { auth: getAuth(app), db: getFirestore(app) };
    } catch (err) {
      return { auth: null, db: null, err: err.message };
    }
  }, []);

  useEffect(() => {
    if (!firebaseRefs.auth || !firebaseRefs.db) return;

    signInAnonymously(firebaseRefs.auth).catch(console.error);

    const unsubscribeAuth = onAuthStateChanged(firebaseRefs.auth, (user) => {
      if (!user) return;

      const qOrders = query(collection(firebaseRefs.db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
        setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      const unsubscribeProducts = onSnapshot(collection(firebaseRefs.db, 'products'), (snapshot) => {
        if (!snapshot.empty) {
          const dbProducts = snapshot.docs.map(doc => ({ dbId: doc.id, ...doc.data() }));
          setProducts(prev => prev.map(p => {
            const match = dbProducts.find(dbP => dbP.id === p.id);
            return match ? { ...p, inStock: match.inStock } : { ...p, inStock: true };
          }));
        }
      });

      return () => {
        unsubscribeOrders();
        unsubscribeProducts();
      };
    });

    return () => unsubscribeAuth();
  }, [firebaseRefs]);

  const completeOrder = async (id) => {
    if (confirm("¿Confirmas que el pedido fue entregado? Se moverá al historial.")) {
      try {
        await updateDoc(doc(firebaseRefs.db, 'orders', id), {
          status: 'completed'
        });
      } catch (err) {
        alert("Error: No se pudo completar el pedido. Revisa las reglas de Firestore.");
      }
    }
  };

  const toggleStock = async (product) => {
    try {
      const newStockStatus = product.inStock === false ? true : false;
      const productRef = doc(firebaseRefs.db, 'products', `prod_${product.id}`);
      await setDoc(productRef, {
        id: product.id,
        name: product.name,
        inStock: newStockStatus
      }, { merge: true });
    } catch (err) {
      console.error(err);
      alert("Error de permisos: Asegúrate de haber publicado las nuevas reglas en Firebase (pestaña Rules).");
    }
  };

  const syncAllProducts = async () => {
    if (confirm("¿Sincronizar catálogo con la base de datos? Esto subirá los productos nuevos.")) {
        setLoading(true);
        try {
            for (const p of initialProducts) {
                await setDoc(doc(firebaseRefs.db, 'products', `prod_${p.id}`), {
                    id: p.id,
                    name: p.name,
                    inStock: true
                }, { merge: true });
            }
            alert("Catálogo sincronizado con éxito.");
        } catch (err) {
            alert("Error al sincronizar: " + err.message);
        }
        setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => activeTab === 'pendientes' ? o.status !== 'completed' : o.status === 'completed');

  // Helper para renderizar grupos en admin
  const renderStockGroup = (title, categoryFilter) => {
    const group = products.filter(p => {
        if (categoryFilter === 'Vapes') return p.category === 'Vapes';
        if (categoryFilter === 'Vapes THC') return p.category === 'Vapes THC';
        if (categoryFilter === 'Cargadores') return p.category === 'Cargadores';
        return false;
    });

    if (group.length === 0) return null;

    return (
        <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 uppercase text-gray-400 border-b pb-2">{title}</h3>
            <div className="grid gap-4">
                {group.map(p => (
                    <div key={p.id} className="bg-white p-5 rounded-[1.5rem] flex justify-between items-center shadow-sm border border-gray-100 hover:border-[#d4af37]/20 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12">
                                <img src={p.image} className={`w-full h-full rounded-xl object-cover ${p.inStock === false ? 'grayscale opacity-50' : ''}`} alt="" />
                                {p.inStock === false && <div className="absolute inset-0 flex items-center justify-center"><i className="fas fa-times text-red-500 text-xs"></i></div>}
                            </div>
                            <div>
                                <p className="font-black text-[11px] uppercase text-gray-800">{p.name}</p>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${p.inStock === false ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                    {p.inStock === false ? 'Agotado' : 'Disponible'}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => toggleStock(p)}
                            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm ${p.inStock === false ? 'bg-green-600 text-white' : 'bg-red-50 text-red-600'}`}
                        >
                            {p.inStock === false ? 'Habilitar' : 'Agotar Stock'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Sincronizando Boutique 028...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <nav className="bg-[#121212] py-5 px-6 text-white flex justify-between items-center shadow-2xl border-b border-[#d4af37]/30 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src={CONFIG.logoImage} alt="028 Logo" className="h-10 w-auto object-contain" />
          <h1 className="text-lg font-black tracking-tighter uppercase">028<span className="text-[#d4af37]">Control</span></h1>
        </div>
        <a href="/" className="text-[10px] text-gray-500 font-bold uppercase hover:text-white transition-all">Ver Web</a>
      </nav>

      <div className="bg-white border-b sticky top-[72px] z-40">
        <div className="max-w-4xl mx-auto flex">
          <button onClick={() => setActiveTab('pendientes')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'pendientes' ? 'border-[#d4af37] text-black' : 'border-transparent text-gray-400'}`}>Pedidos</button>
          <button onClick={() => setActiveTab('historial')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'historial' ? 'border-[#d4af37] text-black' : 'border-transparent text-gray-400'}`}>Ventas</button>
          <button onClick={() => setActiveTab('stock')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'stock' ? 'border-[#d4af37] text-black' : 'border-transparent text-gray-400'}`}>Stock</button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {activeTab === 'stock' ? (
          <div className="animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Gestión de Stock</h2>
                <button onClick={syncAllProducts} className="text-[9px] bg-black text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest shadow-lg hover:bg-[#d4af37] transition-all">Sincronizar DB</button>
             </div>
             
             {renderStockGroup("Vapes", "Vapes")}
             {renderStockGroup("Vapes THC", "Vapes THC")}
             {renderStockGroup("Cargadores y Accesorios", "Cargadores")}

          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter leading-none">{activeTab === 'pendientes' ? 'Activos' : 'Historial'}</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">{activeTab === 'pendientes' ? 'Nuevos pedidos recibidos' : 'Registro de ventas cerradas'}</p>
              </div>
              <span className="bg-black text-[#d4af37] text-[10px] font-black px-4 py-2 rounded-full shadow-xl">{filteredOrders.length} {activeTab === 'pendientes' ? 'PENDIENTES' : 'TOTALES'}</span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white p-24 rounded-[3rem] border-2 border-dashed border-gray-100 text-center flex flex-col items-center">
                <i className="fas fa-receipt text-gray-100 text-5xl mb-6"></i>
                <p className="text-gray-300 font-bold uppercase text-[10px] tracking-widest">No se encontraron registros</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8 hover:shadow-2xl transition-all duration-500">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-black text-[#d4af37] w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-xl">
                          {order.items?.reduce((a, b) => a + b.qty, 0)}
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest block mb-0.5">ID: {order.id.slice(-6).toUpperCase()}</span>
                          <p className="text-gray-400 text-[10px] font-bold">
                            {order.createdAt ? order.createdAt.toDate().toLocaleString('es-AR') : 'Procesando...'}
                          </p>
                        </div>
                      </div>
                      {activeTab === 'pendientes' && (
                        <button 
                          onClick={() => completeOrder(order.id)} 
                          className="bg-gray-50 text-gray-300 hover:bg-green-600 hover:text-white w-12 h-12 rounded-2xl transition-all flex items-center justify-center shadow-inner"
                        >
                          <i className="fas fa-check text-lg"></i>
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 mb-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-inner">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-gray-700 font-bold uppercase">
                            <span className="text-black font-black mr-2">{item.qty}x</span> {item.name}
                          </span>
                          <span className="text-gray-400 font-black">${item.price?.toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>

                    {order.delivery === 'envio' && order.address && (
                      <div className="mb-6 p-5 bg-[#121212] text-white rounded-2xl text-[11px] font-bold border-l-8 border-[#d4af37] shadow-xl">
                        <p className="text-[#d4af37] text-[8px] font-black uppercase mb-1 tracking-widest">Envío a Domicilio</p>
                        <p className="uppercase">{order.address}</p>
                        <p className="opacity-40 text-[9px] mt-1 uppercase font-black tracking-widest">{order.zone}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-end border-t border-gray-50 pt-6">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Total</span>
                      <div className="text-3xl font-black text-black tracking-tighter leading-none">
                        <span className="text-[#d4af37] text-sm mr-1.5 font-black">$</span>
                        {order.total?.toLocaleString('es-AR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
}