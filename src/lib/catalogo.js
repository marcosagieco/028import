// Arma los departamentos y las marcas a partir de los productos.
//
// En la base no existe una lista de departamentos: cada producto dice a cuál
// pertenece (y puede aparecer en varios a la vez, con "extraListings"). Así que las
// secciones de la tienda se deducen de los productos, igual que hacía la home.
//
// Todo se agrupa por dirección web y no por texto exacto, porque en la base hay
// nombres que sólo difieren en un espacio ("BATERIA PEN" y "BATERIA PEN "). Si se
// agrupara por texto habría dos secciones idénticas; agrupando por dirección, se
// unen en una sola.

import { aSlug } from './slug';

/** Todos los pares departamento/marca en los que aparece un producto. */
export function listadosDeProducto(p) {
  const pares = [];
  if (p?.department) pares.push({ departamento: p.department, marca: p.category || '' });
  const extras = Array.isArray(p?.extraListings) ? p.extraListings : [];
  for (const e of extras) {
    if (e?.department) pares.push({ departamento: e.department, marca: e.category || '' });
  }
  return pares;
}

/** Sólo lo que se puede mostrar: ni borrado ni oculto. */
export function soloVisibles(productos) {
  return (productos || []).filter(p => p && p.isDeleted !== true && p.isHidden !== true);
}

/** Los que hay que mostrar primero: con stock arriba, agotados al final. */
function conStockPrimero(productos) {
  return [...productos].sort((a, b) => (a.inStock === false ? 1 : 0) - (b.inStock === false ? 1 : 0));
}

/**
 * Agrupa una lista de {clave, producto} por la dirección de la clave.
 * Devuelve el nombre más prolijo de cada grupo (el primero sin espacios de sobra).
 */
function agrupar(entradas) {
  const grupos = new Map();
  for (const { nombre, producto } of entradas) {
    const slug = aSlug(nombre);
    if (!slug) continue;
    if (!grupos.has(slug)) grupos.set(slug, { slug, nombre: String(nombre).trim(), productos: [] });
    const g = grupos.get(slug);
    if (!g.productos.some(x => String(x.id) === String(producto.id))) g.productos.push(producto);
  }
  return [...grupos.values()];
}

/** Los departamentos de la tienda, con cuántos productos tiene cada uno. */
export function departamentosDelCatalogo(productos) {
  const entradas = [];
  for (const p of soloVisibles(productos)) {
    for (const { departamento } of listadosDeProducto(p)) entradas.push({ nombre: departamento, producto: p });
  }
  return agrupar(entradas)
    .map(g => ({
      nombre: g.nombre,
      slug: g.slug,
      cantidad: g.productos.length,
      imagen: conStockPrimero(g.productos).find(p => p.image)?.image || null,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

/** Devuelve el departamento que corresponde a una dirección, o null. */
export function buscarDepartamento(productos, slug) {
  return departamentosDelCatalogo(productos).find(d => d.slug === slug) || null;
}

/** Los productos de un departamento, con stock primero. */
export function productosDeDepartamento(productos, slugDepartamento) {
  const elegidos = soloVisibles(productos).filter(p =>
    listadosDeProducto(p).some(l => aSlug(l.departamento) === slugDepartamento)
  );
  return conStockPrimero(elegidos);
}

/** Las marcas que hay dentro de un departamento. */
export function marcasDeDepartamento(productos, slugDepartamento) {
  const entradas = [];
  for (const p of soloVisibles(productos)) {
    for (const { departamento, marca } of listadosDeProducto(p)) {
      if (aSlug(departamento) === slugDepartamento && marca) entradas.push({ nombre: marca, producto: p });
    }
  }
  return agrupar(entradas)
    .map(g => ({
      nombre: g.nombre,
      slug: g.slug,
      cantidad: g.productos.length,
      imagen: conStockPrimero(g.productos).find(p => p.image)?.image || null,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

/** Devuelve la marca que corresponde a una dirección dentro de un departamento. */
export function buscarMarca(productos, slugDepartamento, slugMarca) {
  return marcasDeDepartamento(productos, slugDepartamento).find(m => m.slug === slugMarca) || null;
}

/** Los productos de una marca dentro de un departamento, con stock primero. */
export function productosDeMarca(productos, slugDepartamento, slugMarca) {
  const elegidos = soloVisibles(productos).filter(p =>
    listadosDeProducto(p).some(l =>
      aSlug(l.departamento) === slugDepartamento && aSlug(l.marca) === slugMarca
    )
  );
  return conStockPrimero(elegidos);
}

/** Dirección de un departamento y de una marca, para armar los enlaces. */
export const rutaDepartamento = (slug) => `/${slug}`;
export const rutaMarca = (slugDepartamento, slugMarca) => `/${slugDepartamento}/${slugMarca}`;

/**
 * Dice si una dirección tiene pinta de sección de la tienda.
 *
 * Ahora que estas páginas se arman a pedido, cualquier dirección inventada llegaría
 * hasta acá. Los pedidos de archivos (favicon.ico, apple-touch-icon.png, .php de los
 * robots que buscan agujeros) se descartan antes de tocar la base: no puede haber un
 * departamento con un punto en el nombre.
 */
export function pareceSeccion(slug) {
  return typeof slug === 'string' && slug.length > 0 && slug.length <= 120 && !slug.includes('.');
}
