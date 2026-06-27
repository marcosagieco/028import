import { getSSRProducts, getSSRHomeSections, getSSRHomeLayout } from '@/lib/getProducts';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

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
