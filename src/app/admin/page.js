"use client";

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy 
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

const ALL_PRODUCTS_LIST = [
  // Mismo Catálogo que el Main (24 Productos)
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
  { id: 18, name: "BLOW THC", category: "VAPES THC", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp" },
  { id: 19, name: "TORCH 7.5G", category: "VAPES THC", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png" },
  { id: 20, name: "PHENOM 6G", category: "VAPES THC", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg" },
  { id: 21, name: "CARGADOR 20W", category: "CARGADORES", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg" },
  { id: 22, name: "CARGADOR 35W", category: "CARGADORES", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg" },
  { id: 23, name: "CABLE USB-C A USB-C", category: "CARGADORES", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg" },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M", category: "CARGADORES", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg" }
];

// ICONOS SVG
const IconArrowLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;
const IconSave = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconX = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;

export default function Admin() {
  const [products, setProducts] = useState(ALL_PRODUCTS_LIST.map(p => ({ ...p, price: 27000, inStock: true })));
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('stock');
  const [tempPrices, setTempPrices] = useState({});
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (!u) signInAnonymously(auth).catch(() => {});
      setUser(u);
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    // Sincronizar Productos con ID corregido (STRING)
    const prodsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const unsubProds = onSnapshot(prodsRef, (snap) => {
      const dbData = {};
      snap.forEach(d => { dbData[d.id] = d.data(); });
      setProducts(ALL_PRODUCTS_LIST.map(p => ({
        ...p,
        price: dbData[p.id.toString()]?.price || 27000,
        inStock: dbData[p.id.toString()]?.inStock ?? true
      })));
    });

    // Sincronizar Pedidos
    const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubProds(); unsubOrders(); };
  }, [user]);

  const updateDocField = async (id, data) => {
    setSaveStatus('guardando');
    try {
      const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', id.toString());
      await setDoc(pRef, data, { merge: true });
      setSaveStatus('listo');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (e) { console.error(e); setSaveStatus('error'); }
  };

  const handlePriceSave = (id) => {
    const val = parseInt(tempPrices[id]);
    if (isNaN(val)) return;
    updateDocField(id, { price: val });
    setTempPrices(prev => { const n = {...prev}; delete n[id]; return n; });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      <nav className="bg-[#0a0a0a] text-white p-5 sticky top-0 z-50 flex justify-between items-center border-b border-[#d4af37]/30 shadow-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.href = '/'} className="p-2 hover:bg-slate-800 rounded-full transition-all"><IconArrowLeft /></button>
          <h1 className="font-black text-sm uppercase tracking-widest text-[#d4af37]">028 ADMIN</h1>
        </div>
        <div className="flex items-center gap-3">
           {saveStatus === 'guardando' && <span className="text-[9px] font-bold text-amber-500 animate-pulse uppercase">Sincronizando...</span>}
           {saveStatus === 'listo' && <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Guardado Correctamente ✔</span>}
           <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">En Línea</div>
        </div>
      </nav>

      <div className="bg-white border-b sticky top-[77px] z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex">
          {['stock', 'pedidos'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'border-b-2 border-[#d4af37] text-black' : 'text-slate-400'}`}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-10">
        {activeTab === 'stock' ? (
          <div className="grid gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={p.image} className="w-16 h-16 rounded-2xl object-cover bg-slate-50" alt="" />
                    {!p.inStock && <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl"><IconX /></div>}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-slate-800 leading-tight mb-2">{p.name}</h3>
                    <div className="flex items-center gap-1 bg-slate-50 border rounded-xl px-3 py-1.5 focus-within:border-[#d4af37] transition-all">
                      <span className="text-[10px] font-bold text-slate-400">$</span>
                      <input 
                        type="number" 
                        placeholder={p.price} 
                        value={tempPrices[p.id] || ''} 
                        onChange={(e) => setTempPrices({...tempPrices, [p.id]: e.target.value})}
                        className="w-20 bg-transparent border-none p-0 text-sm font-black focus:ring-0 text-indigo-600" 
                      />
                      {tempPrices[p.id] && <button onClick={() => handlePriceSave(p.id)} className="ml-2 bg-indigo-600 text-white p-1.5 rounded-lg shadow-lg hover:scale-105 transition-transform"><IconSave /></button>}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => updateDocField(p.id, { inStock: !p.inStock })}
                  className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase transition-all shadow-sm active:scale-95 ${p.inStock ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100'}`}
                >
                  {p.inStock ? 'Habilitado' : 'Agotado'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 uppercase text-[10px] font-bold">No hay pedidos registrados</div>
            ) : orders.map(o => (
              <div key={o.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all">
                <div className="absolute top-0 right-0 p-6 bg-slate-900 text-[#d4af37] font-black text-xl rounded-bl-[2.5rem] shadow-xl">${o.total?.toLocaleString('es-AR')}</div>
                <div className="mb-6"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{o.createdAt?.toDate().toLocaleString() || 'Recién recibido'}</span><p className="text-xs font-black uppercase text-slate-600 mt-1">Orden #{o.id.slice(-6).toUpperCase()}</p></div>
                <div className="space-y-3 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">{o.items?.map((it, idx) => (<div key={idx} className="flex justify-between items-center text-xs font-bold uppercase"><span>{it.qty}x {it.name}</span><span className="text-slate-400">${it.price?.toLocaleString()}</span></div>))}</div>
                {o.delivery === 'envio' && <div className="p-5 bg-[#121212] text-[#d4af37] rounded-3xl text-[11px] font-black border-l-8 border-[#d4af37] uppercase tracking-tighter shadow-lg">ENTREGA: {o.address?.street}, {o.address?.zone}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }`}</style>
    </div>
  );
}