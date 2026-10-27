import { urlWeb } from './imagenWeb';

// Reemplaza al optimizador de Vercel para todas las <Image> (ver imagenWeb.js).
// Las fotos de producto van a su versión WebP del tamaño justo; el resto (archivos
// de public/, links externos) se muestra tal cual.
export default function cargadorImagen({ src, width }) {
  const web = urlWeb(src, width);
  if (web) return web;
  // Next pide que la dirección cambie con el ancho; a un archivo de public/ el
  // parámetro no le afecta.
  if (src.startsWith('/')) return `${src}${src.includes('?') ? '&' : '?'}w=${width}`;
  return src;
}
