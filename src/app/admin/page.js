"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
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
  const [authReady, setAuthReady] = useState(false);

  // Inicialización de Firebase (Igual que en la Home)
  const firebaseRefs = useMemo(() => {
    if (typeof window === "undefined") return { auth: null, db: null };
    try {
        const firebaseConfig = {
  apiKey: "AIzaSyAMLaIvO0xGh6aD_g-_jkeF2MS7gUOpNow",
  authDomain: "paginadeventa028.firebaseapp.com",
  projectId: "paginadeventa028",
  storageBucket: "paginadeventa028.firebasestorage.app",
  messagingSenderId: "277653743644",
  appId: "1:277653743644:web:856f27f62da628a25717d9"
};
      
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      return { auth: getAuth(app), db: getFirestore(app) };
    } catch (error) {
      console.error("Error Firebase Admin:", error);
      return { auth: null, db: null };
    }
  }, []);

  useEffect(() => {
    if (firebaseRefs.auth && firebaseRefs.db) {
      // Nos aseguramos de tener sesión para leer
      signInAnonymously(firebaseRefs.auth).then(() => {
        setAuthReady(true);
        
        // Escuchar pedidos en tiempo real
        const q = query(collection(firebaseRefs.db, 'orders'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOrders(ordersData);
          setLoading(false);
        }, (err) => {
          console.error("Error leyendo pedidos:", err);
          setLoading(false);
        });

        return () => unsubscribe();
      });
    }
  }, [firebaseRefs]);

  const deleteOrder = async (id) => {
    if (confirm("¿Marcar como completado y eliminar de la lista?")) {
      try {
        await deleteDoc(doc(firebaseRefs.db, 'orders', id));
      } catch (err) {
        alert("Error al eliminar");
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "...";
    const date = timestamp.toDate();
    return date.toLocaleString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 font-bold animate-pulse">CARGANDO PANEL DE CONTROL...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-10">
      {/* Header Admin */}
      <nav className="bg-[#121212] py-4 px-6 text-white flex justify-between items-center shadow-lg border-b border-[#d4af37]/30">
        <div className="flex items-center gap-4">
          <img src={CONFIG.logoImage} alt="Logo" className="h-10 w-auto" />
          <h1 className="text-lg font-black tracking-tighter uppercase">
            Panel de <span className="text-[#d4af37]">Control</span>
          </h1>
        </div>
        <div className="text-[10px] bg-[#d4af37] text-black px-2 py-1 rounded font-bold">
          ADMIN ACTIVO
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Pedidos Recibidos</h2>
          <span className="text-gray-400 text-sm font-bold">{orders.length} pedidos totales</span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-gray-200 text-center">
            <i className="fas fa-box-open text-4xl text-gray-200 mb-4"></i>
            <p className="text-gray-400 font-medium">No hay pedidos pendientes por ahora.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <div>
                      <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest block mb-1">ID PEDIDO: {order.id.slice(0,8)}</span>
                      <p className="text-gray-400 text-xs font-bold">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${order.delivery === 'envio' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {order.delivery === 'envio' ? '🛵 Envío Moto' : '🏢 Retiro Local'}
                      </span>
                      <button 
                        onClick={() => deleteOrder(order.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-2"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                        <span className="text-gray-700 font-medium">
                          <strong className="text-black">{item.qty}x</strong> {item.name}
                        </span>
                        <span className="text-gray-400 font-bold">${item.price?.toLocaleString('es-AR')} c/u</span>
                      </div>
                    ))}
                  </div>

                  {order.delivery === 'envio' && (
                    <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Datos de Entrega</p>
                      <p className="text-sm font-bold text-gray-800">{order.address}</p>
                      <p className="text-xs text-gray-500">{order.zone}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Total del Pedido</span>
                    <span className="text-2xl font-black text-black tracking-tighter">${order.total?.toLocaleString('es-AR')}</span>
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