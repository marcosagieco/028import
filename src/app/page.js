import { getSSRProducts, getSSRHomeSections, getSSRHomeLayout } from '@/lib/getProducts';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [ssrProducts, ssrHomeSections, ssrHomeLayout] = await Promise.all([
    getSSRProducts(),
    getSSRHomeSections(),
    getSSRHomeLayout(),
  ]);
  return (
    <HomeClient
      ssrProducts={ssrProducts}
      ssrHomeSections={ssrHomeSections}
      ssrHomeLayout={ssrHomeLayout}
    />
  );
}
