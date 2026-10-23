import { getAdminDb } from './firebaseAdmin';

// Qué productos se compran juntos, contado con los pedidos reales. Sirve para
// "Los que llevaron este, también llevaron" en la ficha y para elegir qué sabores
// sugerir en el carrito.
//
// Mismo esquema que ventas.js: un resumen en un solo documento que se pone al día
// sólo con los pedidos nuevos, para no leer los 3.000 pedidos en cada página. Los
// pedidos viejos guardaban sólo el nombre; si el nombre no alcanza para saber qué
// producto era, ese ítem no se cuenta (mejor de menos que inventado).

const DOC_RESUMEN = 'stats/juntos';
const FRESCURA_MS = 6 * 60 * 60 * 1000;   // seis horas
const CACHE_PROCESO_MS = 60 * 1000;

const vacio = { pares: {}, hasta: 0 };
const clavePar = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

async function indiceDeNombres(db) {
  const snap = await db.collection('products').get();
  const indice = new Map();
  for (const d of snap.docs) {
    const p = d.data();
    const nombre = String(p.name || '').trim().toUpperCase();
    if (!nombre) continue;
    indice.set(nombre, [...(indice.get(nombre) || []), { id: String(p.id ?? d.id.replace(/^prod_/, '')), price: p.price }]);
  }
  return indice;
}

function idDelItem(item, indice) {
  if (item.productId != null) return String(item.productId);
  const candidatos = indice.get(String(item.name || '').trim().toUpperCase()) || [];
  if (candidatos.length === 1) return candidatos[0].id;
  const porPrecio = candidatos.filter(c => Number(c.price) === Number(item.price));
  return porPrecio.length === 1 ? porPrecio[0].id : null;
}

let enCache = null;
let leidoEn = 0;
let recalculando = false;

async function ponerAlDia(db, actual) {
  if (recalculando) return;
  recalculando = true;
  try {
    let consulta = db.collection('orders').orderBy('createdAt', 'asc');
    if (actual.hasta) consulta = consulta.where('createdAt', '>', new Date(actual.hasta));
    const nuevos = await consulta.get();
    const ref = db.doc(DOC_RESUMEN);
    if (nuevos.empty) { await ref.set({ actualizado: Date.now() }, { merge: true }); return; }

    const hacenFaltaNombres = nuevos.docs.some(d => (d.data().items || []).some(i => i.productId == null));
    const indice = hacenFaltaNombres ? await indiceDeNombres(db) : new Map();

    const pares = { ...(actual.pares || {}) };
    let hasta = actual.hasta || 0;
    for (const doc of nuevos.docs) {
      const datos = doc.data();
      const cuando = datos.createdAt?.toMillis?.() || 0;
      if (cuando > hasta) hasta = cuando;
      const ids = [...new Set((datos.items || []).filter(i => !i.isUpsell).map(i => idDelItem(i, indice)).filter(Boolean))];
      for (let a = 0; a < ids.length; a++) {
        for (let b = a + 1; b < ids.length; b++) {
          const k = clavePar(ids[a], ids[b]);
          pares[k] = (pares[k] || 0) + 1;
        }
      }
    }
    await ref.set({ pares, hasta, actualizado: Date.now() });
    enCache = { pares };
    leidoEn = Date.now();
  } catch (err) {
    console.error('[juntos] no se pudo poner al día:', err.message);
  } finally {
    recalculando = false;
  }
}

/** { pares: { "2|7": 13, ... } }. Responde rápido y se renueva por detrás. Nunca lanza. */
export async function getComprasJuntos() {
  if (enCache && Date.now() - leidoEn < CACHE_PROCESO_MS) return enCache;
  try {
    const db = getAdminDb();
    if (!db) return vacio;
    const actual = (await db.doc(DOC_RESUMEN).get()).data() || vacio;
    enCache = { pares: actual.pares || {} };
    leidoEn = Date.now();
    const compilando = process.env.NEXT_PHASE === 'phase-production-build';
    if (!compilando && Date.now() - (actual.actualizado || 0) >= FRESCURA_MS) ponerAlDia(db, actual);
    return enCache;
  } catch (err) {
    console.error('[juntos] no se pudo leer el resumen:', err.message);
    return enCache || vacio;
  }
}

/** Los ids que más se compraron junto con un producto, de más a menos veces. */
export function tambienLlevaron(juntos, productoId, limite = 8) {
  const id = String(productoId);
  return Object.entries(juntos?.pares || {})
    .map(([k, veces]) => {
      const [a, b] = k.split('|');
      if (a === id) return { id: b, veces };
      if (b === id) return { id: a, veces };
      return null;
    })
    .filter(Boolean)
    .sort((x, y) => y.veces - x.veces)
    .slice(0, limite);
}
