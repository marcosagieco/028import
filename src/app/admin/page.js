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
  deleteDoc, 
  doc 
} from "firebase/firestore";

const CONFIG = {
  brandName: "028",
  brandSuffix: "import",
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png"
};

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
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

      // ESCÁNER DE VARIABLES: Nos dirá cuál falta
      const missingKeys = Object.entries(config)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingKeys.length > 0) {
        return { auth: null, db: null, err: `Faltan llaves en Vercel: ${missingKeys.join(', ')}` };
      }

      const app = !getApps().length ? initializeApp(config) : getApp();
      return { auth: getAuth(app), db: getFirestore(app) };
    } catch (err) {
      return { auth: null, db: null, err: err.message };
    }
  }, []);

  useEffect(() => {
    if (firebaseRefs.err) {
      setError(firebaseRefs.err);
      setLoading(false);
      return;
    }

    if (!firebaseRefs.auth || !firebaseRefs.db) return;

    signInAnonymously(firebaseRefs.auth).catch(() => setError("Error al conectar sesión segura."));

    const unsubscribeAuth = onAuthStateChanged(firebaseRefs.auth, (user) => {
      if (!user) return;
      const q = query(collection(firebaseRefs.db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubscribeDocs = onSnapshot(q, (snapshot) => {
        setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      }, (err) => {
        setError("Acceso Denegado: Revisa las Reglas (Rules) en Firebase.");
        setLoading(false);
      });
      return () => unsubscribeDocs();
    });

    return () => unsubscribeAuth();
  }, [firebaseRefs]);

  const deleteOrder = async (id) => {
    if (confirm("¿Pedido completado?")) {
      await deleteDoc(doc(firebaseRefs.db, 'orders', id));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 text-[10px] font-black uppercase">Sincronizando Boutique...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-red-50 p-6 rounded-full mb-6">
        <i className="fas fa-key text-red-500 text-3xl"></i>
      </div>
      <h2 className="text-xl font-black uppercase mb-4 tracking-tighter">Error de Configuración</h2>
      <p className="text-gray-500 text-sm mb-8 leading-relaxed font-mono bg-gray-100 p-4 rounded text-left">{error}</p>
      <button onClick={() => window.location.reload()} className="bg-black text-white px-8 py-3 rounded-xl font-bold text-xs uppercase shadow-xl hover:scale-105 transition-all">Reintentar</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-10">
      <nav className="bg-[#121212] py-5 px-6 text-white flex justify-between items-center shadow-2xl border-b border-[#d4af37]/30 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src={CONFIG.logoImage} alt="028 Logo" className="h-10 w-auto" />
          <h1 className="text-lg font-black tracking-tighter uppercase">028<span className="text-[#d4af37]">Control</span></h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-10 border-b border-gray-200 pb-6">
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter leading-none">Ventas</h2>
          <span className="bg-black text-[#d4af37] text-[10px] font-black px-4 py-2 rounded-full shadow-lg">{orders.length} TOTALES</span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-24 rounded-[3rem] border-2 border-dashed border-gray-100 text-center flex flex-col items-center">
            <i className="fas fa-receipt text-gray-200 text-4xl mb-4"></i>
            <p className="text-gray-300 font-bold uppercase text-[10px] tracking-widest italic">Sin pedidos por ahora</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 hover:shadow-2xl transition-all duration-500">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest block mb-1">ID: {order.id.slice(-6).toUpperCase()}</span>
                    <p className="text-gray-400 text-[10px] font-bold">{order.createdAt?.toDate().toLocaleString('es-AR')}</p>
                  </div>
                  <button onClick={() => deleteOrder(order.id)} className="bg-gray-50 text-gray-300 hover:bg-green-600 hover:text-white w-10 h-10 rounded-xl transition-all flex items-center justify-center">
                    <i className="fas fa-check"></i>
                  </button>
                </div>
                <div className="space-y-2 mb-6 bg-gray-50/50 p-5 rounded-2xl">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="font-bold">{item.qty}x {item.name}</span>
                      <span className="text-gray-400 font-black">${item.price?.toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
                {order.delivery === 'envio' && (
                  <div className="mb-6 p-4 bg-black text-white rounded-xl text-xs font-bold border-l-4 border-[#d4af37]">
                    {order.address} ({order.zone})
                  </div>
                )}
                <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                  <span className="text-[10px] font-black text-gray-300 uppercase">Recaudación</span>
                  <span className="text-2xl font-black text-black">${order.total?.toLocaleString('es-AR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
}