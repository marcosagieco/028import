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
  const [debugInfo, setDebugInfo] = useState("");

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

      // Verificación de variables de entorno
      if (!firebaseConfig.apiKey) {
        return { auth: null, db: null, err: "Faltan las Variables de Entorno en el panel de Vercel (API_KEY)." };
      }

      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
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

    // Timeout para no quedarse cargando eternamente
    const timer = setTimeout(() => {
      if (loading && !error) {
        setError("La conexión está tardando demasiado. Verifica que Cloud Firestore esté activado en Firebase.");
        setLoading(false);
      }
    }, 10000);

    signInAnonymously(firebaseRefs.auth).catch(err => {
      setDebugInfo(`Error de Auth: ${err.code}`);
    });

    const unsubscribeAuth = onAuthStateChanged(firebaseRefs.auth, (user) => {
      if (!user) {
        setDebugInfo("Esperando autenticación segura...");
        return;
      }

      setDebugInfo("Conectado. Buscando pedidos...");

      const q = query(collection(firebaseRefs.db, 'orders'), orderBy('createdAt', 'desc'));
      
      const unsubscribeDocs = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
        setLoading(false);
        setError(null);
        clearTimeout(timer);
      }, (err) => {
        console.error(err);
        if (err.code === 'permission-denied') {
          setError("Acceso Denegado: Revisa la pestaña 'Rules' en Firebase y asegúrate de haber dado a 'Publish'.");
        } else {
          setError(`Error de base de datos: ${err.message}`);
        }
        setLoading(false);
        clearTimeout(timer);
      });

      return () => unsubscribeDocs();
    });

    return () => {
      unsubscribeAuth();
      clearTimeout(timer);
    };
  }, [firebaseRefs, loading, error]);

  const deleteOrder = async (id) => {
    if (confirm("¿Confirmas que el pedido fue completado?")) {
      try {
        await deleteDoc(doc(firebaseRefs.db, 'orders', id));
      } catch (err) {
        alert("No tienes permiso para borrar. Revisa las reglas.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Sincronizando Panel 028</p>
        <p className="text-gray-300 text-[9px] font-medium italic">{debugInfo}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-50 p-6 rounded-full mb-6">
          <i className="fas fa-exclamation-circle text-red-500 text-4xl"></i>
        </div>
        <h2 className="text-xl font-black uppercase mb-4 tracking-tighter">Problema de Conexión</h2>
        <p className="text-gray-500 text-sm mb-8 max-w-sm leading-relaxed">{error}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => window.location.reload()} className="bg-black text-white py-4 rounded-xl font-bold text-xs uppercase shadow-xl hover:scale-105 transition-all">Reintentar</button>
          <a href="/" className="text-gray-400 font-bold text-[10px] uppercase">Volver al inicio</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-10">
      <nav className="bg-[#121212] py-5 px-6 text-white flex justify-between items-center shadow-2xl border-b border-[#d4af37]/30 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src={CONFIG.logoImage} alt="028 Logo" className="h-10 w-auto" />
          <h1 className="text-lg font-black tracking-tighter uppercase">028<span className="text-[#d4af37]">Control</span></h1>
        </div>
        <a href="/" className="bg-[#d4af37] text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg">Ver Web</a>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-10 border-b border-gray-200 pb-6">
          <div>
            <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Ventas</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Panel de control de pedidos</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-gray-400 mb-1">TOTAL ACTIVOS</span>
            <span className="text-2xl font-black text-black">{orders.length}</span>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-24 rounded-[3rem] border-2 border-dashed border-gray-100 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <i className="fas fa-box-open text-gray-200 text-3xl"></i>
            </div>
            <p className="text-gray-300 font-bold uppercase text-[10px] tracking-widest italic">No se han encontrado ventas registradas</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-[#d4af37]/20 transition-all duration-500 group">
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-[#d4af37] font-black text-lg shadow-xl group-hover:rotate-6 transition-transform">
                        {order.items?.reduce((a, b) => a + b.qty, 0)}
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest block mb-1">REGISTRO: {order.id.slice(-6).toUpperCase()}</span>
                        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">
                          {order.createdAt ? order.createdAt.toDate().toLocaleString('es-AR') : 'Procesando...'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${order.delivery === 'envio' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
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

                  <div className="space-y-3 mb-8 bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100 shadow-inner">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-700 font-bold">
                          <span className="bg-white text-black font-black inline-flex w-8 h-8 items-center justify-center rounded-xl shadow-sm mr-4">{item.qty}</span> 
                          <span className="uppercase tracking-tight text-gray-800">{item.name}</span>
                        </span>
                        <span className="text-gray-400 font-black tracking-tighter">${item.price?.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>

                  {order.delivery === 'envio' && order.address && (
                    <div className="mb-8 px-6 py-5 bg-[#121212] rounded-[1.5rem] text-white shadow-2xl border-l-8 border-[#d4af37]">
                      <div className="flex items-center gap-3 mb-3">
                        <i className="fas fa-map-marked-alt text-[#d4af37] text-xs"></i>
                        <p className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest">Hoja de Ruta</p>
                      </div>
                      <p className="text-sm font-bold tracking-tight mb-1 uppercase">{order.address}</p>
                      <p className="text-[10px] opacity-40 uppercase font-black tracking-widest">{order.zone}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-gray-50 pt-6">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Total Cobrado</span>
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