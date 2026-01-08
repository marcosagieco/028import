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
    } catch (err) {
      console.error("Admin Firebase Init Error:", err);
      return { auth: null, db: null };
    }
  }, []);

  useEffect(() => {
    if (!firebaseRefs.auth || !firebaseRefs.db) return;

    signInAnonymously(firebaseRefs.auth).catch(err => {
      console.error("Auth error:", err);
      setError("Error de autenticación anónima");
    });

    const unsubscribeAuth = onAuthStateChanged(firebaseRefs.auth, (user) => {
      if (!user) return;

      // Escuchador en tiempo real de la colección 'orders'
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
        console.error("Firestore Listen Error:", err);
        setError("Revisa las Reglas de Seguridad en tu consola Firebase.");
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
        alert("Error al eliminar pedido.");
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Pendiente...";
    try {
      const date = timestamp.toDate();
      return date.toLocaleString('es-AR', { 
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
      });
    } catch (e) {
      return "Fecha desconocida";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Sincronizando Base de Datos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <nav className="bg-[#121212] py-4 px-6 text-white flex justify-between items-center shadow-2xl border-b border-[#d4af37]/30 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src={CONFIG.logoImage} alt="Logo" className="h-10 w-auto" />
          <h1 className="text-lg font-black tracking-tighter uppercase tracking-widest">
            028<span className="text-[#d4af37]">Control</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
            {error && <span className="text-red-500 text-[10px] font-bold uppercase">{error}</span>}
            <a href="/" className="text-[10px] text-gray-500 font-bold uppercase hover:text-white transition-all">Ver Web</a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter leading-none">Ventas Recientes</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Monitoreo de pedidos activos</p>
          </div>
          <span className="bg-black text-[#d4af37] text-[10px] font-black px-4 py-2 rounded-full shadow-lg">
            {orders.length} TOTALES
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-20 rounded-[2rem] border-2 border-dashed border-gray-100 text-center shadow-inner flex flex-col items-center">
            <i className="fas fa-receipt text-gray-100 text-6xl mb-4"></i>
            <p className="text-gray-300 font-bold uppercase text-xs tracking-widest">Esperando primeras ventas...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:border-[#d4af37]/40 transition-all duration-500 group">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#d4af37] font-black text-xs shadow-inner">
                        {order.items?.reduce((a, b) => a + b.qty, 0)}
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest block mb-0.5">ORDEN: {order.id.slice(-6).toUpperCase()}</span>
                        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${order.delivery === 'envio' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {order.delivery === 'envio' ? 'Moto 🛵' : 'Retiro 🏢'}
                      </span>
                      <button 
                        onClick={() => deleteOrder(order.id)}
                        className="bg-gray-50 text-gray-300 hover:bg-green-50 hover:text-green-600 w-12 h-12 rounded-2xl transition-all flex items-center justify-center shadow-sm"
                      >
                        <i className="fas fa-check text-lg"></i>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 shadow-inner">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-700 font-bold">
                          <span className="bg-white text-black font-black inline-flex w-7 h-7 items-center justify-center rounded-lg shadow-sm mr-3">{item.qty}</span> 
                          <span className="uppercase tracking-tight">{item.name}</span>
                        </span>
                        <span className="text-gray-400 font-black">${item.price?.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>

                  {order.delivery === 'envio' && order.address && (
                    <div className="mb-6 px-5 py-4 bg-[#121212] rounded-2xl text-white shadow-xl border-l-4 border-[#d4af37]">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-map-marker-alt text-[#d4af37] text-[10px]"></i>
                        <p className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest">Destino de Entrega</p>
                      </div>
                      <p className="text-sm font-bold tracking-tight">{order.address}</p>
                      <p className="text-[10px] opacity-50 uppercase mt-1 font-black tracking-widest">{order.zone}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-end pt-2">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Recaudación</span>
                    <span className="text-3xl font-black text-black tracking-tighter">
                      <span className="text-[#d4af37] text-sm mr-1 font-black">$</span>
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