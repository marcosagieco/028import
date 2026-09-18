import { notFound } from 'next/navigation';
import { getSSRProducts } from '@/lib/getProducts';
import {
  departamentosDelCatalogo,
  buscarDepartamento,
  marcasDeDepartamento,
  buscarMarca,
  productosDeMarca,
  pareceSeccion,
} from '@/lib/catalogo';
import ListadoCatalogo from '@/components/ListadoCatalogo';
import HomeClient from '@/app/HomeClient';

// Cada marca dentro de un departamento: 028import.com/vapes/elfbar-ice-king.
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
    const paginas = [];
    for (const d of departamentosDelCatalogo(productos)) {
      for (const m of marcasDeDepartamento(productos, d.slug)) {
        paginas.push({ departamento: d.slug, marca: m.slug });
      }
    }
    return paginas;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { departamento, marca } = await params;
  if (!pareceSeccion(departamento) || !pareceSeccion(marca)) return { title: 'Marca no encontrada' };

  const productos = await getSSRProducts();
  const depto = buscarDepartamento(productos, departamento);
  const laMarca = depto ? buscarMarca(productos, departamento, marca) : null;
  if (!laMarca) return { title: 'Marca no encontrada' };

  const descripcion = `${laMarca.cantidad} productos de ${laMarca.nombre} en 028 Import. Envío en 30 minutos por CABA y AMBA.`;

  return {
    title: `${laMarca.nombre} — ${depto.nombre}`,
    description: descripcion.slice(0, 160),
    alternates: { canonical: `/${departamento}/${marca}` },
    openGraph: {
      type: 'website',
      locale: 'es_AR',
      url: `${SITIO}/${departamento}/${marca}`,
      siteName: '028 Import',
      title: `${laMarca.nombre} — 028 Import`,
      description: descripcion.slice(0, 200),
      images: laMarca.imagen ? [{ url: laMarca.imagen, alt: laMarca.nombre }] : undefined,
    },
  };
}

export default async function PaginaMarca({ params }) {
  const { departamento, marca } = await params;
  if (!pareceSeccion(departamento) || !pareceSeccion(marca)) notFound();

  const productos = await getSSRProducts();
  const depto = buscarDepartamento(productos, departamento);
  if (!depto) notFound();

  const laMarca = buscarMarca(productos, departamento, marca);
  if (!laMarca) notFound();

  const marcas = marcasDeDepartamento(productos, departamento);
  const lista = productosDeMarca(productos, departamento, marca);

  const camino = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO },
      { '@type': 'ListItem', position: 2, name: depto.nombre, item: `${SITIO}/${departamento}` },
      { '@type': 'ListItem', position: 3, name: laMarca.nombre, item: `${SITIO}/${departamento}/${marca}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(camino) }} />
      <HomeClient ssrProducts={productos} modo="contenido">
      <ListadoCatalogo
        titulo={laMarca.nombre}
        bajada={`${lista.length} ${lista.length === 1 ? 'producto' : 'productos'} de ${laMarca.nombre}. Envío en 30 minutos por CABA y AMBA.`}
        migas={[
          { texto: depto.nombre, href: `/${departamento}` },
          { texto: laMarca.nombre, href: null },
        ]}
        marcas={marcas}
        slugDepartamento={departamento}
        marcaActiva={marca}
        productos={lista}
      />
      </HomeClient>
    </>
  );
}
