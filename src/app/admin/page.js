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

// LISTA BASE COMPLETA
const initialProducts = [
  { id: 1, name: "BAJA SPLASH", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png", description: "Vapeador desechable premium con una mezcla tropical y refrescante. Batería de larga duración y la garantía de autenticidad de 028 IMPORT." },
  { id: 2, name: "BLUE RAZZ ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/s2Tmw67w/BLUE-RAZZ-ICE.webp", description: "El clásico e intenso sabor a frambuesa azul combinado con un golpe helado perfecto. Rendimiento superior en cada calada." },
  { id: 3, name: "CHERRY FUSE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/yd5PzDfx/CHERRY-FUSE.png", description: "Fusión explosiva de cerezas dulces y jugosas. Diseño ergonómico, flujo de aire suave y calidad garantizada en caja sellada." },
  { id: 4, name: "CHERRY STRAZZ", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "Destacado", image: "https://i.postimg.cc/7PFVsTG2/CHERRY-STRAZZ.jpg", description: "Una deliciosa combinación de cereza y fresa con sutiles notas cítricas. Ideal para quienes buscan un perfil dulce y balanceado." },
  { id: 5, name: "DOUBLE APPLE ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/QN9mJqtk/DOUBLE-APPLE-ICE.webp", description: "Intenso sabor a doble manzana, dulce y ácida, coronado con un final súper refrescante. La experiencia definitiva para tu paladar." },
  { id: 6, name: "DRAGON STRAWNANA", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/9X6p8qRB/DRAGON-STRAWNANA.png", description: "Exótico mix de pitahaya (dragon fruit), fresa y plátano. Un viaje de sabores suaves y tropicales con la mejor tecnología de vaporización." },
  { id: 7, name: "GRAPE ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/hPV0HPTw/GRAPE-ICE.webp", description: "Auténtico sabor a uva dulce acompañado de una frescura helada inigualable. Golpe de garganta satisfactorio y prolongado." },
  { id: 8, name: "MANGO MAGIC", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "Best Seller", image: "https://i.postimg.cc/tCFzLCFC/MANGO-MAGIC.png", description: "La magia del mango maduro y jugoso capturada en un dispositivo premium. Sabor tropical intenso que no cansa." },
  { id: 9, name: "PEACH", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/4xZ1Zk1f/PEACH.webp", description: "Puro sabor a durazno aterciopelado y dulce. Un clásico perfectamente logrado con el rendimiento excepcional de Elfbar." },
  { id: 10, name: "SCARY BERRY", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/K8F5FS5D/SCARY-BERRY.png", description: "Misteriosa y atrapante mezcla de bayas silvestres oscuras. Perfil dulce con notas sutilmente ácidas de máxima calidad." },
  { id: 11, name: "SOUR LUSH GUMMY", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/P54Q536R/SOUR-LUSH-GUMMY.png", description: "El divertido sabor de las gomitas dulces con un toque ácido irresistible. Rendimiento impecable hasta la última gota." },
  { id: 12, name: "STRAWBERRY DRAGON FRUIT", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/QMdk9QwW/STRAWBERRY-DRAGON-FRUIT.png", description: "Combinación vibrante de fresas maduras y exótica fruta del dragón. Vapor denso, sabor constante y fiabilidad extrema." },
  { id: 13, name: "STRAWBERRY ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/7Lt1gCrC/STRAWBERRY-ICE.png", description: "Fresas recién recolectadas bañadas en una brisa helada. Un vapeo limpio, refrescante y sumamente agradable." },
  { id: 14, name: "STRAWBERRY WATERMELON", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/MG30ycJD/STRAWBERRY-WATERMELON.webp", description: "La clásica e infalible mezcla de fresa y sandía. Sabor dulce, afrutado y suave, respaldado por la garantía de 028 IMPORT." },
  { id: 15, name: "SUMMER SPLASH", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/LXqtvHmV/SUMMER-SPLASH.png", description: "Un cóctel frutal que captura la esencia del verano en cada calada. Dispositivo elegante con tecnología de malla avanzada." },
  { id: 16, name: "TIGERS BLOOD", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/3RyX9K3P/TIGERS-BLOOD.jpg", description: "Famosa mezcla de sandía y fresa con un exótico y suave toque de coco. Un perfil de sabor complejo y altamente demandado." },
  { id: 17, name: "WATERMELON ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "Refrescante", image: "https://i.postimg.cc/63DdmD3s/WATERMELON-ICE.webp", description: "Todo el jugo y la dulzura de la sandía con un impacto extra helado. Máximo poder refrescante en un formato premium." },
  { id: 25, name: "SOUR APPLE ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/X7QqQDGS/SOUR-APPLE-ICE.jpg", description: "Manzana verde crujiente y ácida envuelta en una ráfaga de frío. Ideal para cortar con la rutina mediante sabores vibrantes." },
  { id: 26, name: "MIAMI MINT", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/bJhqzQDS/MIAMI-MINT.jpg", description: "Menta sofisticada estilo Miami: fresca, dulce pero con presencia. Limpia el paladar y brinda un golpe de garganta excepcional." },
  { id: 30, name: "BLUE RAZZ LEMON", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/Jh48hT4x/ignite-v400-BLUE-RAZZ-LEMON.jpg", description: "Dispositivo ultracompacto y premium de Ignite. Intensa frambuesa azul equilibrada con notas cítricas de limón." },
  { id: 31, name: "CHERRY WATERMELON", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/nLRJ9vCd/ignite-v400-cherry-watermelon.jpg", description: "Diseño elegante característico de Ignite con un mix insuperable de cereza y sandía. Portabilidad extrema y sabor consistente." },
  { id: 32, name: "GRAPE", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/0QzqYbSv/ignite-v400-GRAPE.jpg", description: "Sabor a uva puro y directo. Ignite v400 te garantiza la mejor tecnología en un vaporizador minimalista de alta gama." },
  { id: 33, name: "MIAMI MINT", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/gJ1bNmyJ/ignite-v400-miami-mint.jpg", description: "Menta premium y refrescante en el formato más cómodo del mercado. Componentes de máxima pureza y fiabilidad total." },
  { id: 34, name: "PASSION FRUIT", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/vT9FKkXt/Ignite-v400-PASSION-FRUIT.jpg", description: "El toque ácido y exótico del maracuyá en cada calada. Calidad Ignite asegurada por el servicio logístico de 028 IMPORT." },
  { id: 35, name: "STRAWBERRY WATERMELON", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/FFJ41kmG/Ignite-v400-STRAWBERR-WATERMELON.jpg", description: "Dulce, frutal y perfectamente balanceado. Fresa y sandía en un dispositivo discreto que nunca compromete la potencia." },
  { id: 36, name: "STRAWBERRY KIWI", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/Hsw19GrJ/ignite-v400-STRAWBERRY-KIWI.jpg", description: "Fresa dulce combinada con el toque tropical del kiwi. Ignite te ofrece elegancia, rendimiento y una experiencia sin fallas." },
  { id: 37, name: "STRAWBERRY", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/cLdyDD35/ignite-v400-strawberry.jpg", description: "Auténtico sabor a fresa de principio a fin. Fabricado bajo los estrictos controles de calidad de la marca Ignite." },
  { id: 38, name: "TUTTI FRUTI", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/mgVxKQ3v/ignite-v400-TUTI-FRUTI.jpg", description: "Explosión de golosinas frutales en un vaporizador compacto. Diseñado para un consumo discreto, rápido y lleno de sabor." },
  { id: 39, name: "BLUE RAZZ ICE", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/yYk7mpF9/Lost-mary-20000-BLUE-RAZZ-ICE.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 40, name: "GRAPE ICE", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/wTZg05VC/Lost-mary-20000-GRAPE-ICE.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 41, name: "ICE MINT", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/wTZg05V5/lost-mary-20000-ICE-MINT.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 42, name: "LIME GRAPE FRUIT", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/7LqcVbpW/Lost-mary-20000-LIME-GRAPE-FRUIT.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 43, name: "MANGO MAGIC", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/8CwYnNGc/Lost-mary-20000-MANGO-TWIST.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 44, name: "MEXICAN MANGO", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/bvL5FpPx/Lost-mary-20000-MEXICAN-MANGO.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 45, name: "MIAMI MINT", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/yWqpSNmv/Lost-mary-20000-MIAMI-MINT.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 46, name: "STRAWBERRY ICE", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/zDLJWPw3/Lost-mary-20000-STRAWBERRY-ICE.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 47, name: "STRAWBERRY KIWI", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/59Hxvk5q/Lost-mary-20000-STRAWBERRY-KIWI.jpg", description: "El dispositivo Lost Mary con 20000 caladas de duración." },
  { id: 18, name: "BLOW THC", price: 55000, department: "THC", category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp", description: "Dispositivo de alta pureza con extracciones premium. Diseño discreto, golpe suave y un efecto prolongado garantizado." },
  { id: 19, name: "TORCH 7.5G", price: 53000, department: "THC", category: "Vapes THC", tag: "", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png", description: "Capacidad extrema de 7.5G de extracto premium. Pantalla digital, función de precalentamiento y la mejor potencia del mercado." },
  { id: 29, name: "TORCH 4.5G", price: 52500, department: "THC", category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/vmFK42hC/TORCH-4-5G.jpg", description: "4.5G de puro rendimiento. Diseño ergonómico, tecnología avanzada anti-obstrucciones y un efecto potente e inmediato." },
  { id: 20, name: "PHENOM 6G", price: 56000, department: "THC", category: "Vapes THC", tag: "Destacado", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg", description: "Dispositivo de grado premium cargado con 6G. Extracción de máxima pureza para una experiencia intensa y de altísimo nivel." },
  { id: 27, name: "PLAYSTATION 5", price: 550, department: "TECNOLOGÍA", category: "PlayStation", tag: "USD", image: "https://i.postimg.cc/RFGS0Wzt/PLAY-5.jpg", description: "PlayStation 5 original en caja sellada. Máximo rendimiento gaming de nueva generación. Calidad garantizada con la logística y atención exclusiva de 028 IMPORT." },
  { id: 28, name: "AIRPODS PRO", price: 35000, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "Nuevo", image: "https://i.postimg.cc/X7gzDt0p/AIRPODS-PRO.jpg", description: "Auriculares inalámbricos 100% originales con cancelación activa de ruido y audio espacial. Máxima fidelidad de sonido y ecología Apple." },
  { id: 21, name: "CARGADOR 20W", price: 16500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg", description: "Adaptador de corriente USB-C de 20W original Apple. Carga rápida, segura y eficiente en caja sellada de fábrica." },
  { id: 22, name: "CARGADOR 35W", price: 20500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "Potente", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg", description: "Adaptador de corriente dual USB-C de 35W original Apple. Potencia de sobra para cargar múltiples dispositivos al mismo tiempo." },
  { id: 23, name: "CABLE USB-C A USB-C", price: 13500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg", description: "Cable original Apple de USB-C a USB-C. Sincronización impecable y soporte de alta potencia. Material resistente y duradero." },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M", price: 13500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg", description: "Cable original Apple USB-C a Lightning de 2 metros de longitud. Extrema comodidad y compatibilidad garantizada para carga rápida." },
  { id: 50, name: "LABUBU V2", price: 17500, department: "LIFESTYLE", category: "Labubu", tag: "Viral", image: "https://i.postimg.cc/654362/labubu.png", description: "Muñeco coleccionable original. Consultar modelos por privado." },
  { id: 51, name: "TERMO STANLEY 1.2L", price: 85000, department: "LIFESTYLE", category: "Stanley", tag: "Original", image: "https://i.postimg.cc/placeholder/stanley.png", description: "Termo original con garantía de por vida. Consultar colores disponibles." },
  { id: 52, name: "MIEL ENERGY MASCULINA", price: 15000, department: "BIENESTAR", category: "Mieles", tag: "Hot", image: "https://i.postimg.cc/placeholder/miel_h.png", description: "Miel para rendimiento sexual masculino. 100% natural y de efecto comprobado." },
  { id: 53, name: "MIEL ENERGY FEMENINA", price: 15000, department: "BIENESTAR", category: "Mieles", tag: "Hot", image: "https://i.postimg.cc/placeholder/miel_m.png", description: "Miel para rendimiento sexual femenino. Efecto inmediato." }
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('pendientes'); 
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState(initialProducts);
  
  const [promos, setPromos] = useState([]);
  const [newPromo, setNewPromo] = useState({ category: '', minQty: 2, totalPrice: '' });

  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false); 

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', department: 'VAPES', category: '', image: '', tag: '', description: ''
  });
  const [isAdding, setIsAdding] = useState(false);

  const uniqueCategories = useMemo(() => {
    return [...new Set(products.map(p => p.category))];
  }, [products]);

  // Departamentos Predeterminados
  const PREDEFINED_DEPARTMENTS = ["VAPES", "THC", "TECNOLOGÍA", "LIFESTYLE", "BIENESTAR"];

  const clientsList = useMemo(() => {
    const clientsMap = new Map();
    orders.forEach(o => {
      if (o.clientPhone && o.clientName) {
        if (!clientsMap.has(o.clientPhone)) {
          clientsMap.set(o.clientPhone, {
            name: o.clientName,
            phone: o.clientPhone,
            orderCount: 1,
            lastOrder: o.createdAt
          });
        } else {
          const existing = clientsMap.get(o.clientPhone);
          existing.orderCount += 1;
          if (o.createdAt > existing.lastOrder) existing.lastOrder = o.createdAt;
        }
      }
    });
    return Array.from(clientsMap.values()).sort((a, b) => b.lastOrder - a.lastOrder);
  }, [orders]);

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
                return match 
                  ? { ...p, ...match, inStock: match.inStock, price: match.price !== undefined ? match.price : p.price, order: match.order !== undefined ? match.order : 99, description: match.description !== undefined ? match.description : p.description, isHidden: match.isHidden || match.isDeleted, department: match.department !== undefined ? match.department : p.department } 
                  : { ...p, inStock: true, order: 99, isHidden: false };
             }).filter(Boolean);
             
             const newFromDb = dbProducts.filter(dbP => 
                !initialProducts.find(p => p.id === dbP.id)
             ).map(dbP => ({...dbP, isHidden: dbP.isHidden || dbP.isDeleted})); 
             
             return [...updatedInitial, ...newFromDb].sort((a, b) => (a.order || 99) - (b.order || 99));
          });
        }
      });

      const unsubscribePromos = onSnapshot(collection(firebaseRefs.db, 'promos'), (snapshot) => {
        if (!snapshot.empty) {
            setPromos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
            setPromos([]);
        }
      });

      return () => {
        unsubscribeOrders();
        unsubscribeProducts();
        unsubscribePromos();
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
        department: newProduct.department.toUpperCase(),
        category: newProduct.category,
        image: newProduct.image,
        tag: newProduct.tag,
        description: newProduct.description,
        inStock: true,
        order: 99,
        createdAt: serverTimestamp(),
        isHidden: false, 
        isDeleted: false
      });
      alert("¡Producto agregado con éxito!");
      setNewProduct({ name: '', price: '', department: 'VAPES', category: '', image: '', tag: '', description: '' });
    } catch (error) {
      alert("Error al crear: " + error.message);
    }
    setIsAdding(false);
  };

  const handleAddPromo = async (e) => {
    e.preventDefault();
    if(!newPromo.category || !newPromo.minQty || !newPromo.totalPrice) return alert("Completa todos los campos");
    
    try {
      const promoId = newPromo.category.toLowerCase().replace(/\s+/g, '-');
      await setDoc(doc(firebaseRefs.db, 'promos', promoId), {
        category: newPromo.category,
        minQty: Number(newPromo.minQty),
        totalPrice: Number(newPromo.totalPrice),
        createdAt: serverTimestamp()
      });
      alert("¡Promoción guardada y activada con éxito!");
      setNewPromo({ category: '', minQty: 2, totalPrice: '' });
    } catch(err) {
      alert("Error al guardar promo: " + err.message);
    }
  };

  const handleDeletePromo = async (id) => {
    if(confirm("¿Seguro que quieres eliminar esta promoción? Los precios volverán a la normalidad.")) {
       try { await deleteDoc(doc(firebaseRefs.db, 'promos', id)); }
       catch(err) { alert("Error al eliminar promo: " + err.message); }
    }
  };

  const toggleVisibility = async (product) => {
    try {
        const newHiddenStatus = !(product.isHidden);
        const productRef = doc(firebaseRefs.db, 'products', `prod_${product.id}`);
        await setDoc(productRef, {
            id: product.id,
            isHidden: newHiddenStatus,
            isDeleted: false
        }, { merge: true });
    } catch (err) { alert("Error al cambiar la visibilidad."); }
  };

  const handleDeleteProduct = async (product) => {
    if(!confirm(`¿Seguro que quieres ELIMINAR DEFINITIVAMENTE "${product.name}" de la base de datos? Si solo quieres que los clientes no lo vean, usa el botón del Ojo para Pausarlo.`)) return;
    try {
        await deleteDoc(doc(firebaseRefs.db, 'products', `prod_${product.id}`));
    } catch (err) {
        alert("Error al eliminar: " + err.message);
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if(!confirm(`⚠️ ATENCIÓN: ¿Estás seguro de que querés ELIMINAR la categoría "${categoryName}" por completo?\n\nEsto borrará DEFINITIVAMENTE todos los productos que pertenezcan a esta categoría de la base de datos. Esta acción NO se puede deshacer.`)) return;

    try {
      const productsToDelete = products.filter(p => p.category === categoryName);
      for (const p of productsToDelete) {
         await deleteDoc(doc(firebaseRefs.db, 'products', `prod_${p.id}`));
      }
      try {
         await deleteDoc(doc(firebaseRefs.db, 'promos', categoryName.toLowerCase().replace(/\s+/g, '-')));
      } catch (e) {} 
      alert(`Categoría "${categoryName}" eliminada correctamente.`);
    } catch (err) {
      alert("Error al eliminar la categoría: " + err.message);
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

  const updateName = async (product, newName) => {
    const name = newName.trim().toUpperCase();
    if(!name) return alert("El nombre no puede estar vacío");
    try {
        const productRef = doc(firebaseRefs.db, 'products', `prod_${product.id}`);
        await setDoc(productRef, { id: product.id, name: name }, { merge: true });
    } catch(err) { alert("Error al actualizar nombre."); }
  }

  const updateOrder = async (product, newOrder) => {
    const orderNum = parseInt(newOrder);
    if(isNaN(orderNum)) return;
    try {
        const productRef = doc(firebaseRefs.db, 'products', `prod_${product.id}`);
        await setDoc(productRef, { id: product.id, order: orderNum }, { merge: true });
    } catch(err) { alert("Error al actualizar posición."); }
  }

  const updateDescription = async (product, newDesc) => {
    const desc = newDesc.trim();
    try {
        const productRef = doc(firebaseRefs.db, 'products', `prod_${product.id}`);
        await setDoc(productRef, { id: product.id, description: desc }, { merge: true });
    } catch(err) { alert("Error al actualizar descripción."); }
  }

  // --- NUEVA FUNCIÓN: ACTUALIZAR DEPARTAMENTO DESDE EL STOCK ---
  const updateDepartment = async (product, newDept) => {
    if(!newDept) return;
    try {
        const productRef = doc(firebaseRefs.db, 'products', `prod_${product.id}`);
        await setDoc(productRef, { id: product.id, department: newDept }, { merge: true });
    } catch(err) { alert("Error al actualizar departamento."); }
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
    if (confirm("¿Sincronizar y actualizar catálogo a la nueva estructura de Departamentos?")) {
        setLoading(true);
        try {
            for (const p of initialProducts) {
                await setDoc(doc(firebaseRefs.db, 'products', `prod_${p.id}`), {
                    id: p.id,
                    name: p.name,
                    department: p.department || "OTROS",
                    category: p.category, 
                    image: p.image,
                    description: p.description || "",
                    order: 99,
                    isHidden: false
                }, { merge: true });
            }
            alert("Catálogo sincronizado perfectamente.");
        } catch (err) { alert("Error al sincronizar: " + err.message); }
        setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => o.status !== 'completed');

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
            <div className={`flex justify-between items-center border-b pb-2 mb-4 ${darkMode ? 'border-[#262626]' : 'border-gray-200'}`}>
               <h3 className={`text-xl font-bold uppercase ${theme.subText}`}>{categoryFilter}</h3>
               <button onClick={() => handleDeleteCategory(categoryFilter)} className="text-red-500 hover:text-red-700 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase">
                  <i className="fas fa-trash"></i> Borrar Categoría
               </button>
            </div>
            
            <div className="grid gap-4">
                {group.map(p => (
                    <div key={p.id} className={`${theme.card} p-5 rounded-[1.5rem] flex justify-between items-start shadow-sm border ${theme.cardHover} transition-all ${p.isHidden ? 'opacity-60 bg-gray-50/50' : ''}`}>
                        <div className="flex items-start gap-4 w-3/4">
                            <div className="relative w-12 h-12 flex-shrink-0 mt-1">
                                <img src={p.image} className={`w-full h-full rounded-xl object-cover ${(p.inStock === false || p.isHidden) ? 'grayscale opacity-50' : ''}`} alt="" />
                                {p.inStock === false && !p.isHidden && <div className="absolute inset-0 flex items-center justify-center"><i className="fas fa-times text-red-500 text-xs"></i></div>}
                                {p.isHidden && <div className="absolute inset-0 flex items-center justify-center"><i className="fas fa-eye-slash text-amber-500 text-xs"></i></div>}
                            </div>
                            <div className="flex flex-col gap-1 w-full">
                                <input 
                                    type="text" 
                                    defaultValue={p.name} 
                                    className={`font-black text-[11px] uppercase w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#d4af37] outline-none transition-colors pb-0.5 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`} 
                                    onKeyDown={(e) => { if(e.key === 'Enter') { e.target.blur(); } }} 
                                    onBlur={(e) => { 
                                        if (e.target.value.toUpperCase() !== p.name.toUpperCase()) {
                                            updateName(p, e.target.value); 
                                        }
                                    }} 
                                    title="Haz clic para editar el nombre"
                                />
                                <div className="flex items-center gap-2">
                                     <span className="text-gray-400 text-[10px]">$</span>
                                     <input type="number" key={`price-${p.price}`} defaultValue={p.price} className={`w-20 rounded px-2 py-1 text-[10px] font-bold focus:border-[#d4af37] outline-none transition-colors ${theme.input}`} onKeyDown={(e) => { if(e.key === 'Enter') { e.target.blur(); } }} onBlur={(e) => { if (parseInt(e.target.value) !== p.price) updatePrice(p, e.target.value); }} />
                                     
                                     <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-200 dark:border-[#404040]">
                                        <span className="text-gray-400 text-[10px]">Pos:</span>
                                        <input 
                                            type="number" 
                                            key={`order-${p.order}`} 
                                            defaultValue={p.order || 99} 
                                            className={`w-12 rounded px-1 py-1 text-[10px] font-bold text-center focus:border-[#d4af37] outline-none transition-colors ${theme.input}`} 
                                            onKeyDown={(e) => { if(e.key === 'Enter') { e.target.blur(); } }} 
                                            onBlur={(e) => { updateOrder(p, e.target.value); }} 
                                            title="Posición/Orden"
                                        />
                                     </div>
                                </div>
                                <div className="flex gap-2 mt-2 items-center">
                                  <span className={`w-fit text-[8px] font-black uppercase px-2 py-1 rounded-full ${p.isHidden ? 'bg-amber-900/30 text-amber-500' : (p.inStock === false ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400')}`}>
                                      {p.isHidden ? 'Oculto' : (p.inStock === false ? 'Agotado' : 'Disponible')}
                                  </span>
                                  
                                  {/* --- ACÁ ESTÁ EL SELECT NUEVO PARA CAMBIAR DEPARTAMENTO EN VIVO --- */}
                                  <select
                                      defaultValue={p.department || ""}
                                      onChange={(e) => updateDepartment(p, e.target.value)}
                                      className={`w-fit text-[8px] font-black uppercase px-2 py-1 rounded-full border cursor-pointer outline-none focus:border-[#d4af37] ${darkMode ? 'bg-[#262626] border-[#404040] text-gray-300' : 'bg-white border-gray-300 text-gray-600'}`}
                                      title="Cambiar Departamento"
                                  >
                                      <option value="" disabled>SIN DEPTO</option>
                                      {PREDEFINED_DEPARTMENTS.map(d => (
                                          <option key={d} value={d}>{d}</option>
                                      ))}
                                  </select>
                                </div>

                                <textarea
                                    defaultValue={p.description || ""}
                                    placeholder="Escribe la biografía o descripción del producto aquí..."
                                    className={`w-full mt-2 text-[10px] p-2 rounded-lg outline-none transition-colors border focus:border-[#d4af37] resize-none ${darkMode ? 'bg-[#262626] border-[#404040] text-gray-300 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-600 placeholder-gray-400'}`}
                                    rows="2"
                                    onBlur={(e) => {
                                        if (e.target.value !== (p.description || "")) {
                                            updateDescription(p, e.target.value);
                                        }
                                    }}
                                    title="Haz clic para editar la biografía"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col lg:flex-row items-center gap-2 flex-shrink-0 mt-1">
                             <button onClick={() => toggleStock(p)} className={`w-full lg:w-auto px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm ${p.inStock === false ? 'bg-green-600 text-white' : 'bg-red-900/20 text-red-500 border border-red-900/30'}`}>{p.inStock === false ? 'Habilitar' : 'Agotar'}</button>
                             <button onClick={() => toggleVisibility(p)} title={p.isHidden ? 'Mostrar en tienda' : 'Ocultar de la tienda'} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${p.isHidden ? 'bg-amber-100 text-amber-600 hover:bg-amber-500 hover:text-white' : 'bg-gray-200 text-gray-500 hover:bg-amber-500 hover:text-white'}`}>
                                 <i className={`fas ${p.isHidden ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                             </button>
                             <button onClick={() => handleDeleteProduct(p)} title="Eliminar definitivamente" className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-200 hover:bg-red-500 hover:text-white transition-all text-gray-500 shadow-sm"><i className="fas fa-trash text-xs"></i></button>
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
        <div className="max-w-4xl mx-auto flex overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('pendientes')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'pendientes' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Pedidos</button>
          <button onClick={() => setActiveTab('stock')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'stock' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Stock</button>
          <button onClick={() => setActiveTab('crear')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'crear' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Crear +</button>
          <button onClick={() => setActiveTab('clientes')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'clientes' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Clientes</button>
          <button onClick={() => setActiveTab('promos')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'promos' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Promos %</button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        
        {activeTab === 'promos' && (
          <div className="animate-in fade-in duration-500 max-w-lg mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className={`text-3xl font-black uppercase tracking-tighter leading-none ${theme.text}`}>Promociones</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">Descuentos automáticos por cantidad</p>
              </div>
            </div>

            <form onSubmit={handleAddPromo} className={`${theme.card} p-8 rounded-[2rem] shadow-xl border ${darkMode ? 'border-[#262626]' : 'border-gray-100'} flex flex-col gap-5 mb-8`}>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Categoría a bonificar</label>
                <input 
                  list="promo-category-suggestions" 
                  placeholder="Escribe o selecciona (Ej: Ignite v400)..." 
                  value={newPromo.category} 
                  onChange={e => setNewPromo({...newPromo, category: e.target.value})} 
                  className={`w-full p-4 rounded-xl outline-none font-bold text-[11px] border-2 focus:border-[#d4af37] transition-all uppercase ${theme.input}`} 
                  required
                />
                <datalist id="promo-category-suggestions">
                  {uniqueCategories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Cantidad Mínima</label>
                  <input type="number" required min="2" placeholder="Ej: 2" value={newPromo.minQty} onChange={e => setNewPromo({...newPromo, minQty: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-2 focus:border-[#d4af37] transition-all ${theme.input}`} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Precio Total</label>
                  <input type="number" required placeholder="Ej: 49000" value={newPromo.totalPrice} onChange={e => setNewPromo({...newPromo, totalPrice: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-2 focus:border-[#d4af37] transition-all ${theme.input}`} />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 italic">Ejemplo: Si pones Cantidad "2" y Precio Total "49000", cuando el cliente lleve 2 o más unidades de esa categoría, cada una le quedará a $24.500 automáticamente.</p>

              <button type="submit" className="bg-[#d4af37] text-black font-black uppercase py-4 rounded-xl mt-2 hover:bg-white hover:shadow-xl transition-all">
                Crear / Actualizar Promoción
              </button>
            </form>

            <div className="grid gap-4">
              {promos.length === 0 ? (
                 <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No hay promos activas</p>
              ) : (
                promos.map(promo => (
                  <div key={promo.id} className={`${theme.card} p-5 rounded-[1.5rem] flex justify-between items-center shadow-sm border`}>
                    <div>
                      <h4 className="font-black uppercase text-sm mb-1">{promo.category}</h4>
                      <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">Llevando {promo.minQty} o más: ${(promo.totalPrice / promo.minQty).toLocaleString('es-AR')} c/u</p>
                    </div>
                    <button onClick={() => handleDeletePromo(promo.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-200 hover:bg-red-500 hover:text-white transition-all text-gray-500 shadow-sm">
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

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
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Categoría / Marca</label>
                  <input 
                    list="category-suggestions" 
                    placeholder="Ej: Ignite v400" 
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
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Departamento Principal</label>
                <select 
                    value={newProduct.department} 
                    onChange={e => setNewProduct({...newProduct, department: e.target.value})} 
                    className={`w-full p-4 rounded-xl outline-none font-bold text-[11px] border-2 focus:border-[#d4af37] transition-all uppercase ${theme.input}`}
                >
                    {PREDEFINED_DEPARTMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
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

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Descripción (Biografía)</label>
                <textarea 
                   rows="2" 
                   placeholder="Ej: Disfruta de un sabor increíble con este nuevo vape..." 
                   value={newProduct.description} 
                   onChange={e => setNewProduct({...newProduct, description: e.target.value})} 
                   className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-2 focus:border-[#d4af37] transition-all resize-none ${theme.input}`}
                ></textarea>
              </div>

              <button type="submit" disabled={isAdding} className="bg-[#d4af37] text-black font-black uppercase py-4 rounded-xl mt-2 hover:bg-white hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
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
             {uniqueCategories.map(cat => renderStockGroup(cat))}
          </div>
        )}

        {activeTab === 'clientes' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className={`text-3xl font-black uppercase tracking-tighter leading-none ${theme.text}`}>Tu Base</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">Directorio de Clientes CRM</p>
              </div>
              <span className="bg-[#d4af37] text-black text-[10px] font-black px-4 py-2 rounded-full shadow-xl">{clientsList.length} Registros</span>
            </div>

            {clientsList.length === 0 ? (
               <div className={`${theme.card} p-24 rounded-[3rem] border-2 border-dashed ${darkMode ? 'border-[#262626]' : 'border-gray-100'} text-center flex flex-col items-center`}>
                <i className="fas fa-users text-gray-400 text-5xl mb-6 opacity-30"></i>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest opacity-50">Aún no hay clientes registrados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {clientsList.map((client, index) => (
                    <div key={index} className={`${theme.card} p-6 rounded-[1.5rem] shadow-sm border flex flex-col gap-4 hover:border-[#d4af37]/30 transition-all`}>
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-black text-[#d4af37] flex items-center justify-center text-xl font-black shadow-md uppercase">
                             {client.name.charAt(0)}
                          </div>
                          <div>
                             <h4 className="font-black tracking-tight text-lg uppercase leading-none mb-1">{client.name}</h4>
                             <p className="text-gray-400 font-bold text-xs"><i className="fas fa-phone text-[10px] mr-1"></i> {client.phone}</p>
                          </div>
                       </div>
                       <div className="flex justify-between items-center mt-2 border-t pt-4 dark:border-[#262626]">
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{client.orderCount} Pedido{client.orderCount > 1 ? 's' : ''}</span>
                          <a href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="bg-[#25D366] text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest flex items-center gap-2 hover:opacity-80 transition-all shadow-md">
                             <i className="fab fa-whatsapp text-sm"></i> Escribir
                          </a>
                       </div>
                    </div>
                 ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pendientes' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className={`text-3xl font-black uppercase tracking-tighter leading-none ${theme.text}`}>Activos</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">Nuevos pedidos recibidos</p>
              </div>
              <span className="bg-black text-[#d4af37] text-[10px] font-black px-4 py-2 rounded-full shadow-xl">{filteredOrders.length} PENDIENTES</span>
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
                          <button onClick={() => completeOrder(order.id)} className={`${darkMode ? 'bg-[#262626] text-gray-400 hover:text-white' : 'bg-gray-50 text-gray-300 hover:text-white'} hover:bg-green-600 w-12 h-12 rounded-2xl transition-all flex items-center justify-center shadow-inner`}><i className="fas fa-check text-lg"></i></button>
                          <button onClick={() => deleteOrder(order.id)} className={`${darkMode ? 'bg-[#262626] text-gray-400 hover:text-white' : 'bg-gray-50 text-gray-300 hover:text-white'} hover:bg-red-600 w-12 h-12 rounded-2xl transition-all flex items-center justify-center shadow-inner`}><i className="fas fa-trash text-lg"></i></button>
                      </div>
                    </div>
                    
                    {order.clientName && (
                       <div className={`mb-4 pb-4 border-b ${darkMode ? 'border-[#262626]' : 'border-gray-100'} flex items-center gap-3`}>
                          <i className="fas fa-user-circle text-gray-400 text-xl"></i>
                          <div>
                             <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">Cliente</p>
                             <p className="font-bold text-sm uppercase">{order.clientName} <span className="font-normal text-gray-400 ml-2">({order.clientPhone})</span></p>
                          </div>
                       </div>
                    )}

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