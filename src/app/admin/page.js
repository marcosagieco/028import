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
  updateDoc, 
  deleteDoc, 
  doc,
  setDoc,
  serverTimestamp 
} from "firebase/firestore";

// --- CONFIGURACIÓN DE TU MARCA ---
const CONFIG = {
  brandName: "028", 
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png",
};

// Mantenemos la lista base para la primera carga
const initialProducts = [
  { id: 1, name: "BAJA SPLASH", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png" },
  { id: 2, name: "BLUE RAZZ ICE", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/s2Tmw67w/BLUE-RAZZ-ICE.webp" },
  { id: 3, name: "CHERRY FUSE", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/yd5PzDfx/CHERRY-FUSE.png" },
  { id: 4, name: "CHERRY STRAZZ", price: 26000, category: "Elfbar Ice King", tag: "Destacado", image: "https://i.postimg.cc/7PFVsTG2/CHERRY-STRAZZ.jpg" },
  { id: 5, name: "DOUBLE APPLE ICE", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/QN9mJqtk/DOUBLE-APPLE-ICE.webp" },
  { id: 6, name: "DRAGON STRAWNANA", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/9X6p8qRB/DRAGON-STRAWNANA.png" },
  { id: 7, name: "GRAPE ICE", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/hPV0HPTw/GRAPE-ICE.webp" },
  { id: 8, name: "MANGO MAGIC", price: 26000, category: "Elfbar Ice King", tag: "Best Seller", image: "https://i.postimg.cc/tCFzLCFC/MANGO-MAGIC.png" },
  { id: 9, name: "PEACH", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/4xZ1Zk1f/PEACH.webp" },
  { id: 10, name: "SCARY BERRY", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/K8F5FS5D/SCARY-BERRY.png" },
  { id: 11, name: "SOUR LUSH GUMMY", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/P54Q536R/SOUR-LUSH-GUMMY.png" },
  { id: 12, name: "STRAWBERRY DRAGON FRUIT", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/QMdk9QwW/STRAWBERRY-DRAGON-FRUIT.png" },
  { id: 13, name: "STRAWBERRY ICE", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/7Lt1gCrC/STRAWBERRY-ICE.png" },
  { id: 14, name: "STRAWBERRY WATERMELON", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/MG30ycJD/STRAWBERRY-WATERMELON.webp" },
  { id: 15, name: "SUMMER SPLASH", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/LXqtvHmV/SUMMER-SPLASH.png" },
  { id: 16, name: "TIGERS BLOOD", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/3RyX9K3P/TIGERS-BLOOD.jpg" },
  { id: 17, name: "WATERMELON ICE", price: 26000, category: "Elfbar Ice King", tag: "Refrescante", image: "https://i.postimg.cc/63DdmD3s/WATERMELON-ICE.webp" },
  { id: 25, name: "SOUR APPLE ICE", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/X7QqQDGS/SOUR-APPLE-ICE.jpg" },
  { id: 26, name: "MIAMI MINT", price: 26000, category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/bJhqzQDS/MIAMI-MINT.jpg" },
  { id: 30, name: "BLUE RAZZ LEMON", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/Jh48hT4x/ignite-v400-BLUE-RAZZ-LEMON.jpg" },
  { id: 31, name: "CHERRY WATERMELON", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/nLRJ9vCd/ignite-v400-cherry-watermelon.jpg" },
  { id: 32, name: "GRAPE", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/0QzqYbSv/ignite-v400-GRAPE.jpg" },
  { id: 33, name: "MIAMI MINT", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/gJ1bNmyJ/ignite-v400-miami-mint.jpg" },
  { id: 34, name: "PASSION FRUIT", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/vT9FKkXt/Ignite-v400-PASSION-FRUIT.jpg" },
  { id: 35, name: "STRAWBERRY WATERMELON", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/FFJ41kmG/Ignite-v400-STRAWBERR-WATERMELON.jpg" },
  { id: 36, name: "STRAWBERRY KIWI", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/Hsw19GrJ/ignite-v400-STRAWBERRY-KIWI.jpg" },
  { id: 37, name: "STRAWBERRY", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/cLdyDD35/ignite-v400-strawberry.jpg" },
  { id: 38, name: "TUTTI FRUTI", price: 28000, category: "Ignite v400", tag: "", image: "https://i.postimg.cc/mgVxKQ3v/ignite-v400-TUTI-FRUTI.jpg" },
  { id: 39, name: "BLUE RAZZ ICE", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/yYk7mpF9/Lost-mary-20000-BLUE-RAZZ-ICE.jpg" },
  { id: 40, name: "GRAPE ICE", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/wTZg05VC/Lost-mary-20000-GRAPE-ICE.jpg" },
  { id: 41, name: "ICE MINT", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/wTZg05V5/lost-mary-20000-ICE-MINT.jpg" },
  { id: 42, name: "LIME GRAPE FRUIT", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/7LqcVbpW/Lost-mary-20000-LIME-GRAPE-FRUIT.jpg" },
  { id: 43, name: "MANGO MAGIC", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/8CwYnNGc/Lost-mary-20000-MANGO-TWIST.jpg" },
  { id: 44, name: "MEXICAN MANGO", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/bvL5FpPx/Lost-mary-20000-MEXICAN-MANGO.jpg" },
  { id: 45, name: "MIAMI MINT", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/yWqpSNmv/Lost-mary-20000-MIAMI-MINT.jpg" },
  { id: 46, name: "STRAWBERRY ICE", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/zDLJWPw3/Lost-mary-20000-STRAWBERRY-ICE.jpg" },
  { id: 47, name: "STRAWBERRY KIWI", price: 23000, category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/59Hxvk5q/Lost-mary-20000-STRAWBERRY-KIWI.jpg" },
  { id: 18, name: "BLOW THC", price: 55000, category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp" },
  { id: 19, name: "TORCH 7.5G", price: 53000, category: "Vapes THC", tag: "", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png" },
  { id: 29, name: "TORCH 4.5G", price: 52500, category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/vmFK42hC/TORCH-4-5G.jpg" },
  { id: 20, name: "PHENOM 6G", price: 56000, category: "Vapes THC", tag: "Destacado", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg" },
  { id: 27, name: "PLAYSTATION 5", price: 550, category: "PlayStation", tag: "USD", image: "https://i.postimg.cc/RFGS0Wzt/PLAY-5.jpg" },
  { id: 28, name: "AIRPODS PRO", price: 35000, category: "PRODUCTOS APPLE", tag: "Nuevo", image: "https://i.postimg.cc/X7gzDt0p/AIRPODS-PRO.jpg" },
  { id: 21, name: "CARGADOR 20W", price: 16500, category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg" },
  { id: 22, name: "CARGADOR 35W", price: 20500, category: "PRODUCTOS APPLE", tag: "Potente", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg" },
  { id: 23, name: "CABLE USB-C A USB-C", price: 13500, category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg" },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M", price: 13500, category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg" }
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('pendientes'); 
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false); 

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '', // Inicializamos vacío
    image: '',
    tag: ''
  });
  const [isAdding, setIsAdding] = useState(false);

  // Obtener categorías únicas dinámicamente
  const uniqueCategories = useMemo(() => {
    return [...new Set(products.map(p => p.category))].sort();
  }, [products]);

  useEffect(() => {
    document.title = `${CONFIG.brandName} - Admin`;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = CONFIG.logoImage;
  }, []);

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
      const app = !getApps().length ? initializeApp(config) : getApp();
      return { auth: getAuth(app), db: getFirestore(app) };
    } catch (err) {
      return { auth: null, db: null, err: err.message };
    }
  }, []);

  useEffect(() => {
    if (!firebaseRefs.auth || !firebaseRefs.db) return;

    signInAnonymously(firebaseRefs.auth).catch(console.error);

    const unsubscribeAuth = onAuthStateChanged(firebaseRefs.auth, (user) => {
      if (!user) return;

      const qOrders = query(collection(firebaseRefs.db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
        setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      const unsubscribeProducts = onSnapshot(collection(firebaseRefs.db, 'products'), (snapshot) => {
        if (!snapshot.empty) {
          const dbProducts = snapshot.docs.map(doc => ({ dbId: doc.id, ...doc.data() }));
          
          setProducts(prev => {
             const updatedInitial = initialProducts.map(p => {
                const match = dbProducts.find(dbP => dbP.id === p.id);
                if (match && match.isDeleted) return null;
                return match 
                  ? { ...p, inStock: match.inStock, price: match.price !== undefined ? match.price : p.price } 
                  : { ...p, inStock: true };
             }).filter(Boolean);
             
             const newFromDb = dbProducts.filter(dbP => 
                !initialProducts.find(p => p.id === dbP.id) && 
                !dbP.isDeleted
             );
             
             return [...updatedInitial, ...newFromDb];
          });
        }
      });

      return () => {
        unsubscribeOrders();
        unsubscribeProducts();
      };
    });

    return () => unsubscribeAuth();
  }, [firebaseRefs]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.category) return alert("Por favor escribe o selecciona una categoría.");

    setIsAdding(true);
    try {
      const newId = Date.now(); 
      await setDoc(doc(firebaseRefs.db, 'products', `prod_${newId}`), {
        id: newId,
        name: newProduct.name.toUpperCase(),
        price: Number(newProduct.price),
        category: newProduct.category, // Se guarda lo que escribas
        image: newProduct.image,
        tag: newProduct.tag,
        inStock: true,
        createdAt: serverTimestamp(),
        isDeleted: false
      });
      alert("¡Producto agregado con éxito!");
      setNewProduct({ name: '', price: '', category: '', image: '', tag: '' });
    } catch (error) {
      alert("Error al crear: " + error.message);
    }
    setIsAdding(false);
  };

  const handleDeleteProduct = async (product) => {
    if(!confirm(`¿Seguro que quieres eliminar "${product.name}"?`)) return;
    try {
        await setDoc(doc(firebaseRefs.db, 'products', `prod_${product.id}`), {
            id: product.id,
            isDeleted: true
        }, { merge: true });
    } catch (err) {
        alert("Error al eliminar: " + err.message);
    }
  };

  const toggleStock = async (product) => {
    try {
      const newStockStatus = product.inStock === false ? true : false;
      const productRef = doc(firebaseRefs.db, 'products', `prod_${product.id}`);
      await setDoc(productRef, {
        id: product.id,
        name: product.name,
        inStock: newStockStatus,
        price: product.price 
      }, { merge: true });
    } catch (err) { alert("Error de permisos o conexión."); }
  };

  const updatePrice = async (product, newPrice) => {
    const price = parseInt(newPrice);
    if(isNaN(price) || price < 0) return alert("Por favor ingresa un precio válido");
    try {
        const productRef = doc(firebaseRefs.db, 'products', `prod_${product.id}`);
        await setDoc(productRef, { id: product.id, price: price }, { merge: true });
    } catch(err) { alert("Error al actualizar precio."); }
  }

  const completeOrder = async (id) => {
    if (confirm("¿Confirmas que el pedido fue entregado?")) {
      try {
        await updateDoc(doc(firebaseRefs.db, 'orders', id), { status: 'completed' });
      } catch (err) { alert("Error al completar."); }
    }
  };

  const deleteOrder = async (id) => {
    if (confirm("¿Eliminar pedido permanentemente?")) {
      try { await deleteDoc(doc(firebaseRefs.db, 'orders', id)); } catch (err) { alert("Error al eliminar."); }
    }
  };

  const syncAllProducts = async () => {
    if (confirm("¿Sincronizar catálogo inicial?")) {
        setLoading(true);
        try {
            for (const p of initialProducts) {
                await setDoc(doc(firebaseRefs.db, 'products', `prod_${p.id}`), {
                    id: p.id,
                    name: p.name,
                    category: p.category, 
                    image: p.image 
                }, { merge: true });
            }
            alert("Catálogo sincronizado.");
        } catch (err) { alert("Error al sincronizar: " + err.message); }
        setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => activeTab === 'pendientes' ? o.status !== 'completed' : o.status === 'completed');

  const theme = {
    bg: darkMode ? 'bg-[#0a0a0a]' : 'bg-gray-50',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    card: darkMode ? 'bg-[#171717] border-[#262626]' : 'bg-white border-gray-100',
    cardHover: darkMode ? 'hover:border-[#d4af37]/40' : 'hover:border-[#d4af37]/20',
    subText: darkMode ? 'text-gray-400' : 'text-gray-400',
    nav: 'bg-[#121212]',
    input: darkMode ? 'bg-[#262626] border-[#404040] text-white' : 'bg-gray-50 border-gray-200 text-black',
    tabActive: 'border-[#d4af37]',
    tabActiveText: darkMode ? 'text-white' : 'text-black',
    tabInactive: 'border-transparent text-gray-500',
    stickyHeader: darkMode ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-gray-200'
  };

  const renderStockGroup = (categoryFilter) => {
    const group = products.filter(p => p.category === categoryFilter);
    if (group.length === 0) return null;

    return (
        <div className="mb-8" key={categoryFilter}>
            <h3 className={`text-xl font-bold mb-4 uppercase ${theme.subText} border-b ${darkMode ? 'border-[#262626]' : 'border-gray-200'} pb-2`}>{categoryFilter}</h3>
            <div className="grid gap-4">
                {group.map(p => (
                    <div key={p.id} className={`${theme.card} p-5 rounded-[1.5rem] flex justify-between items-center shadow-sm border ${theme.cardHover} transition-all`}>
                        <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12">
                                <img src={p.image} className={`w-full h-full rounded-xl object-cover ${p.inStock === false ? 'grayscale opacity-50' : ''}`} alt="" />
                                {p.inStock === false && <div className="absolute inset-0 flex items-center justify-center"><i className="fas fa-times text-red-500 text-xs"></i></div>}
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className={`font-black text-[11px] uppercase ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{p.name}</p>
                                <div className="flex items-center gap-2">
                                     <span className="text-gray-400 text-[10px]">$</span>
                                     <input type="number" key={p.price} defaultValue={p.price} className={`w-20 rounded px-2 py-1 text-[10px] font-bold focus:border-[#d4af37] outline-none transition-colors ${theme.input}`} onKeyDown={(e) => { if(e.key === 'Enter') { e.target.blur(); } }} onBlur={(e) => { if (parseInt(e.target.value) !== p.price) updatePrice(p, e.target.value); }} />
                                </div>
                                <span className={`w-fit text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${p.inStock === false ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                                    {p.inStock === false ? 'Agotado' : 'Disponible'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={() => toggleStock(p)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm ${p.inStock === false ? 'bg-green-600 text-white' : 'bg-red-900/20 text-red-500 border border-red-900/30'}`}>{p.inStock === false ? 'Habilitar' : 'Agotar'}</button>
                            <button onClick={() => handleDeleteProduct(p)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-200 hover:bg-red-500 hover:text-white transition-all text-gray-500"><i className="fas fa-trash text-xs"></i></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  if (loading) return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${darkMode ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
      <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Cargando...</p>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans pb-10 transition-colors duration-300 ${theme.bg} ${theme.text}`}>
      <nav className={`${theme.nav} py-5 px-6 text-white flex justify-between items-center shadow-2xl border-b border-[#d4af37]/30 sticky top-0 z-50`}>
        <div className="flex items-center gap-4">
          <img src={CONFIG.logoImage} alt="Logo" className="h-10 w-auto object-contain" />
          <h1 className="text-lg font-black tracking-tighter uppercase">{CONFIG.brandName}<span className="text-[#d4af37]">Control</span></h1>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-xs">{darkMode ? '☀️' : '🌙'}</button>
            <a href="/" className="text-[10px] text-gray-500 font-bold uppercase hover:text-white transition-all">Ver Web</a>
        </div>
      </nav>

      <div className={`${theme.stickyHeader} border-b sticky top-[72px] z-40 transition-colors duration-300`}>
        <div className="max-w-4xl mx-auto flex">
          <button onClick={() => setActiveTab('pendientes')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'pendientes' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Pedidos</button>
          <button onClick={() => setActiveTab('historial')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'historial' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Ventas</button>
          <button onClick={() => setActiveTab('stock')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'stock' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Stock</button>
          <button onClick={() => setActiveTab('crear')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'crear' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Crear +</button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        
        {activeTab === 'crear' && (
          <div className="animate-in fade-in duration-500 max-w-lg mx-auto">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 text-center">Nuevo Producto</h2>
            
            <form onSubmit={handleAddProduct} className={`${theme.card} p-8 rounded-[2rem] shadow-xl border ${darkMode ? 'border-[#262626]' : 'border-gray-100'} flex flex-col gap-5`}>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre del Producto</label>
                <input type="text" required placeholder="Ej: BLUE RAZZ ICE" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-2 focus:border-[#d4af37] transition-all ${theme.input}`} />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Precio</label>
                  <input type="number" required placeholder="26000" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-2 focus:border-[#d4af37] transition-all ${theme.input}`} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Categoría</label>
                  
                  {/* --- INPUT CON AUTOCOMPLETADO PARA CATEGORÍAS --- */}
                  <input 
                    list="category-suggestions" 
                    placeholder="Escribe o selecciona..." 
                    value={newProduct.category} 
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                    className={`w-full p-4 rounded-xl outline-none font-bold text-[11px] border-2 focus:border-[#d4af37] transition-all uppercase ${theme.input}`} 
                  />
                  <datalist id="category-suggestions">
                    {uniqueCategories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>

                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Link de Imagen (URL)</label>
                <input type="url" required placeholder="https://i.postimg.cc/..." value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-[10px] border-2 focus:border-[#d4af37] transition-all ${theme.input}`} />
                {newProduct.image && (
                  <div className="mt-4 relative h-32 rounded-xl overflow-hidden border border-dashed border-gray-500/30">
                     <img src={newProduct.image} alt="Vista previa" className="w-full h-full object-contain bg-gray-100/10" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Etiqueta (Opcional)</label>
                <input type="text" placeholder="Ej: Nuevo, Destacado..." value={newProduct.tag} onChange={e => setNewProduct({...newProduct, tag: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-2 focus:border-[#d4af37] transition-all ${theme.input}`} />
              </div>

              <button type="submit" disabled={isAdding} className="bg-[#d4af37] text-black font-black uppercase py-4 rounded-xl mt-4 hover:bg-white hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isAdding ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Gestión de Stock</h2>
                <button onClick={syncAllProducts} className="text-[9px] bg-black text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest shadow-lg hover:bg-[#d4af37] transition-all">Sincronizar DB</button>
             </div>
             {/* Renderizamos TODAS las categorías que existen automáticamente */}
             {uniqueCategories.map(cat => renderStockGroup(cat))}
          </div>
        )}

        {(activeTab === 'pendientes' || activeTab === 'historial') && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className={`text-3xl font-black uppercase tracking-tighter leading-none ${theme.text}`}>{activeTab === 'pendientes' ? 'Activos' : 'Historial'}</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">{activeTab === 'pendientes' ? 'Nuevos pedidos recibidos' : 'Registro de ventas cerradas'}</p>
              </div>
              <span className="bg-black text-[#d4af37] text-[10px] font-black px-4 py-2 rounded-full shadow-xl">{filteredOrders.length} {activeTab === 'pendientes' ? 'PENDIENTES' : 'TOTALES'}</span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className={`${theme.card} p-24 rounded-[3rem] border-2 border-dashed ${darkMode ? 'border-[#262626]' : 'border-gray-100'} text-center flex flex-col items-center`}>
                <i className="fas fa-receipt text-gray-400 text-5xl mb-6 opacity-30"></i>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest opacity-50">No se encontraron registros</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredOrders.map((order) => (
                  <div key={order.id} className={`${theme.card} rounded-[2rem] shadow-sm border p-6 md:p-8 hover:shadow-2xl transition-all duration-500 ${theme.cardHover}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-black text-[#d4af37] w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-xl">{order.items?.reduce((a, b) => a + b.qty, 0)}</div>
                        <div>
                          <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest block mb-0.5">ID: {order.id.slice(-6).toUpperCase()}</span>
                          <p className="text-gray-400 text-[10px] font-bold">{order.createdAt ? order.createdAt.toDate().toLocaleString('es-AR') : 'Procesando...'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                          {activeTab === 'pendientes' && (
                            <button onClick={() => completeOrder(order.id)} className={`${darkMode ? 'bg-[#262626] text-gray-400 hover:text-white' : 'bg-gray-50 text-gray-300 hover:text-white'} hover:bg-green-600 w-12 h-12 rounded-2xl transition-all flex items-center justify-center shadow-inner`}><i className="fas fa-check text-lg"></i></button>
                          )}
                          <button onClick={() => deleteOrder(order.id)} className={`${darkMode ? 'bg-[#262626] text-gray-400 hover:text-white' : 'bg-gray-50 text-gray-300 hover:text-white'} hover:bg-red-600 w-12 h-12 rounded-2xl transition-all flex items-center justify-center shadow-inner`}><i className="fas fa-trash text-lg"></i></button>
                      </div>
                    </div>
                    <div className={`space-y-3 mb-6 p-6 rounded-2xl border shadow-inner ${darkMode ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-gray-50/50 border-gray-100'}`}>
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className={`font-bold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}><span className={`${darkMode ? 'text-white' : 'text-black'} font-black mr-2`}>{item.qty}x</span> {item.name}</span>
                          <span className="text-gray-400 font-black">${item.price?.toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>
                    {order.delivery === 'envio' && order.address && (
                      <div className="mb-6 p-5 bg-[#121212] text-white rounded-2xl text-[11px] font-bold border-l-8 border-[#d4af37] shadow-xl">
                        <p className="text-[#d4af37] text-[8px] font-black uppercase mb-1 tracking-widest">Envío a Domicilio</p>
                        <p className="uppercase">{order.address}</p>
                        <p className="opacity-40 text-[9px] mt-1 uppercase font-black tracking-widest">{order.zone}</p>
                      </div>
                    )}
                    <div className={`flex justify-between items-end border-t pt-6 ${darkMode ? 'border-[#262626]' : 'border-gray-50'}`}>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                      <div className={`text-3xl font-black tracking-tighter leading-none ${darkMode ? 'text-white' : 'text-black'}`}><span className="text-[#d4af37] text-sm mr-1.5 font-black">$</span>{order.total?.toLocaleString('es-AR')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
}