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
  const [user, setUser] = useState(null);

  // Inicialización de Firebase con control de entorno
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

      // Si no hay API Key, algo salió mal con las variables de entorno
      if (!firebaseConfig.apiKey) {
        console.warn("Faltan variables de entorno de Firebase");
      }

      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      return { auth: getAuth(app), db: getFirestore(app) };
    } catch (error) {
      console.error("Error crítico Firebase Admin:", error);
      return { auth: null, db: null };
    }
  }, []);

  useEffect(() => {
    if (firebaseRefs.auth && firebaseRefs.db) {
      // Intentar sesión anónima para poder leer la DB
      signInAnonymously(firebaseRefs.auth).catch(err => {
        console.error("Error al iniciar sesión anónima:", err);
      });

      const unsubscribeAuth = onAuthStateChanged(firebaseRefs.auth, (u) => {
        setUser(u);
        
        // Solo empezamos a escuchar pedidos si hay una referencia válida a la DB
        const q = query(collection(firebaseRefs.db, 'orders'), orderBy('createdAt', 'desc'));
        
        const unsubscribeDocs = onSnapshot(q, (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOrders(ordersData);
          setLoading(false);
        }, (err) => {
          console.error("Error escuchando pedidos:", err);
          setLoading(false);
        });

        return () => unsubscribeDocs();
      });

      return () => unsubscribeAuth();
    } else {
      // Si después de 5 segundos no carga, quitamos el loading para mostrar el estado vacío/error
      const timer = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [firebaseRefs]);

  const deleteOrder = async (id) => {
    if (confirm("¿Confirmas que el pedido fue entregado? Se eliminará de la lista.")) {
      try {
        await deleteDoc(doc(firebaseRefs.db, 'orders', id));
      } catch (err) {
        alert("Error al eliminar el pedido.");
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Recién...";
    try {
      const date = timestamp.toDate();
      return date.toLocaleString('es-AR', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return "Fecha no válida";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Cargando Panel 028</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] font-sans pb-20">
      {/* Navbar Admin */}
      <nav className="bg-[#121212] py-4 px-6 text-white flex justify-between items-center shadow-2xl border-b border-[#d4af37]/30 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src={CONFIG.logoImage} alt="Logo" className="h-10 w-auto object-contain" />
          <h1 className="text-sm md:text-lg font-black tracking-tighter uppercase">
            Panel de <span className="text-[#d4af37]">Ventas</span>
          </h1>
        </div>
        <a href="/" className="text-[10px] text-gray-400 hover:text-white uppercase font-bold transition-colors">
          Volver a la Web
        </a>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-end mb-10 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Pedidos</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Gestión de stock en tiempo real</p>
          </div>
          <span className="bg-black text-[#d4af37] text-[10px] font-black px-3 py-1 rounded">
            {orders.length} TOTALES
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border-2 border-dashed border-gray-200 text-center shadow-inner">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-box-open text-gray-200 text-2xl"></i>
            </div>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No hay pedidos pendientes</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:border-[#d4af37]/50 transition-all duration-300">
                <div className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black text-black uppercase tracking-widest">ORDEN: {order.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{formatDate(order.createdAt)}hs</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${order.delivery === 'envio' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {order.delivery === 'envio' ? '🛵 Envío a Moto' : '🏢 Retiro Local'}
                      </span>
                      <button 
                        onClick={() => deleteOrder(order.id)}
                        className="bg-gray-50 text-gray-300 hover:bg-red-50 hover:text-red-500 w-10 h-10 rounded-xl transition-all flex items-center justify-center"
                        title="Eliminar pedido"
                      >
                        <i className="fas fa-check text-xs"></i>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 font-bold italic">
                          <span className="text-black not-italic font-black inline-block w-6">{item.qty}x</span> {item.name}
                        </span>
                        <span className="text-gray-400 font-black">${item.price?.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>

                  {order.delivery === 'envio' && (
                    <div className="mb-6 px-4 py-3 bg-black rounded-xl text-white shadow-xl">
                      <p className="text-[8px] font-black text-[#d4af37] uppercase mb-1 tracking-widest">Dirección de Entrega</p>
                      <p className="text-xs font-bold">{order.address}</p>
                      <p className="text-[10px] opacity-60 uppercase">{order.zone}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-end">
                    <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Monto Recaudado</div>
                    <div className="text-2xl font-black text-black tracking-tighter leading-none">
                      <span className="text-[#d4af37] text-sm mr-1">$</span>
                      {order.total?.toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FontAwesome */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
}