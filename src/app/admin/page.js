"use client";

import React, { useState, useEffect, useMemo } from 'react';
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

// Inicialización segura
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '028import';

// --- ICONOS SVG NATIVOS ---
const IconArrowLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;
const IconPackage = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const IconX = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;

const ALL_PRODUCTS_LIST = [
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

export default function AdminPage() {
  const [products, setProducts] = useState(ALL_PRODUCTS_LIST.map(p => ({ ...p, price: 27000, inStock: true })));
  const [user, setUser] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (!u) signInAnonymously(auth);
      setUser(u);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const prodsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const unsub = onSnapshot(prodsRef, (snap) => {
      const dbData = {};
      snap.forEach(d => dbData[d.id] = d.data());
      setProducts(ALL_PRODUCTS_LIST.map(p => ({
        ...p,
        price: dbData[p.id.toString()]?.price || 27000,
        inStock: dbData[p.id.toString()]?.inStock ?? true
      })));
    });
    return () => unsub();
  }, [user]);

  const updateProduct = async (id, field, value) => {
    if (!user) return;
    setSaveStatus('guardando');
    try {
      const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', id.toString());
      await setDoc(pRef, { [field]: value }, { merge: true });
      setSaveStatus('listo');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (e) {
      setSaveStatus('error');
    }
  };

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
          {saveStatus === 'listo' && <span className="text-[9px] font-bold text-emerald-500 uppercase">Guardado ✔</span>}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="flex items-center gap-2 mb-6 border-b pb-3 border-slate-200">
          <IconPackage />
          <h2 className="font-black uppercase text-xs text-slate-500 tracking-widest">Gestión de Inventario</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={p.image} className="w-16 h-16 rounded-2xl object-cover bg-slate-50" alt="" />
                  {!p.inStock && <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl"><IconX /></div>}
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase text-slate-800 leading-tight mb-2">{p.name}</h3>
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl">
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
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                  p.inStock ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}
              >
                {p.inStock ? 'En Stock' : 'Agotado'}
              </button>
            </div>
          ))}
        </div>
      </div>
      <style>{`input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }`}</style>
    </div>
  );
}