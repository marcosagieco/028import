import { getSSRPromos } from './getProducts';
import { getResumenResenas } from './resenas';
import { escalonesDeProducto } from './combos';

/**
 * Le suma a cada producto lo que muestra su tarjeta en los listados de departamento
 * y de marca: el primer precio por cantidad (de él o de su marca) y su resumen de
 * reseñas. Se calcula acá, en el servidor, así las tarjetas no consultan la base.
 */
export async function conExtrasDeTarjeta(productos) {
  const [promos, resenas] = await Promise.all([
    getSSRPromos().catch(() => []),
    getResumenResenas(),
  ]);
  return productos.map(p => {
    const escalon = escalonesDeProducto(promos, p)[0];
    const resena = resenas[String(p.id)];
    return {
      ...p,
      promoCantidad: escalon?.minQty || 0,
      promoPrecio: escalon?.precioUnitario || 0,
      resenaPromedio: resena?.promedio || 0,
      resenaCantidad: resena?.cantidad || 0,
    };
  });
}
