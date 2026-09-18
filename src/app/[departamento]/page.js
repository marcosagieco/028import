import { notFound } from 'next/navigation';
import { getSSRProducts } from '@/lib/getProducts';
import {
  departamentosDelCatalogo,
  buscarDepartamento,
  marcasDeDepartamento,
  productosDeDepartamento,
  pareceSeccion,
} from '@/lib/catalogo';
import ListadoCatalogo from '@/components/ListadoCatalogo';
import HomeClient from '@/app/HomeClient';

// Cada departamento es una dirección propia: 028import.com/vapes, /apple, etc.
// Se rearman solas cada minuto, igual que las fichas de producto.
// La red de seguridad, no el mecanismo principal: el panel avisa apenas guardás y
// la página se rehace en el momento. Esto es por si ese aviso no llega (te quedaste
// sin señal, se cayó el pedido). Una hora en vez de un minuto ahorra muchísimas
// lecturas de la base, que es lo que se paga.
export const revalidate = 3600;

// Un departamento o una marca que todavía no existía cuando se compiló el sitio
// —porque la creaste recién desde el panel, o porque sus productos estaban
// ocultos— igual tiene página: se arma la primera vez que alguien entra. Si el
// nombre no corresponde a nada real, devuelve 404 igual que antes.
export const dynamicParams = true;

const SITIO = 'https://028import.com';

export async function generateStaticParams() {
  try {
    const productos = await getSSRProducts();
    return departamentosDelCatalogo(productos).map(d => ({ departamento: d.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { departamento } = await params;
  if (!pareceSeccion(departamento)) return { title: 'Sección no encontrada' };

  const productos = await getSSRProducts();
  const depto = buscarDepartamento(productos, departamento);
  if (!depto) return { title: 'Sección no encontrada' };

  const marcas = marcasDeDepartamento(productos, departamento);
  const descripcion = `${depto.cantidad} productos de ${depto.nombre.toLowerCase()} en 028 Import${
    marcas.length ? `: ${marcas.slice(0, 4).map(m => m.nombre).join(', ')}` : ''
  }. Envío en 30 minutos por CABA y AMBA.`;

  return {
    title: depto.nombre,
    description: descripcion.slice(0, 160),
    alternates: { canonical: `/${departamento}` },
    openGraph: {
      type: 'website',
      locale: 'es_AR',
      url: `${SITIO}/${departamento}`,
      siteName: '028 Import',
      title: `${depto.nombre} — 028 Import`,
      description: descripcion.slice(0, 200),
      images: depto.imagen ? [{ url: depto.imagen, alt: depto.nombre }] : undefined,
    },
  };
}

export default async function PaginaDepartamento({ params }) {
  const { departamento } = await params;
  if (!pareceSeccion(departamento)) notFound();

  const productos = await getSSRProducts();
  const depto = buscarDepartamento(productos, departamento);
  if (!depto) notFound();

  const marcas = marcasDeDepartamento(productos, departamento);
  const lista = productosDeDepartamento(productos, departamento);

  // Le dice a Google dónde está parada esta página dentro de la tienda.
  const camino = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO },
      { '@type': 'ListItem', position: 2, name: depto.nombre, item: `${SITIO}/${departamento}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(camino) }} />
      <HomeClient ssrProducts={productos} modo="contenido">
      <ListadoCatalogo
        titulo={depto.nombre}
        bajada={marcas.length > 1
          ? `${lista.length} productos en ${marcas.length} marcas. Envío en 30 minutos por CABA y AMBA.`
          : 'Envío en 30 minutos por CABA y AMBA.'}
        migas={[{ texto: depto.nombre, href: null }]}
        marcas={marcas}
        slugDepartamento={departamento}
        marcaActiva={null}
        productos={lista}
      />
      </HomeClient>
    </>
  );
}
