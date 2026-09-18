import { getSSRProducts, getSSRHomeSections, getSSRHomeLayout } from '@/lib/getProducts';
import HomeClient from '../HomeClient';

// El catálogo completo, con todos sus filtros (marcas, gustos, caladas, precio y
// búsqueda), ahora tiene dirección propia. Antes era una vista escondida dentro de
// la home: no se podía compartir el enlace ni Google podía verla.
//
// Reusa el mismo componente de la tienda y le pide que arranque en el catálogo, así
// no se pierde ninguno de los filtros que ya funcionaban.
export const revalidate = 600;

export const metadata = {
  title: 'Catálogo completo',
  description: 'Todo el catálogo de 028 Import: vapes, productos Apple, perfumes árabes y más. Filtrá por marca, gusto, caladas y precio. Envío en 30 minutos por CABA y AMBA.',
  alternates: { canonical: '/catalogo' },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://028import.com/catalogo',
    siteName: '028 Import',
    title: 'Catálogo completo — 028 Import',
    description: 'Todo el catálogo de 028 Import, con filtros por marca, gusto, caladas y precio.',
  },
};

export default async function PaginaCatalogo() {
  let ssrProducts = [], ssrHomeSections = [], ssrHomeLayout = [];
  try {
    [ssrProducts, ssrHomeSections, ssrHomeLayout] = await Promise.all([
      getSSRProducts(),
      getSSRHomeSections(),
      getSSRHomeLayout(),
    ]);
  } catch (err) {
    console.error('[Catalogo] no se pudo leer la base:', err.message);
  }
  return (
    <HomeClient
      ssrProducts={ssrProducts}
      ssrHomeSections={ssrHomeSections}
      ssrHomeLayout={ssrHomeLayout}
      modo="catalogo"
    />
  );
}
