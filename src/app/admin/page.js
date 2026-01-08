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

  // Inicialización de Firebase
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
      console.error("Firebase Admin Error:", err);
      return { auth: null, db: null };
    }
  }, []);

  useEffect(() => {
    if (!firebaseRefs.auth || !firebaseRefs.db) return;

    signInAnonymously(firebaseRefs.auth).catch(err => {
      console.error("Auth error:", err);
      setError("Error de autenticación");
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
        console.error("Error al obtener pedidos:", err);
        setError("No se pudo conectar con la base de datos.");
        setLoading(false);
      });

      return () => unsubscribeDocs();
    });

    return () => unsubscribeAuth();
  }, [firebaseRefs]);

  const deleteOrder = async (id) => {
    if (confirm("¿Confirmas que el pedido fue completado? Se eliminará de la lista.")) {
      try {
        await deleteDoc(doc(firebaseRefs.db, 'orders', id));
      } catch (err) {
        alert("Error al eliminar el pedido.");
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Pendiente...";
    try {
      const date = timestamp.toDate();
      return date.toLocaleString('es-AR', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return "Fecha desconocida";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Sincronizando 028 Panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] font-sans pb-10">
      <nav className="bg-[#121212] py-4 px-6 text-white flex justify-between items-center shadow-xl border-b border-[#d4af37]/30 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src={CONFIG.logoImage} alt="Logo" className="h-10 w-auto" />
          <h1 className="text-sm md:text-lg font-black tracking-tighter uppercase">Panel de <span className="text-[#d4af37]">Ventas</span></h1>
        </div>
        <div className="flex items-center gap-4">
            {error && <span className="text-red-500 text-[9px] font-bold uppercase">Error de Link</span>}
            <a href="/" className="text-[10px] text-gray-500 font-bold uppercase hover:text-white">Salir</a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Historial de Pedidos</h2>
          <span className="bg-black text-[#d4af37] text-[10px] font-black px-3 py-1 rounded">{orders.length} VENTAS</span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-100 text-center shadow-inner">
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">Aún no hay ventas registradas</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-[#d4af37]/50 transition-all duration-300">
                <div className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <div>
                      <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest block mb-1">CÓDIGO: {order.id.slice(-6).toUpperCase()}</span>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{formatDate(order.createdAt)}hs</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${order.delivery === 'envio' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {order.delivery === 'envio' ? '🛵 Envío Moto' : '🏢 Retiro Local'}
                      </span>
                      <button 
                        onClick={() => deleteOrder(order.id)}
                        className="bg-gray-50 text-gray-300 hover:text-red-500 w-10 h-10 rounded-xl transition-all flex items-center justify-center"
                      >
                        <i className="fas fa-check"></i>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 font-bold">
                          <span className="text-black font-black inline-block w-6">{item.qty}x</span> {item.name}
                        </span>
                        <span className="text-gray-400 font-black">${item.price?.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>

                  {order.delivery === 'envio' && order.address && (
                    <div className="mb-6 px-4 py-3 bg-black rounded-xl text-white shadow-lg">
                      <p className="text-[8px] font-black text-[#d4af37] uppercase mb-1">Destino:</p>
                      <p className="text-xs font-bold leading-tight">{order.address}</p>
                      <p className="text-[10px] opacity-60 uppercase mt-1">{order.zone}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                    <span className="text-[9px] font-black text-gray-300 uppercase">Recaudación</span>
                    <span className="text-2xl font-black text-black tracking-tighter">${order.total?.toLocaleString('es-AR')}</span>
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