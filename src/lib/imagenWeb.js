// Versiones livianas (WebP) de las fotos de producto, guardadas en el mismo bucket.
//
// Por qué existen: antes las fotos las achicaba el optimizador de Vercel, que en el
// plan gratis tiene un límite de 5.000 por mes. Al llenarse, toda foto nueva
// dejaba de verse ("Payment required"). Ahora las versiones se generan una sola vez
// al subir la foto (y al guardar el producto, por si faltara alguna) y la página
// las pide directo al bucket, sin pasar por Vercel.
//
// La foto productos/abc.png tiene sus versiones en web/productos/abc-480.webp, etc.
// Este archivo lo usan tanto la página (para armar la dirección) como el servidor
// (para crearlas), así que no puede importar nada de servidor.

export const ANCHOS_WEB = [200, 480, 1080];

const PATRON = /^https:\/\/storage\.googleapis\.com\/([^/]+)\/((?:productos|productos-1080)\/[^?#]+)\.(png|jpe?g|webp)$/i;

/** Bucket y ruta de la foto original, o null si no es una foto que tenga versiones. */
export function partesDeFoto(src) {
  const m = typeof src === 'string' ? src.match(PATRON) : null;
  return m ? { bucket: m[1], ruta: `${m[2]}.${m[3]}`, sinExtension: m[2] } : null;
}

export const rutaWeb = (sinExtension, ancho) => `web/${sinExtension}-${ancho}.webp`;

/** La versión liviana más chica que alcanza para el ancho pedido. */
export function urlWeb(src, anchoPedido) {
  const partes = partesDeFoto(src);
  if (!partes) return null;
  const ancho = ANCHOS_WEB.find(a => a >= anchoPedido) || ANCHOS_WEB[ANCHOS_WEB.length - 1];
  return `https://storage.googleapis.com/${partes.bucket}/${rutaWeb(partes.sinExtension, ancho)}`;
}
