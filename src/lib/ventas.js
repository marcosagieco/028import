import { getAdminDb } from './firebaseAdmin';

// Cuántas unidades se vendieron de cada producto. Sirve para mostrar "138 vendidos"
// en la ficha y para saber cuáles son los más pedidos de cada marca.
//
// El problema a resolver acá es el costo: hay más de 2.500 pedidos, y leerlos todos
// cada vez que alguien abre una página costaría una fortuna en lecturas de base.
// Por eso se guarda un resumen en un solo documento y, cuando queda viejo, se ponen
// al día SÓLO los pedidos nuevos desde la última vez. Con unos 15 pedidos por día,
// cada actualización lee quince documentos en vez de dos mil quinientos.
//
// Los números son conservadores a propósito: los pedidos viejos guardaban sólo el
// nombre del producto, y hay nombres que se repiten entre marcas. Cuando no se puede
// determinar con certeza a qué producto corresponde una venta, no se cuenta. Es
// preferible mostrar de menos que inventar de más.

const DOC_RESUMEN = 'stats/ventas';
const FRESCURA_MS = 30 * 60 * 1000;   // media hora

const vacio = { unidades: {}, hasta: 0, total: 0 };

/** Suma las unidades de una tanda de pedidos al acumulado. */
function acumular(unidades, documentos, indicePorNombre) {
  let ultimo = 0;
  for (const doc of documentos) {
    const datos = doc.data();
    const cuando = datos.createdAt?.toMillis?.() || 0;
    if (cuando > ultimo) ultimo = cuando;

    for (const item of datos.items || []) {
      const cantidad = Number(item.qty) || 1;
      let id = item.productId;

      // Pedidos viejos: sin id. Se busca por nombre y, si el nombre está repetido
      // entre marcas, se desempata por el precio que se pagó. Si ni así se puede
      // saber, se descarta.
      if (id == null) {
        const candidatos = indicePorNombre.get(String(item.name || '').trim().toUpperCase()) || [];
        if (candidatos.length === 1) id = candidatos[0].id;
        else if (candidatos.length > 1) {
          const porPrecio = candidatos.filter(c => Number(c.price) === Number(item.price));
          if (porPrecio.length === 1) id = porPrecio[0].id;
        }
      }
      if (id == null) continue;

      const clave = String(id);
      unidades[clave] = (unidades[clave] || 0) + cantidad;
    }
  }
  return ultimo;
}

/** Arma el índice nombre -> productos, para los pedidos viejos sin id. */
async function indiceDeNombres(db) {
  const snap = await db.collection('products').get();
  const indice = new Map();
  for (const d of snap.docs) {
    const p = d.data();
    const nombre = String(p.name || '').trim().toUpperCase();
    if (!nombre) continue;
    indice.set(nombre, [...(indice.get(nombre) || []), { id: p.id ?? d.id.replace(/^prod_/, ''), price: p.price }]);
  }
  return indice;
}

/**
 * Devuelve { unidades: { "4": 138, ... }, total } poniendo al día el resumen si hace
 * falta. Nunca lanza: si la base no responde, devuelve el resumen vacío y la página
 * simplemente no muestra los números.
 */
export async function getVentasPorProducto() {
  try {
    const db = getAdminDb();
    if (!db) return vacio;

    const ref = db.doc(DOC_RESUMEN);
    const actual = (await ref.get()).data() || vacio;

    const alDia = Date.now() - (actual.actualizado || 0) < FRESCURA_MS;
    if (alDia) return { unidades: actual.unidades || {}, total: actual.total || 0 };

    // Sólo los pedidos posteriores al último procesado.
    let consulta = db.collection('orders').orderBy('createdAt', 'asc');
    if (actual.hasta) {
      consulta = consulta.where('createdAt', '>', new Date(actual.hasta));
    }
    const nuevos = await consulta.get();

    if (nuevos.empty) {
      await ref.set({ ...actual, actualizado: Date.now() }, { merge: true });
      return { unidades: actual.unidades || {}, total: actual.total || 0 };
    }

    // El índice por nombre sólo hace falta si hay pedidos sin id de producto.
    const hacenFaltaNombres = nuevos.docs.some(d => (d.data().items || []).some(i => i.productId == null));
    const indice = hacenFaltaNombres ? await indiceDeNombres(db) : new Map();

    const unidades = { ...(actual.unidades || {}) };
    const hasta = acumular(unidades, nuevos.docs, indice);
    const total = Object.values(unidades).reduce((a, b) => a + b, 0);

    await ref.set({
      unidades,
      total,
      hasta: Math.max(hasta, actual.hasta || 0),
      actualizado: Date.now(),
    });

    return { unidades, total };
  } catch (err) {
    console.error('[ventas] no se pudo leer el resumen:', err.message);
    return vacio;
  }
}

/** Cuántas unidades se vendieron de un producto. */
export const unidadesVendidas = (ventas, producto) =>
  Number(ventas?.unidades?.[String(producto?.id)]) || 0;

/**
 * La posición de un producto entre los de su marca. Devuelve null si no entra en el
 * podio: un distintivo que tiene la mitad del catálogo no distingue nada.
 *
 * Se ordena por producto y no por número suelto, porque dos productos empatados en
 * unidades daban los dos "TOP 1", que queda mal. Con el empate se desempata por id,
 * que es estable: el mismo producto sale siempre en el mismo puesto.
 */
export function puestoEnSuMarca(ventas, producto, todosLosProductos) {
  if (!unidadesVendidas(ventas, producto)) return null;

  const hermanos = (todosLosProductos || [])
    .filter(p => p.category === producto.category && p.isDeleted !== true && p.isHidden !== true)
    .map(p => ({ id: String(p.id), unidades: unidadesVendidas(ventas, p) }))
    .filter(p => p.unidades > 0)
    .sort((a, b) => b.unidades - a.unidades || a.id.localeCompare(b.id));

  // Con pocos productos en la marca, ser "top 3" no dice nada.
  if (hermanos.length < 5) return null;

  const puesto = hermanos.findIndex(h => h.id === String(producto.id)) + 1;
  return puesto >= 1 && puesto <= 3 ? puesto : null;
}
