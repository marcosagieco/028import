// Convierte textos en direcciones web legibles, y arma la dirección de cada producto.
// Se usa tanto en el servidor (para generar las páginas) como en el navegador (para
// armar los enlaces), así que no puede depender de nada del navegador.

/** "Elfbar Ice King" -> "elfbar-ice-king" */
export function aSlug(texto) {
  return String(texto || '')
    .normalize('NFD')                      // separa las letras de sus acentos
    .replace(/[̀-ͯ]/g, '')       // y los quita: "café" -> "cafe"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')           // todo lo que no sea letra o número pasa a guion
    .replace(/^-+|-+$/g, '')               // sin guiones sueltos en las puntas
    .replace(/-{2,}/g, '-');               // ni repetidos en el medio
}

/**
 * Dirección de un producto: incluye la marca porque hay nombres repetidos entre
 * marcas distintas (por ejemplo "CHERRY STRAZZ" existe en ELFBAR ICE KING y en
 * DINNER LADY GALAXY 60K). Sin la marca, las dos apuntarían al mismo lugar.
 */
export function slugProducto(producto) {
  if (!producto) return '';
  const marca = aSlug(producto.category);
  const nombre = aSlug(producto.name);
  if (!nombre) return '';
  return marca ? `${marca}-${nombre}` : nombre;
}

/** Dirección completa, para enlaces y para compartir. */
export function rutaProducto(producto) {
  const slug = slugProducto(producto);
  return slug ? `/producto/${slug}` : '/';
}

/**
 * Busca el producto que corresponde a una dirección. Si dos productos generaran la
 * misma —no debería pasar, pero por las dudas— devuelve el primero, para que la
 * página muestre algo en vez de un error.
 */
export function buscarPorSlug(productos, slug) {
  if (!slug) return null;
  const buscado = String(slug).toLowerCase();
  return (productos || []).find(p => slugProducto(p) === buscado) || null;
}
