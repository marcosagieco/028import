import { adminDb } from './firebaseAdmin';

// Espejo exacto del array hardcodeado en page.js — es la base de fallback
const initialProducts = [
  { id: 1,  name: "BAJA SPLASH",              price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png",                       description: "Vapeador desechable premium con una mezcla tropical y refrescante.",                             cardSize: "normal" },
  { id: 2,  name: "BLUE RAZZ ICE",            price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/s2Tmw67w/BLUE-RAZZ-ICE.webp",                    description: "El clásico e intenso sabor a frambuesa azul combinado con un golpe helado perfecto.",            cardSize: "normal" },
  { id: 3,  name: "CHERRY FUSE",              price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/yd5PzDfx/CHERRY-FUSE.png",                       description: "Fusión explosiva de cerezas dulces y jugosas.",                                                  cardSize: "normal" },
  { id: 4,  name: "CHERRY STRAZZ",            price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "Destacado", image: "https://i.postimg.cc/7PFVsTG2/CHERRY-STRAZZ.jpg",                     description: "Una deliciosa combinación de cereza y fresa con sutiles notas cítricas.",                       cardSize: "medium" },
  { id: 5,  name: "DOUBLE APPLE ICE",         price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/QN9mJqtk/DOUBLE-APPLE-ICE.webp",                 description: "Intenso sabor a doble manzana, dulce y ácida.",                                                  cardSize: "normal" },
  { id: 6,  name: "DRAGON STRAWNANA",         price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/9X6p8qRB/DRAGON-STRAWNANA.png",                  description: "Exótico mix de pitahaya, fresa y plátano.",                                                      cardSize: "normal" },
  { id: 7,  name: "GRAPE ICE",                price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/hPV0HPTw/GRAPE-ICE.webp",                        description: "Auténtico sabor a uva dulce.",                                                                   cardSize: "normal" },
  { id: 8,  name: "MANGO MAGIC",              price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "Best Seller",image: "https://i.postimg.cc/tCFzLCFC/MANGO-MAGIC.png",                      description: "La magia del mango maduro y jugoso.",                                                            cardSize: "normal" },
  { id: 9,  name: "PEACH",                    price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/4xZ1Zk1f/PEACH.webp",                            description: "Puro sabor a durazno aterciopelado y dulce.",                                                    cardSize: "normal" },
  { id: 10, name: "SCARY BERRY",              price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/K8F5FS5D/SCARY-BERRY.png",                       description: "Misteriosa y atrapante mezcla de bayas silvestres oscuras.",                                     cardSize: "normal" },
  { id: 11, name: "SOUR LUSH GUMMY",          price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/P54Q536R/SOUR-LUSH-GUMMY.png",                   description: "El divertido sabor de las gomitas dulces con un toque ácido.",                                   cardSize: "normal" },
  { id: 12, name: "STRAWBERRY DRAGON FRUIT",  price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/QMdk9QwW/STRAWBERRY-DRAGON-FRUIT.png",           description: "Combinación vibrante de fresas maduras y exótica fruta del dragón.",                             cardSize: "normal" },
  { id: 13, name: "STRAWBERRY ICE",           price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/7Lt1gCrC/STRAWBERRY-ICE.png",                    description: "Fresas recién recolectadas bañadas en una brisa helada.",                                        cardSize: "normal" },
  { id: 14, name: "STRAWBERRY WATERMELON",    price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/MG30ycJD/STRAWBERRY-WATERMELON.webp",            description: "La clásica e infalible mezcla de fresa y sandía.",                                               cardSize: "normal" },
  { id: 15, name: "SUMMER SPLASH",            price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/LXqtvHmV/SUMMER-SPLASH.png",                     description: "Un cóctel frutal que captura la esencia del verano en cada calada.",                             cardSize: "normal" },
  { id: 16, name: "TIGERS BLOOD",             price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/3RyX9K3P/TIGERS-BLOOD.jpg",                      description: "Famosa mezcla de sandía y fresa con un exótico y suave toque de coco.",                         cardSize: "normal" },
  { id: 17, name: "WATERMELON ICE",           price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "Refrescante",image: "https://i.postimg.cc/63DdmD3s/WATERMELON-ICE.webp",                  description: "Todo el jugo y la dulzura de la sandía con un impacto extra helado.",                            cardSize: "normal" },
  { id: 25, name: "SOUR APPLE ICE",           price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/X7QqQDGS/SOUR-APPLE-ICE.jpg",                    description: "Manzana verde crujiente y ácida envuelta en una ráfaga de frío.",                                cardSize: "normal" },
  { id: 26, name: "MIAMI MINT",               price: 26000, department: "VAPES",      category: "Elfbar Ice King",    tag: "",          image: "https://i.postimg.cc/bJhqzQDS/MIAMI-MINT.jpg",                         description: "Menta sofisticada estilo Miami: fresca, dulce pero con presencia.",                              cardSize: "normal" },
  { id: 30, name: "BLUE RAZZ LEMON",          price: 28000, department: "VAPES",      category: "Ignite v400",        tag: "",          image: "https://i.postimg.cc/Jh48hT4x/ignite-v400-BLUE-RAZZ-LEMON.jpg",      description: "Dispositivo ultracompacto y premium de Ignite.",                                                 cardSize: "normal" },
  { id: 31, name: "CHERRY WATERMELON",        price: 28000, department: "VAPES",      category: "Ignite v400",        tag: "",          image: "https://i.postimg.cc/nLRJ9vCd/ignite-v400-cherry-watermelon.jpg",    description: "Diseño elegante característico de Ignite.",                                                      cardSize: "normal" },
  { id: 32, name: "GRAPE",                    price: 28000, department: "VAPES",      category: "Ignite v400",        tag: "",          image: "https://i.postimg.cc/0QzqYbSv/ignite-v400-GRAPE.jpg",                  description: "Sabor a uva puro y directo.",                                                                    cardSize: "normal" },
  { id: 33, name: "MIAMI MINT",               price: 28000, department: "VAPES",      category: "Ignite v400",        tag: "",          image: "https://i.postimg.cc/gJ1bNmyJ/ignite-v400-miami-mint.jpg",            description: "Menta premium y refrescante en el formato más cómodo.",                                          cardSize: "normal" },
  { id: 34, name: "PASSION FRUIT",            price: 28000, department: "VAPES",      category: "Ignite v400",        tag: "",          image: "https://i.postimg.cc/vT9FKkXt/Ignite-v400-PASSION-FRUIT.jpg",         description: "El toque ácido y exótico del maracuyá en cada calada.",                                          cardSize: "normal" },
  { id: 35, name: "STRAWBERRY WATERMELON",    price: 28000, department: "VAPES",      category: "Ignite v400",        tag: "",          image: "https://i.postimg.cc/FFJ41kmG/Ignite-v400-STRAWBERR-WATERMELON.jpg", description: "Dulce, frutal y perfectamente balanceado.",                                                       cardSize: "normal" },
  { id: 36, name: "STRAWBERRY KIWI",          price: 28000, department: "VAPES",      category: "Ignite v400",        tag: "",          image: "https://i.postimg.cc/Hsw19GrJ/ignite-v400-STRAWBERRY-KIWI.jpg",      description: "Fresa dulce combinada con el toque tropical del kiwi.",                                          cardSize: "normal" },
  { id: 37, name: "STRAWBERRY",               price: 28000, department: "VAPES",      category: "Ignite v400",        tag: "",          image: "https://i.postimg.cc/cLdyDD35/ignite-v400-strawberry.jpg",            description: "Auténtico sabor a fresa de principio a fin.",                                                    cardSize: "normal" },
  { id: 38, name: "TUTTI FRUTI",              price: 28000, department: "VAPES",      category: "Ignite v400",        tag: "",          image: "https://i.postimg.cc/mgVxKQ3v/ignite-v400-TUTI-FRUTI.jpg",            description: "Explosión de golosinas frutales en un vaporizador compacto.",                                    cardSize: "normal" },
  { id: 39, name: "BLUE RAZZ ICE",            price: 23000, department: "VAPES",      category: "Lost Mary 20000",    tag: "",          image: "https://i.postimg.cc/yYk7mpF9/Lost-mary-20000-BLUE-RAZZ-ICE.jpg",    description: "El dispositivo Lost Mary con 20000 caladas.",                                                    cardSize: "normal" },
  { id: 40, name: "GRAPE ICE",                price: 23000, department: "VAPES",      category: "Lost Mary 20000",    tag: "",          image: "https://i.postimg.cc/wTZg05VC/Lost-mary-20000-GRAPE-ICE.jpg",         description: "El dispositivo Lost Mary con 20000 caladas.",                                                    cardSize: "normal" },
  { id: 41, name: "ICE MINT",                 price: 23000, department: "VAPES",      category: "Lost Mary 20000",    tag: "",          image: "https://i.postimg.cc/wTZg05V5/lost-mary-20000-ICE-MINT.jpg",          description: "El dispositivo Lost Mary con 20000 caladas.",                                                    cardSize: "normal" },
  { id: 42, name: "LIME GRAPE FRUIT",         price: 23000, department: "VAPES",      category: "Lost Mary 20000",    tag: "",          image: "https://i.postimg.cc/7LqcVbpW/Lost-mary-20000-LIME-GRAPE-FRUIT.jpg",  description: "El dispositivo Lost Mary con 20000 caladas.",                                                    cardSize: "normal" },
  { id: 43, name: "MANGO TWIST",              price: 23000, department: "VAPES",      category: "Lost Mary 20000",    tag: "",          image: "https://i.postimg.cc/8CwYnNGc/Lost-mary-20000-MANGO-TWIST.jpg",       description: "El dispositivo Lost Mary con 20000 caladas.",                                                    cardSize: "normal" },
  { id: 44, name: "MEXICAN MANGO",            price: 23000, department: "VAPES",      category: "Lost Mary 20000",    tag: "",          image: "https://i.postimg.cc/bvL5FpPx/Lost-mary-20000-MEXICAN-MANGO.jpg",     description: "El dispositivo Lost Mary con 20000 caladas.",                                                    cardSize: "normal" },
  { id: 45, name: "MIAMI MINT",               price: 23000, department: "VAPES",      category: "Lost Mary 20000",    tag: "",          image: "https://i.postimg.cc/yWqpSNmv/Lost-mary-20000-MIAMI-MINT.jpg",        description: "El dispositivo Lost Mary con 20000 caladas.",                                                    cardSize: "normal" },
  { id: 46, name: "STRAWBERRY ICE",           price: 23000, department: "VAPES",      category: "Lost Mary 20000",    tag: "",          image: "https://i.postimg.cc/zDLJWPw3/Lost-mary-20000-STRAWBERRY-ICE.jpg",    description: "El dispositivo Lost Mary con 20000 caladas.",                                                    cardSize: "normal" },
  { id: 47, name: "STRAWBERRY KIWI",          price: 23000, department: "VAPES",      category: "Lost Mary 20000",    tag: "",          image: "https://i.postimg.cc/59Hxvk5q/Lost-mary-20000-STRAWBERRY-KIWI.jpg",  description: "El dispositivo Lost Mary con 20000 caladas.",                                                    cardSize: "normal" },
  { id: 18, name: "BLOW THC",                 price: 55000, department: "THC",        category: "Vapes THC",          tag: "Nuevo",     image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp",                          description: "Dispositivo de alta pureza con extracciones premium.",                                           cardSize: "medium" },
  { id: 19, name: "TORCH 7.5G",               price: 53000, department: "THC",        category: "Vapes THC",          tag: "",          image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png",                         description: "Capacidad extrema de 7.5G de extracto premium.",                                                 cardSize: "normal" },
  { id: 29, name: "TORCH 4.5G",               price: 52500, department: "THC",        category: "Vapes THC",          tag: "Nuevo",     image: "https://i.postimg.cc/vmFK42hC/TORCH-4-5G.jpg",                         description: "4.5G de puro rendimiento.",                                                                      cardSize: "normal" },
  { id: 20, name: "PHENOM 6G",                price: 56000, department: "THC",        category: "Vapes THC",          tag: "Destacado", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg",                          description: "Dispositivo de grado premium cargado con 6G.",                                                   cardSize: "large"  },
  { id: 27, name: "PLAYSTATION 5",            price: 550,   department: "TECNOLOGÍA", category: "PlayStation",         tag: "USD",       image: "https://i.postimg.cc/RFGS0Wzt/PLAY-5.jpg",                             description: "PlayStation 5 original en caja sellada.",                                                        cardSize: "large"  },
  { id: 28, name: "AIRPODS PRO",              price: 35000, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE",    tag: "Nuevo",     image: "https://i.postimg.cc/X7gzDt0p/AIRPODS-PRO.jpg",                        description: "Auriculares inalámbricos originales con cancelación activa.",                                     cardSize: "normal" },
  { id: 21, name: "CARGADOR 20W",             price: 16500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE",    tag: "",          image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg",                   description: "Adaptador de corriente USB-C de 20W original Apple.",                                            cardSize: "normal" },
  { id: 22, name: "CARGADOR 35W",             price: 20500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE",    tag: "Potente",   image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg",                   description: "Adaptador de corriente dual USB-C de 35W original Apple.",                                       cardSize: "normal" },
  { id: 23, name: "CABLE USB-C A USB-C",      price: 13500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE",    tag: "",          image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg",                         description: "Cable original Apple de USB-C a USB-C.",                                                         cardSize: "normal" },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M",price:13500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE",    tag: "",          image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg",            description: "Cable original Apple USB-C a Lightning de 2 metros.",                                            cardSize: "normal" },
];

function serializeProduct(data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) continue;
    // Firestore Timestamps → segundos numéricos (compatible con el cliente)
    if (typeof v === 'object' && typeof v.toMillis === 'function') {
      out[k] = { seconds: Math.floor(v.toMillis() / 1000) };
    } else if (typeof v === 'object' && !Array.isArray(v) && v.constructor?.name === 'Object') {
      out[k] = serializeProduct(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function getSSRHomeSections() {
  try {
    const snapshot = await adminDb.collection('home_sections').get();
    if (snapshot.empty) return [];
    return snapshot.docs
      .map(d => ({ dbId: d.id, ...serializeProduct(d.data()) }))
      .sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
  } catch (err) {
    console.error('[SSR] getSSRHomeSections falló:', err.message);
    return [];
  }
}

export async function getSSRHomeLayout() {
  try {
    const docSnap = await adminDb.collection('settings').doc('home_layout').get();
    const sections = docSnap.exists ? docSnap.data()?.sections : null;
    return Array.isArray(sections) ? sections : [];
  } catch (err) {
    console.error('[SSR] getSSRHomeLayout falló:', err.message);
    return [];
  }
}

export async function getSSRProducts() {
  try {
    const snapshot = await adminDb.collection('products').get();

    const normalizeId = (docId, data) => {
      const rawId = data.id ?? String(docId).replace(/^prod_/, '');
      const numericId = Number(rawId);
      return Number.isSafeInteger(numericId) && String(rawId).trim() !== '' ? numericId : rawId;
    };

    const dbProducts = snapshot.docs.map(docSnap => {
      const raw = docSnap.data();
      const data = serializeProduct(raw);
      return {
        ...data,
        dbId:     docSnap.id,
        id:       normalizeId(docSnap.id, data),
        isHidden: data.isHidden  === true,
        isDeleted: data.isDeleted === true,
        inStock:  data.inStock   === false ? false : true,
        cardSize: data.cardSize  || 'normal',
        clicks:   data.clicks    || 0,
        order:    Number(data.order) || 99,
      };
    });

    const combined = [...initialProducts];
    dbProducts.forEach(dbItem => {
      const index = combined.findIndex(p => String(p.id) === String(dbItem.id));
      if (dbItem.isDeleted) {
        if (index > -1) combined.splice(index, 1);
        return;
      }
      if (index > -1) combined[index] = { ...combined[index], ...dbItem };
      else combined.push(dbItem);
    });

    return combined
      .sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99))
      .filter(p => !p.isDeleted);

  } catch (err) {
    console.error('[SSR] getSSRProducts falló, usando fallback:', err.message);
    // Si Admin falla (sin credenciales en dev, etc.), devuelve el array base
    return initialProducts;
  }
}
