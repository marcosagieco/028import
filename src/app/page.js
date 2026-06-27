import { getSSRProducts } from '@/lib/getProducts';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const ssrProducts = await getSSRProducts();
  return <HomeClient ssrProducts={ssrProducts} />;
}
