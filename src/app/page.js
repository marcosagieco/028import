import { getSSRProducts, getSSRHomeSections, getSSRHomeLayout } from '@/lib/getProducts';
import HomeClient from './HomeClient';

// La home se regenera como máximo una vez por minuto en vez de armarse de cero en
// cada visita. El stock y los precios igual llegan en vivo por Firestore desde el
// cliente, así que esto no retrasa una actualización real.
export const revalidate = 600;

export default async function Page() {
  let ssrProducts = [], ssrHomeSections = [], ssrHomeLayout = [];
  try {
    [ssrProducts, ssrHomeSections, ssrHomeLayout] = await Promise.all([
      getSSRProducts(),
      getSSRHomeSections(),
      getSSRHomeLayout(),
    ]);
  } catch (err) {
    console.error('[Page] SSR fetch falló totalmente, renderizando con arrays vacíos:', err.message);
  }
  return (
    <HomeClient
      ssrProducts={ssrProducts}
      ssrHomeSections={ssrHomeSections}
      ssrHomeLayout={ssrHomeLayout}
    />
  );
}
