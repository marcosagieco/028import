import { notFound } from 'next/navigation';
import { getSSRProducts, getSSRPromos } from '@/lib/getProducts';
import { getVentasPorProducto, puestoEnSuMarca } from '@/lib/ventas';
import { getResenasDeProducto } from '@/lib/resenas';
import { escalonesDeProducto } from '@/lib/combos';
import { slugProducto, buscarPorSlug } from '@/lib/slug';
import FichaProducto from '@/components/FichaProducto';
import HomeClient from '@/app/HomeClient';

// Cada producto es una página de verdad. Se regeneran solas cada minuto, así que si
// cambiás un precio, marcás algo sin stock o desocultás un producto desde el panel,
// se refleja sin volver a deployar. Un producto nuevo tiene página desde la primera
// vez que alguien entra: no hace falta compilar de nuevo.
// La red de seguridad, no el mecanismo principal: el panel avisa apenas guardás y
// la página se rehace en el momento. Esto es por si ese aviso no llega (te quedaste
// sin señal, se cayó el pedido). Una hora en vez de un minuto ahorra muchísimas
// lecturas de la base, que es lo que se paga.
export const revalidate = 3600;
export const dynamicParams = true;   // un producto nuevo funciona sin volver a compilar

const SITIO = 'https://028import.com';

async function traerProducto(slug) {
  const productos = await getSSRProducts();
  const visibles = productos.filter(p => p.isDeleted !== true && p.isHidden !== true);
  return { producto: buscarPorSlug(visibles, slug), todos: visibles };
}

/** Le dice a Next qué páginas generar de antemano. */
export async function generateStaticParams() {
  try {
    const productos = await getSSRProducts();
    return productos
      .filter(p => p.isDeleted !== true && p.isHidden !== true)
      .map(p => ({ slug: slugProducto(p) }))
      .filter(x => x.slug);
  } catch {
    return [];   // sin conexión a la base, las páginas se arman a pedido
  }
}

/** Título, descripción e imagen para Google y para el previsualizador de WhatsApp. */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { producto } = await traerProducto(slug);
  if (!producto) return { title: 'Producto no encontrado' };

  const precio = producto.offerPrice > 0 && producto.offerPrice < producto.price
    ? producto.offerPrice : producto.price;
  const moneda = producto.tag === 'USD' ? 'USD' : '$';
  const descripcion = (producto.description || '').trim()
    || `${producto.name} de ${producto.category}. ${moneda}${Number(precio).toLocaleString('es-AR')}. Envío en 30 minutos por CABA y AMBA.`;

  return {
    title: `${producto.name} — ${producto.category}`,
    description: descripcion.slice(0, 160),
    alternates: { canonical: `/producto/${slug}` },
    openGraph: {
      type: 'website',
      locale: 'es_AR',
      url: `${SITIO}/producto/${slug}`,
      siteName: '028 Import',
      title: `${producto.name} — ${moneda}${Number(precio).toLocaleString('es-AR')}`,
      description: descripcion.slice(0, 200),
      images: producto.image ? [{ url: producto.image, alt: producto.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${producto.name} — ${producto.category}`,
      description: descripcion.slice(0, 200),
      images: producto.image ? [producto.image] : undefined,
    },
  };
}

export default async function PaginaProducto({ params }) {
  const { slug } = await params;
  const { producto, todos } = await traerProducto(slug);
  if (!producto) notFound();

  const conOferta = producto.offerPrice > 0 && producto.offerPrice < producto.price;
  const precio = conOferta ? producto.offerPrice : producto.price;

  // Los combos por cantidad y las ventas reales. Las dos cosas se leen acá, en el
  // servidor, y viajan ya calculadas: la página no hace consultas desde el navegador.
  const [promos, ventas, resenas] = await Promise.all([getSSRPromos(), getVentasPorProducto(), getResenasDeProducto(producto.id)]);
  const escalones = escalonesDeProducto(promos, producto);
  const puesto = puestoEnSuMarca(ventas, producto, todos);

  // Productos de la misma marca, para sugerir abajo.
  const relacionados = todos
    .filter(p => p.category === producto.category && String(p.id) !== String(producto.id) && p.inStock !== false)
    .slice(0, 8);

  // Esto es lo que permite que Google muestre el precio y el stock en los resultados.
  const datosParaGoogle = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.name,
    image: producto.image ? [producto.image] : undefined,
    description: (producto.description || '').trim() || `${producto.name} de ${producto.category}.`,
    sku: String(producto.id),
    brand: producto.category ? { '@type': 'Brand', name: producto.category } : undefined,
    offers: {
      '@type': 'Offer',
      url: `${SITIO}/producto/${slug}`,
      price: Number(precio) || 0,
      priceCurrency: producto.tag === 'USD' ? 'USD' : 'ARS',
      availability: producto.inStock === false
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: '028 Import' },
    },
    aggregateRating: resenas.cantidad > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: resenas.promedio.toFixed(1),
      reviewCount: resenas.cantidad,
    } : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosParaGoogle) }}
      />
      {/* Va dentro del armazón para tener la misma barra, el mismo carrito y el
          mismo pie que la home. El marquee no: ése es sólo de la portada. */}
      <HomeClient ssrProducts={todos} modo="contenido">
        <FichaProducto
          producto={producto}
          relacionados={relacionados}
          escalones={escalones}
          puesto={puesto}
          resenas={resenas}
        />
      </HomeClient>
    </>
  );
}
