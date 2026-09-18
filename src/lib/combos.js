import { aSlug } from './slug';

// Los combos por cantidad: "llevando 2 te sale más barato cada uno".
//
// Esto ya existía a medias en la tienda —una promoción por producto o por marca, con
// una cantidad mínima y un precio— pero sólo se veía como una etiqueta chiquita en la
// tarjeta, y sólo se podía cargar UN escalón por producto. Acá se generaliza: varios
// escalones, ordenados, y el precio que corresponde según cuánto lleve la persona.
//
// Un producto sin escalones cargados no muestra nada. Eso es a propósito: se cargan
// desde el panel, de a uno, y se pueden sacar.

/** El precio por unidad de un escalón. Se guarda el total de la promo, no el unitario. */
const unitario = (escalon) => {
  const min = Number(escalon?.minQty) || 0;
  const total = Number(escalon?.totalPrice) || 0;
  return min > 0 ? total / min : 0;
};

/**
 * Los escalones que aplican a un producto, del más chico al más grande.
 * Toma los del producto y, si no tiene, los de su marca.
 *
 * La marca se compara normalizada, no letra por letra: en la base conviven
 * "Elfbar Ice King" (como se guardó la promoción) y "ELFBAR ICE KING" (como está en
 * los productos). Comparando exacto, la marca más grande del catálogo se quedaba sin
 * combos y nadie se daba cuenta de por qué.
 */
export function escalonesDeProducto(promos, producto) {
  if (!producto || !Array.isArray(promos)) return [];

  const delProducto = promos.filter(p =>
    p && p.type === 'product' && String(p.productId) === String(producto.id)
  );
  const laMarca = aSlug(producto.category);
  const lista = delProducto.length
    ? delProducto
    : promos.filter(p => p && (p.type || 'category') === 'category' && laMarca && aSlug(p.category) === laMarca);

  return lista
    .map(p => ({
      id: p.id || `${p.minQty}`,
      minQty: Number(p.minQty) || 0,
      precioUnitario: Math.round(unitario(p)),
      totalPrice: Number(p.totalPrice) || 0,
    }))
    .filter(e => e.minQty > 1 && e.precioUnitario > 0)
    .sort((a, b) => a.minQty - b.minQty);
}

/**
 * El precio por unidad que corresponde a cierta cantidad: el escalón más alto que
 * ya alcanzó. Si no llega a ninguno, paga el precio normal.
 */
export function precioSegunCantidad(escalones, cantidad, precioBase) {
  let precio = Number(precioBase) || 0;
  for (const e of escalones || []) {
    if (cantidad >= e.minQty) precio = e.precioUnitario;
  }
  return precio;
}

/**
 * Las fichas que se dibujan en la página del producto: la primera es "suelto" (el
 * precio normal) y después cada escalón, con cuánto se ahorra llevando esa cantidad.
 */
export function fichasDeCombo(escalones, precioBase) {
  if (!escalones?.length) return [];
  const base = Number(precioBase) || 0;
  return [
    { cantidad: 1, etiqueta: 'Suelto', precioUnitario: base, ahorro: 0, esBase: true },
    ...escalones.map((e, i) => ({
      cantidad: e.minQty,
      // El último escalón se muestra como "3+" porque de ahí en adelante vale igual.
      abierto: i === escalones.length - 1,
      etiqueta: null,
      precioUnitario: e.precioUnitario,
      ahorro: Math.max(0, (base - e.precioUnitario) * e.minQty),
      esBase: false,
    })),
  ];
}

/** El gancho corto para las tarjetas del catálogo: "Llevá 2 y ahorrás $2.898". */
export function ganchoDeCombo(escalones, precioBase) {
  const primero = escalones?.[0];
  if (!primero) return null;
  const ahorro = Math.max(0, (Number(precioBase) || 0) - primero.precioUnitario) * primero.minQty;
  if (ahorro <= 0) return null;
  return { cantidad: primero.minQty, ahorro: Math.round(ahorro) };
}
