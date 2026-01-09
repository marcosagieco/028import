"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// --- ICONOS SVG NATIVOS ---
const IconArrowLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;
const IconPackage = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const IconTruck = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5h-7v6Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>;
const IconX = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;

const ALL_PRODUCTS_LIST = [
  // Nicotina
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
  // THC
  { id: 18, name: "BLOW THC", category: "VAPES THC", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp" },
  { id: 19, name: "TORCH 7.5G", category: "VAPES THC", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png" },
  { id: 20, name: "PHENOM 6G", category: "VAPES THC", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg" },
  // Cargadores
  { id: 21, name: "CARGADOR 20W", category: "CARGADORES", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg" },
  { id: 22, name: "CARGADOR 35W", category: "CARGADORES", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg" },
  { id: 23, name: "CABLE USB-C A USB-C", category: "CARGADORES", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg" },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M", category: "CARGADORES", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg" }
];

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const firebase = useMemo(() => {
    if (typeof window === "undefined") return { auth: null, db: null, appId: 'default' };
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };
    const appInstance = !getApps().length ? initializeApp(config) : getApp();
    return { auth: getAuth(appInstance), db: getFirestore(appInstance), appId: config.projectId || '028import' };
  }, []);

  useEffect(() => {
    if (!firebase.auth) return;
    const unsubAuth = onAuthStateChanged(firebase.auth, (u) => {
      if (!u) signInAnonymously(firebase.auth).catch(() => {});
      setLoading(false);
    });
    return () => unsubAuth();
  }, [firebase.auth]);

  useEffect(() => {
    if (!firebase.db) return;
    const prodsRef = collection(firebase.db, 'artifacts', firebase.appId, 'public', 'data', 'products');
    const unsub = onSnapshot(prodsRef, (snap) => {
      const dbData = {};
      snap.forEach(d => dbData[d.id] = d.data());
      setProducts(ALL_PRODUCTS_LIST.map(p => ({
        ...p,
        price: dbData[p.id]?.price || 27000,
        inStock: dbData[p.id]?.inStock ?? true
      })));
    });

    const ordersRef = collection(firebase.db, 'artifacts', firebase.appId, 'public', 'data', 'orders');
    const unsubOrders = onSnapshot(ordersRef, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(list.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    return () => { unsub(); unsubOrders(); };
  }, [firebase.db, firebase.appId]);

  const updateProduct = async (id, field, value) => {
    if (!firebase.db) return;
    const pRef = doc(firebase.db, 'artifacts', firebase.appId, 'public', 'data', 'products', id.toString());
    await setDoc(pRef, { [field]: value }, { merge: true });
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#d4af37]">Cargando Panel...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      <nav className="bg-[#0a0a0a] text-white p-4 sticky top-0 z-50 flex justify-between items-center border-b border-[#d4af37]/30 shadow-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.href = '/'} className="p-2"><IconArrowLeft /></button>
          <h1 className="font-black text-sm uppercase tracking-widest text-[#d4af37]">028 ADMIN</h1>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">
        <section>
          <div className="flex items-center gap-2 mb-6 border-b pb-3"><IconPackage /><h2 className="font-black uppercase text-xs text-slate-500">Gestión de Stock</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-3xl shadow-sm border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={p.image} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                  <div>
                    <h3 className="text-[11px] font-black uppercase text-slate-800 leading-tight mb-2">{p.name}</h3>
                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl">
                      <span className="text-xs font-bold text-slate-400">$</span>
                      <input type="number" defaultValue={p.price} onBlur={(e) => updateProduct(p.id, 'price', parseInt(e.target.value))} className="w-20 bg-transparent border-none p-0 text-sm font-black text-indigo-600 focus:ring-0" />
                    </div>
                  </div>
                </div>
                <button onClick={() => updateProduct(p.id, 'inStock', !p.inStock)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${p.inStock ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {p.inStock ? 'En Stock' : 'Agotado'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6 border-b pb-3"><h2 className="font-black uppercase text-xs text-slate-500">Pedidos Recientes</h2></div>
          <div className="space-y-4">
            {orders.map(o => (
              <div key={o.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 bg-slate-900 text-[#d4af37] font-black text-xs rounded-bl-2xl shadow-lg">${o.total?.toLocaleString()}</div>
                <div className="text-[10px] font-black text-slate-300 uppercase mb-4">{o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleString() : 'Recién recibido'}</div>
                <div className="space-y-2">{o.items?.map((it, idx) => (<div key={idx} className="flex justify-between text-xs font-bold text-slate-700"><span>{it.qty}x {it.name}</span></div>))}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}