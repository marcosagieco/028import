import { getSSRProducts } from '@/lib/getProducts';
import { slugProducto } from '@/lib/slug';
import { departamentosDelCatalogo, marcasDeDepartamento, soloVisibles } from '@/lib/catalogo';

// El mapa del sitio: la lista que Google usa para saber qué páginas existen.
// Antes tenía tres direcciones porque toda la tienda vivía en una sola página. Ahora
// cada departamento, cada marca y cada producto es una página propia, así que se
// arman todas desde el catálogo. Se rehace cada diez minutos, así un producto nuevo
// le llega a Google enseguida.
export const revalidate = 3600;

const SITIO = 'https://028import.com';

export default async function sitemap() {
  const ahora = new Date();

  const fijas = [
    { url: SITIO, lastModified: ahora, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITIO}/catalogo`, lastModified: ahora, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITIO}/nosotros`, lastModified: ahora, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITIO}/envios`, lastModified: ahora, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITIO}/pagos`, lastModified: ahora, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITIO}/terminos`, lastModified: ahora, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITIO}/privacidad`, lastModified: ahora, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITIO}/arrepentimiento`, lastModified: ahora, changeFrequency: 'yearly', priority: 0.3 },
  ];

  let productos = [];
  try {
    productos = await getSSRProducts();
  } catch {
    return fijas;   // sin conexión a la base, al menos que queden las fijas
  }

  const secciones = [];
  for (const d of departamentosDelCatalogo(productos)) {
    secciones.push({ url: `${SITIO}/${d.slug}`, lastModified: ahora, changeFrequency: 'daily', priority: 0.9 });
    for (const m of marcasDeDepartamento(productos, d.slug)) {
      secciones.push({ url: `${SITIO}/${d.slug}/${m.slug}`, lastModified: ahora, changeFrequency: 'daily', priority: 0.8 });
    }
  }

  const fichas = soloVisibles(productos)
    .map(p => slugProducto(p))
    .filter(Boolean)
    .map(slug => ({ url: `${SITIO}/producto/${slug}`, lastModified: ahora, changeFrequency: 'weekly', priority: 0.7 }));

  return [...fijas, ...secciones, ...fichas];
}
