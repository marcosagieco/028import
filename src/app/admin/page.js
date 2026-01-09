import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from "firebase/auth";
import { 
  Package, 
  ClipboardList, 
  ArrowLeft, 
  Truck, 
  X, 
  RefreshCcw, 
  CheckCircle2, 
  DollarSign 
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE INTEGRADA ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "",
      authDomain: "shop-028.firebaseapp.com",
      projectId: "shop-028",
      storageBucket: "shop-028.appspot.com",
      messagingSenderId: "12345",
      appId: "12345"
    };

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Lista de productos base para inicializar/sincronizar
const ALL_PRODUCTS = [
  // Vapes Nicotina
  { id: 1, name: "BAJA SPLASH", category: "VAPES NICOTINA", image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png" },
  { id: 2, name: "BLUE RAZZ ICE", category: "VAPES NICOTINA", image: "https://i.postimg.cc/s2Tmw67w/BLUE-RAZZ-ICE.webp" },
  { id: 3, name: "CHERRY FUSE", category: "VAPES NICOTINA", image: "https://i.postimg.cc/yd5PzDfx/CHERRY-FUSE.png" },
  { id: 4, name: "CHERRY STRAZZ", category: "VAPES NICOTINA", image: "https://i.postimg.cc/7PFVsTG2/CHERRY-STRAZZ.jpg" },
  // Vapes THC
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Autenticación (Regla 3)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error(err); }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Sincronización (Regla 1 y 2)
  useEffect(() => {
    if (!user) return;

    // Productos
    const prodsColl = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const unsubProds = onSnapshot(prodsColl, (snap) => {
      const dbData = {};
      snap.forEach(d => dbData[d.id] = d.data());
      
      const merged = ALL_PRODUCTS.map(p => ({
        ...p,
        price: dbData[p.id]?.price || 27000, // Precio por defecto si no existe
        inStock: dbData[p.id]?.inStock ?? true
      }));
      setProducts(merged);
    });

    // Pedidos
    const ordersColl = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
    const unsubOrders = onSnapshot(ordersColl, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    return () => { unsubProds(); unsubOrders(); };
  }, [user]);

  const updateProduct = async (id, field, value) => {
    const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', id.toString());
    await setDoc(pRef, { [field]: value }, { merge: true });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <RefreshCcw className="text-[#d4af37] animate-spin" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      {/* Navbar Premium */}
      <nav className="bg-[#0a0a0a] text-white p-4 sticky top-0 z-50 flex justify-between items-center border-b border-[#d4af37]/30 shadow-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.href = '/'} className="p-2 hover:bg-slate-800 rounded-full transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-black text-sm uppercase tracking-widest text-[#d4af37]">028 IMPORT ADMIN</h1>
        </div>
        <div className="bg-slate-800 px-3 py-1 rounded-full text-[9px] font-bold text-slate-400">
          SISTEMA ACTIVO
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">
        
        {/* Gestión de Inventario */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
            <Package className="text-slate-400" size={20} />
            <h2 className="font-black uppercase text-xs tracking-[0.2em] text-slate-500">Control de Stock y Precios</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={p.image} className="w-16 h-16 rounded-2xl object-cover bg-slate-50" alt="" />
                    {!p.inStock && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                        <X className="text-red-500" size={20} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase text-slate-800 leading-tight mb-2">{p.name}</h3>
                    <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400">$</span>
                      <input 
                        type="number" 
                        defaultValue={p.price} 
                        onBlur={(e) => updateProduct(p.id, 'price', parseInt(e.target.value))}
                        className="w-24 bg-transparent border-none p-0 focus:ring-0 text-sm font-black text-indigo-600"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => updateProduct(p.id, 'inStock', !p.inStock)}
                    className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-tighter transition-all active:scale-95 ${
                      p.inStock 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}
                  >
                    {p.inStock ? 'En Stock' : 'Agotado'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Historial de Ventas */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
            <ClipboardList className="text-slate-400" size={20} />
            <h2 className="font-black uppercase text-xs tracking-[0.2em] text-slate-500">Pedidos Recientes</h2>
          </div>
          
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400">
                <RefreshCcw className="mx-auto mb-3 opacity-20" size={40} />
                <p className="font-bold uppercase text-[10px] tracking-widest">Esperando primeras ventas...</p>
              </div>
            ) : orders.map(o => (
              <div key={o.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                {/* Badge de Total */}
                <div className="absolute top-0 right-0 p-6 bg-slate-900 text-[#d4af37] font-black text-lg rounded-bl-[2rem] shadow-xl">
                  ${o.total?.toLocaleString('es-AR')}
                </div>
                
                <div className="flex flex-col mb-6">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">
                    {o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleString() : 'Recién procesado'}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-black uppercase text-slate-600 tracking-widest">ORDEN #{o.id.slice(-6).toUpperCase()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Lista de Items */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">Productos</p>
                    {o.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-800">{it.qty}x {it.name}</span>
                        <span className="text-xs font-bold text-slate-300">${it.price?.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Datos de Envío */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">Logística</p>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <Truck size={18} className="text-[#d4af37]" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase">{o.delivery === 'envio' ? 'Envío a Domicilio' : 'Retiro en Local'}</p>
                        {o.delivery === 'envio' && (
                          <p className="text-[11px] font-medium text-slate-500 mt-1">
                            {o.address?.street}, {o.address?.zone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Estado Sutil */}
                <div className="mt-8 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-tighter">Recibido correctamente</span>
                  </div>
                  <button className="text-[10px] font-black text-slate-300 hover:text-rose-500 transition-colors uppercase">Archivar Pedido</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      
      {/* Estilos Globales para Inputs */}
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}