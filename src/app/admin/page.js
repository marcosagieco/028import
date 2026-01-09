"use client";

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot 
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken 
} from "firebase/auth";

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
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : (firebaseConfig.projectId || '028import');

// --- ICONOS SVG ---
const IconArrowLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;
const IconPackage = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const IconTruck = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5h-7v6Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>;
const IconX = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;

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

export default function App() {
  const [products, setProducts] = useState(ALL_PRODUCTS_LIST.map(p => ({ ...p, price: 27000, inStock: true })));
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);

  // 1. Autenticación robusta
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
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Sincronización con corrección de ID (String mapping)
  useEffect(() => {
    if (!user) return;

    const prodsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const unsubProds = onSnapshot(prodsRef, (snap) => {
      const dbData = {};
      snap.forEach(d => {
        dbData[d.id] = d.data(); // d.id es un STRING siempre
      });

      setProducts(ALL_PRODUCTS_LIST.map(p => {
        const remoteData = dbData[p.id.toString()]; // Convertimos ID numérico a STRING para buscar
        return {
          ...p,
          price: remoteData?.price ?? 27000,
          inStock: remoteData?.inStock ?? true
        };
      }));
    }, (err) => console.error("Error Prods Sync:", err));

    const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
    const unsubOrders = onSnapshot(ordersRef, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(list.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (err) => console.error("Error Orders Sync:", err));

    return () => { unsubProds(); unsubOrders(); };
  }, [user]);

  const updateProduct = async (id, field, value) => {
    if (!user) return;
    setSaveStatus('guardando');
    try {
      // Usamos el ID como STRING para el nombre del documento en Firebase
      const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', id.toString());
      await setDoc(pRef, { [field]: value }, { merge: true });
      setSaveStatus('listo');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (e) {
      console.error("Update Error:", e);
      setSaveStatus('error');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#d4af37] font-black uppercase tracking-widest">
      Iniciando Panel...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      <nav className="bg-[#0a0a0a] text-white p-4 sticky top-0 z-50 flex justify-between items-center border-b border-[#d4af37]/30 shadow-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.href = '/'} className="p-2 hover:bg-gray-800 rounded-full transition-all">
            <IconArrowLeft />
          </button>
          <h1 className="font-black text-sm uppercase tracking-widest text-[#d4af37]">028 ADMIN</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {saveStatus === 'guardando' && <span className="text-[9px] font-bold text-amber-500 uppercase animate-pulse">Sincronizando...</span>}
          {saveStatus === 'listo' && <span className="text-[9px] font-bold text-emerald-500 uppercase">Guardado en Nube ✔</span>}
          <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-bold uppercase">Conectado</div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">
        <section>
          <div className="flex items-center gap-2 mb-6 border-b pb-3 border-slate-200">
            <IconPackage />
            <h2 className="font-black uppercase text-xs text-slate-500 tracking-widest">Gestión de Productos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={p.image} className="w-16 h-16 rounded-2xl object-cover bg-slate-50 shadow-inner" alt="" />
                    {!p.inStock && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl">
                        <IconX />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-slate-800 leading-tight mb-2">{p.name}</h3>
                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-400">$</span>
                      <input 
                        type="number" 
                        defaultValue={p.price} 
                        onBlur={(e) => updateProduct(p.id, 'price', parseInt(e.target.value))} 
                        className="w-20 bg-transparent border-none p-0 text-sm font-black text-indigo-600 focus:ring-0" 
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => updateProduct(p.id, 'inStock', !p.inStock)} 
                  className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase transition-all shadow-sm active:scale-95 ${
                    p.inStock ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}
                >
                  {p.inStock ? 'En Stock' : 'Agotado'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6 border-b pb-3 border-slate-200">
            <h2 className="font-black uppercase text-xs text-slate-500 tracking-widest">Últimos Pedidos</h2>
          </div>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                No hay ventas aún
              </div>
            ) : orders.map(o => (
              <div key={o.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-5 bg-slate-900 text-[#d4af37] font-black text-sm rounded-bl-2xl">
                  ${o.total?.toLocaleString('es-AR')}
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase mb-4">
                  {o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleString() : 'Recién recibido'}
                </div>
                <div className="space-y-2 mb-4 border-l-4 border-slate-50 pl-4">
                  {o.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{it.qty}x {it.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase pt-4 border-t border-slate-50">
                  <IconTruck />
                  <span>{o.delivery === 'envio' ? `Envío a: ${o.address?.street || o.address}` : 'Retiro en local'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <style>{`input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }`}</style>
    </div>
  );
}