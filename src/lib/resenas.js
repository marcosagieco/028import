import { getAdminDb } from './firebaseAdmin';

// Reseñas de compras verificadas: sólo se pueden dejar desde el enlace que trae
// cada pedido (ver /resena/[token] y /api/resenas), nunca escribiendo directo a la
// base desde el navegador. Por eso acá alcanza con leer lo que ya está guardado.

const cache = new Map();
const TTL_MS = 60 * 1000;
const VACIO = { promedio: 0, cantidad: 0, lista: [] };

/** Reseñas visibles de un producto: promedio, cantidad y la lista para mostrar. */
export async function getResenasDeProducto(productId) {
  const clave = String(productId);
  const cacheada = cache.get(clave);
  if (cacheada && Date.now() - cacheada.leidoEn < TTL_MS) return cacheada.datos;

  try {
    const db = getAdminDb();
    if (!db) return VACIO;

    const snap = await db.collection('reviews')
      .where('productId', '==', clave)
      .where('oculta', '==', false)
      .get();

    if (snap.empty) {
      cache.set(clave, { leidoEn: Date.now(), datos: VACIO });
      return VACIO;
    }

    const lista = snap.docs
      .map(d => {
        const x = d.data();
        return {
          id: d.id,
          name: x.name || 'Cliente',
          rating: Number(x.rating) || 0,
          text: x.text || '',
          creadoEn: x.createdAt?.toMillis?.() || 0,
        };
      })
      .sort((a, b) => b.creadoEn - a.creadoEn);

    const promedio = lista.reduce((a, r) => a + r.rating, 0) / lista.length;
    const datos = { promedio, cantidad: lista.length, lista };
    cache.set(clave, { leidoEn: Date.now(), datos });
    return datos;
  } catch (err) {
    console.error('[resenas] no se pudo leer:', err.message);
    return cacheada?.datos || VACIO;
  }
}
