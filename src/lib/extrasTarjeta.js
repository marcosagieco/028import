import { getSSRPromos } from './getProducts';
import { getResumenResenas } from './resenas';
import { escalonesDeProducto, precioSegunCantidad } from './combos';
import { MINIMO_ENVIO_GRATIS } from './cyber';

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
    const escalones = escalonesDeProducto(promos, p);
    const escalon = escalones[0];
    const base = p.offerPrice > 0 && p.offerPrice < p.price ? p.offerPrice : p.price;
    const resena = resenas[String(p.id)];
    return {
      ...p,
      promoCantidad: escalon?.minQty || 0,
      promoPrecio: escalon?.precioUnitario || 0,
      // CYBER 028: con 5 de este modelo llega al envío gratis.
      envioGratisCon5: escalones.length > 0 && precioSegunCantidad(escalones, 5, base) * 5 >= MINIMO_ENVIO_GRATIS,
      resenaPromedio: resena?.promedio || 0,
      resenaCantidad: resena?.cantidad || 0,
    };
  });
}
