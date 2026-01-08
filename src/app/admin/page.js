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

  // Sistema de Diagnóstico de Variables de Entorno
  const firebaseRefs = useMemo(() => {
    if (typeof window === "undefined") return { auth: null, db: null };

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };

    // Verificación estricta: Next.js requiere NEXT_PUBLIC_ para exponer al cliente
    const missing = Object.entries(firebaseConfig)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      return { 
        auth: null, 
        db: null, 
        err: `⚠️ ERROR DE CONFIGURACIÓN: El navegador no puede leer las llaves. Asegúrate de que en Vercel los nombres empiecen exactamente con "NEXT_PUBLIC_". Faltan: ${missing.join(', ')}` 
      };
    }

    try {
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      return { auth: getAuth(app), db: getFirestore(app) };
    } catch (err) {
      return { auth: null, db: null, err: `Error de Firebase: ${err.message}` };
    }
  }, []);

  useEffect(() => {
    if (firebaseRefs.err) {
      setError(firebaseRefs.err);
      setLoading(false);
      return;
    }

    if (!firebaseRefs.auth || !firebaseRefs.db) return;

    // Autenticación anónima para permisos de lectura
    signInAnonymously(firebaseRefs.auth).catch(err => {
      setError(`Error de Autenticación: ${err.message}`);
    });

    const unsubscribeAuth = onAuthStateChanged(firebaseRefs.auth, (user) => {
      if (!user) return;

      const q = query(collection(firebaseRefs.db, 'orders'), orderBy('createdAt', 'desc'));
      
      const unsubscribeDocs = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
        setLoading(false);
        setError(null);
      }, (err) => {
        console.error("Firestore Error:", err);
        setError("Acceso Denegado: Revisa las Reglas (Rules) en tu consola de Firebase.");
        setLoading(false);
      });

      return () => unsubscribeDocs();
    });

    return () => unsubscribeAuth();
  }, [firebaseRefs]);

  const deleteOrder = async (id) => {
    if (confirm("¿Confirmas que el pedido fue completado?")) {
      try {
        await deleteDoc(doc(firebaseRefs.db, 'orders', id));
      } catch (err) {
        alert("No tienes permisos suficientes para borrar.");
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Boutique 028...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
      <div className="bg-red-50 p-6 rounded-3xl mb-8">
        <i className="fas fa-plug text-red-500 text-4xl"></i>
      </div>
      <h2 className="text-2xl font-black uppercase mb-4 tracking-tighter">Problema de Conexión</h2>
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-left mb-8 max-w-md">
        <p className="text-gray-600 text-[11px] font-mono leading-relaxed">{error}</p>
      </div>
      <button onClick={() => window.location.reload()} className="bg-black text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all mb-4">Reintentar</button>
      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
        SI EL ERROR PERSISTE: <br/>
        1. Ve a Vercel {"->"} Settings {"->"} Environment Variables. <br/>
        2. Revisa que el nombre incluya "NEXT_PUBLIC_". <br/>
        3. Haz un Redeploy SIN build cache.
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-10">
      <nav className="bg-[#121212] py-5 px-6 text-white flex justify-between items-center shadow-2xl border-b border-[#d4af37]/30 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src={CONFIG.logoImage} alt="028 Logo" className="h-10 w-auto object-contain" />
          <h1 className="text-lg font-black tracking-tighter uppercase tracking-widest">
            028<span className="text-[#d4af37]">Control</span>
          </h1>
        </div>
        <a href="/" className="text-[10px] text-gray-500 font-bold uppercase hover:text-white transition-all">Ver Tienda</a>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-end mb-10 border-b border-gray-200 pb-6">
          <div>
            <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter leading-none">Ventas Recientes</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-3 tracking-widest">Gestión de stock activa</p>
          </div>
          <span className="bg-black text-[#d4af37] text-[10px] font-black px-4 py-2 rounded-full shadow-lg">
            {orders.length} PEDIDOS
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-24 rounded-[3rem] border-2 border-dashed border-gray-100 text-center flex flex-col items-center shadow-inner">
            <i className="fas fa-receipt text-gray-100 text-6xl mb-4"></i>
            <p className="text-gray-300 font-bold uppercase text-xs tracking-widest">Esperando primeras ventas...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:border-[#d4af37]/40 transition-all duration-500">
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#d4af37] font-black text-xs shadow-inner">
                        {order.items?.reduce((a, b) => a + b.qty, 0)}
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest block mb-0.5">ORDEN: {order.id.slice(-6).toUpperCase()}</span>
                        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">
                          {order.createdAt ? order.createdAt.toDate().toLocaleString('es-AR') : 'Recibiendo...'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${order.delivery === 'envio' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {order.delivery === 'envio' ? 'Moto 🛵' : 'Retiro 🏢'}
                      </span>
                      <button 
                        onClick={() => deleteOrder(order.id)}
                        className="bg-gray-50 text-gray-300 hover:bg-green-600 hover:text-white w-12 h-12 rounded-2xl transition-all flex items-center justify-center shadow-sm"
                      >
                        <i className="fas fa-check text-lg"></i>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-inner">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-700 font-bold uppercase tracking-tight">
                          <span className="bg-white text-black font-black inline-flex w-7 h-7 items-center justify-center rounded-lg shadow-sm mr-3">{item.qty}</span> 
                          {item.name}
                        </span>
                        <span className="text-gray-400 font-black tracking-tighter">${item.price?.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>

                  {order.delivery === 'envio' && order.address && (
                    <div className="mb-8 px-6 py-5 bg-[#121212] rounded-2xl text-white shadow-xl border-l-4 border-[#d4af37]">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-map-marker-alt text-[#d4af37] text-[10px]"></i>
                        <p className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest">Destino de Entrega</p>
                      </div>
                      <p className="text-sm font-bold tracking-tight uppercase leading-relaxed">{order.address}</p>
                      <p className="text-[10px] opacity-40 uppercase mt-1 font-black tracking-widest">{order.zone}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-end border-t border-gray-50 pt-6">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Recaudación</span>
                    <span className="text-3xl font-black text-black tracking-tighter">
                      <span className="text-[#d4af37] text-sm mr-1.5 font-black">$</span>
                      {order.total?.toLocaleString('es-AR')}
                    </span>
                  </div>
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