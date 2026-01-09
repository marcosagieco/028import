"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  orderBy, 
  query, 
  doc, 
  setDoc, 
  updateDoc 
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

const ALL_PRODUCTS_LIST = [
  // Nicotina (1-17)
  { id: 1, name: "BAJA SPLASH", category: "VAPES NICOTINA", image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png" },
  { id: 2, name: "BLUE RAZZ ICE", category: "VAPES NICOTINA", image: "https://i.postimg.cc/s2Tmw67w/BLUE-RAZZ-ICE.webp" },
  { id: 3, name: "CHERRY FUSE", category: "VAPES NICOTINA", image: "https://i.postimg.cc/yd5PzDfx/CHERRY-FUSE.png" },
  { id: 4, name: "CHERRY STRAZZ", category: "VAPES NICOTINA", image: "https://i.postimg.cc/7PFVsTG2/CHERRY-STRAZZ.jpg" },
  { id: 5, name: "DOUBLE APPLE ICE", category: "VAPES NICOTINA", image: "https://i.postimg.cc/QN9mJqtk/DOUBLE-APPLE-ICE.webp" },
  { id: 6, name: "DRAGON STRAWNANA", category: "VAPES NICOTINA", image: "https://i.postimg.cc/9X6p8qRB/DRAGON-STRAWNANA.png" },
  { id: 7, name: "GRAPE ICE", category: "VAPES NICOTINA", image: "https://i.postimg.cc/hPV0HPTw/GRAPE-ICE.webp" },
  { id: 8, name: "MANGO MAGIC", category: "VAPES NICOTINA", image: "https://i.postimg.cc/tCFzLCFC/MANGO-MAGIC.png" },
  { id: 9, name: "PEACH", category: "VAPES NICOTINA", image: "https://i.postimg.cc/4xZ1Zk1f/PEACH.webp" },
  { id: 10, name: "SCARY BERRY", category: "VAPES NICOTINA", image: "https://i.postimg.cc/K8F5FS5D/SCARY-BERRY.png" },
  { id: 11, name: "SOUR LUSH GUMMY", category: "VAPES NICOTINA", image: "https://i.postimg.cc/P54Q536R/SOUR-LUSH-GUMMY.png" },
  { id: 12, name: "STRAWBERRY DRAGON FRUIT", category: "VAPES NICOTINA", image: "https://i.postimg.cc/QMdk9QwW/STRAWBERRY-DRAGON-FRUIT.png" },
  { id: 13, name: "STRAWBERRY ICE", category: "VAPES NICOTINA", image: "https://i.postimg.cc/7Lt1gCrC/STRAWBERRY-ICE.png" },
  { id: 14, name: "STRAWBERRY WATERMELON", category: "VAPES NICOTINA", image: "https://i.postimg.cc/MG30ycJD/STRAWBERRY-WATERMELON.webp" },
  { id: 15, name: "SUMMER SPLASH", category: "VAPES NICOTINA", image: "https://i.postimg.cc/LXqtvHmV/SUMMER-SPLASH.png" },
  { id: 16, name: "TIGERS BLOOD", category: "VAPES NICOTINA", image: "https://i.postimg.cc/3RyX9K3P/TIGERS-BLOOD.jpg" },
  { id: 17, name: "WATERMELON ICE", category: "VAPES NICOTINA", image: "https://i.postimg.cc/63DdmD3s/WATERMELON-ICE.webp" },
  // THC (18-20)
  { id: 18, name: "BLOW THC", category: "VAPES THC", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp" },
  { id: 19, name: "TORCH 7.5G", category: "VAPES THC", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png" },
  { id: 20, name: "PHENOM 6G", category: "VAPES THC", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg" },
  // Cargadores (21-24)
  { id: 21, name: "CARGADOR 20W", category: "CARGADORES", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg" },
  { id: 22, name: "CARGADOR 35W", category: "CARGADORES", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg" },
  { id: 23, name: "CABLE USB-C A USB-C", category: "CARGADORES", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg" },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M", category: "CARGADORES", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg" }
];

// ICONOS SVG
const IconArrowLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;
const IconSave = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('pedidos');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState(ALL_PRODUCTS_LIST.map(p => ({ ...p, price: 27000, inStock: true })));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tempPrices, setTempPrices] = useState({});

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsubAuth = onAuthStateChanged(auth, setUser);

    const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
    const qOrders = query(ordersRef, orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const prodsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const unsubProds = onSnapshot(prodsRef, (snap) => {
      const dbData = {};
      snap.forEach(d => dbData[d.id] = d.data());
      setProducts(prev => ALL_PRODUCTS_LIST.map(p => {
        const remote = dbData[p.id.toString()];
        return {
          ...p,
          price: remote?.price || p.price,
          inStock: remote?.inStock ?? true
        };
      }));
    });

    return () => { unsubAuth(); unsubOrders(); unsubProds(); };
  }, []);

  const updateProduct = async (id, data) => {
    const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', id.toString());
    await setDoc(pRef, data, { merge: true });
  };

  const handlePriceSave = (id) => {
    const newPrice = tempPrices[id];
    if (!newPrice) return;
    updateProduct(id, { price: parseInt(newPrice) });
    setTempPrices(prev => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  };

  const completeOrder = async (id) => {
    const oRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', id);
    await updateDoc(oRef, { status: 'completed' });
  };

  const filteredOrders = orders.filter(o => activeTab === 'pedidos' ? o.status === 'pending' : o.status === 'completed');

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black uppercase text-[10px] tracking-widest text-slate-400 animate-pulse">Iniciando Sistema 028...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      <nav className="bg-[#121212] py-5 px-6 text-white flex justify-between items-center sticky top-0 z-50 shadow-xl border-b border-[#d4af37]/20">
        <div className="flex items-center gap-3">
           <h1 className="text-lg font-black tracking-tighter uppercase">028<span className="text-[#d4af37]">PANEL</span></h1>
        </div>
        <a href="/" className="text-[10px] font-bold uppercase text-slate-500 hover:text-[#d4af37]">Ir a la Tienda</a>
      </nav>

      <div className="bg-white border-b sticky top-[72px] z-40">
        <div className="max-w-4xl mx-auto flex">
          {['pedidos', 'ventas', 'stock'].map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'border-b-2 border-[#d4af37] text-black' : 'text-slate-400'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {activeTab === 'stock' ? (
          <div className="grid gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between shadow-sm border border-slate-100 gap-4">
                <div className="flex items-center gap-4">
                  <img src={p.image} className={`w-14 h-14 rounded-2xl object-cover ${!p.inStock ? 'grayscale opacity-50' : ''}`} alt="" />
                  <div>
                    <p className="font-black text-[11px] uppercase text-slate-800 leading-tight">{p.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-50 border rounded-xl px-3 py-2">
                    <span className="text-[10px] font-bold text-slate-400">$</span>
                    <input 
                      type="number" 
                      placeholder={p.price}
                      value={tempPrices[p.id] || ''}
                      onChange={(e) => setTempPrices({ ...tempPrices, [p.id]: e.target.value })}
                      className="w-20 bg-transparent border-none p-0 text-sm font-black focus:ring-0 text-indigo-600" 
                    />
                    {tempPrices[p.id] && (
                      <button onClick={() => handlePriceSave(p.id)} className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-md hover:bg-black transition-all">
                        <IconSave />
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={() => updateProduct(p.id, { inStock: !p.inStock })}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm ${p.inStock ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}
                  >
                    {p.inStock ? 'AGOTAR' : 'HABILITAR'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100 uppercase text-[10px] font-bold text-slate-300 tracking-widest">Sin registros</div>
            ) : filteredOrders.map(o => (
              <div key={o.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 bg-slate-900 text-[#d4af37] font-black text-xl rounded-bl-[2.5rem] shadow-xl">
                  ${o.total?.toLocaleString('es-AR')}
                </div>
                <div className="mb-6">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{o.createdAt?.toDate().toLocaleString() || 'Procesando...'}</span>
                  <p className="text-xs font-black uppercase text-slate-600 mt-1">Orden #{o.id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="space-y-3 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  {o.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-bold uppercase">
                      <span>{it.qty}x {it.name}</span>
                      <span className="text-slate-400">${it.price?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {o.delivery === 'envio' && (
                  <div className="mb-8 p-5 bg-[#121212] text-[#d4af37] rounded-3xl text-[11px] font-black border-l-8 border-[#d4af37]">
                    ENTREGA: {o.address}, {o.zone}
                  </div>
                )}
                {activeTab === 'pedidos' && (
                  <button onClick={() => completeOrder(o.id)} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase shadow-lg shadow-emerald-100 active:scale-95 transition-all">Completar Pedido</button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}