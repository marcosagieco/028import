"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from "firebase/auth";

// --- ICONOS SVG NATIVOS (Para evitar errores de dependencias en Vercel) ---
const IconPackage = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
);
const IconList = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
);
const IconArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
const IconTruck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5h-7v6Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
);
const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const IconRefresh = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[#d4af37]"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
);

// --- LISTA DE PRODUCTOS COMPLETA ---
const ALL_PRODUCTS = [
  // Vapes Nicotina
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
  // Vapes THC
  { id: 18, name: "BLOW", category: "VAPES THC", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp" },
  { id: 19, name: "TORCH 7.5G", category: "VAPES THC", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png" },
  { id: 20, name: "PHENOM 6G", category: "VAPES THC", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg" },
  // Cargadores
  { id: 21, name: "CARGADOR 20W", category: "CARGADORES", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg" },
  { id: 22, name: "CARGADOR 35W", category: "CARGADORES", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg" },
  { id: 23, name: "CABLE USB-C A USB-C", category: "CARGADORES", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg" },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2 METROS", category: "CARGADORES", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg" }
];

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inicialización de Firebase con seguridad para Next.js Build
  const firebase = useMemo(() => {
    if (typeof window === "undefined") return { auth: null, db: null, appId: 'default' };
    
    try {
      const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };

      // Si no hay API Key (como en el build de Vercel si no están las variables), no inicializar Auth
      if (!config.apiKey) return { auth: null, db: null, appId: 'default' };

      const appInstance = !getApps().length ? initializeApp(config) : getApp();
      return { 
        auth: getAuth(appInstance), 
        db: getFirestore(appInstance),
        appId: typeof __app_id !== 'undefined' ? __app_id : (config.projectId || '028import')
      };
    } catch (error) {
      console.error("Firebase init error:", error);
      return { auth: null, db: null, appId: 'default' };
    }
  }, []);

  // 1. Manejo de Autenticación
  useEffect(() => {
    if (!firebase.auth) return;

    const unsub = onAuthStateChanged(firebase.auth, (u) => {
      if (!u) {
        signInAnonymously(firebase.auth).catch(console.error);
      }
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, [firebase.auth]);

  // 2. Sincronización de Datos
  useEffect(() => {
    if (!user || !firebase.db) return;

    // Productos
    const prodsColl = collection(firebase.db, 'artifacts', firebase.appId, 'public', 'data', 'products');
    const unsubProds = onSnapshot(prodsColl, (snap) => {
      const dbData = {};
      snap.forEach(d => dbData[d.id] = d.data());
      
      const merged = ALL_PRODUCTS.map(p => ({
        ...p,
        price: dbData[p.id]?.price || (p.price || 27000),
        inStock: dbData[p.id]?.inStock ?? true
      }));
      setProducts(merged);
    });

    // Pedidos
    const ordersColl = collection(firebase.db, 'artifacts', firebase.appId, 'public', 'data', 'orders');
    const unsubOrders = onSnapshot(ordersColl, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    return () => { unsubProds(); unsubOrders(); };
  }, [user, firebase.db, firebase.appId]);

  const updateProduct = async (id, field, value) => {
    if (!firebase.db) return;
    const pRef = doc(firebase.db, 'artifacts', firebase.appId, 'public', 'data', 'products', id.toString());
    await setDoc(pRef, { [field]: value }, { merge: true });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <IconRefresh />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      {/* Navbar Premium */}
      <nav className="bg-[#0a0a0a] text-white p-4 sticky top-0 z-50 flex justify-between items-center border-b border-[#d4af37]/30 shadow-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.href = '/'} className="p-2 hover:bg-slate-800 rounded-full transition-all">
            <IconArrowLeft />
          </button>
          <h1 className="font-black text-sm uppercase tracking-widest text-[#d4af37]">028 IMPORT ADMIN</h1>
        </div>
        <div className="bg-slate-800 px-3 py-1 rounded-full text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
          Conectado
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">
        
        {/* Gestión de Inventario */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
            <IconPackage />
            <h2 className="font-black uppercase text-xs tracking-[0.2em] text-slate-500">Control de Stock y Precios</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={p.image} className="w-16 h-16 rounded-2xl object-cover bg-slate-50 shadow-inner" alt="" />
                    {!p.inStock && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                        <IconX />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[11px] font-black uppercase text-slate-800 leading-tight mb-2">{p.name}</h3>
                    <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400">$</span>
                      <input 
                        type="number" 
                        defaultValue={p.price} 
                        onBlur={(e) => updateProduct(p.id, 'price', parseInt(e.target.value))}
                        className="w-24 bg-transparent border-none p-0 focus:ring-0 text-sm font-black text-indigo-600"
                      />
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => updateProduct(p.id, 'inStock', !p.inStock)}
                  className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase transition-all shadow-sm active:scale-95 ${
                    p.inStock 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}
                >
                  {p.inStock ? 'En Stock' : 'Agotado'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Historial de Ventas */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
            <IconList />
            <h2 className="font-black uppercase text-xs tracking-[0.2em] text-slate-500">Pedidos Recientes</h2>
          </div>
          
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400">
                <p className="font-bold uppercase text-[10px] tracking-widest">Esperando primeras ventas...</p>
              </div>
            ) : orders.map(o => (
              <div key={o.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                {/* Badge de Total */}
                <div className="absolute top-0 right-0 p-6 bg-slate-900 text-[#d4af37] font-black text-lg rounded-bl-[2rem] shadow-xl">
                  ${o.total?.toLocaleString('es-AR')}
                </div>
                
                <div className="flex flex-col mb-6">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">
                    {o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleString() : 'Recién procesado'}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-black uppercase text-slate-600 tracking-widest">ORDEN #{o.id.slice(-6).toUpperCase()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Lista de Items */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">Productos</p>
                    {o.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-800">{it.qty}x {it.name}</span>
                        <span className="text-xs font-bold text-slate-300">${it.price?.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Datos de Envío */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">Logística</p>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <IconTruck />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase">{o.delivery === 'envio' ? 'Envío a Domicilio' : 'Retiro en Local'}</p>
                        {o.delivery === 'envio' && (
                          <p className="text-[11px] font-medium text-slate-500 mt-1">
                            {o.address?.street || o.address}, {o.address?.zone || ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Estado Sutil */}
                <div className="mt-8 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <IconCheck />
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-tighter">Recibido correctamente</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      
      {/* Estilos Globales para Inputs */}
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}