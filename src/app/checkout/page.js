import { getSSRProducts } from '@/lib/getProducts';
import HomeClient from '../HomeClient';

// La pantalla donde se completan los datos del pedido, ahora con dirección propia.
//
// Antes vivía escondida dentro de la home: se abría desde el cajón del carrito y no
// tenía dirección, así que no se podía llegar directo ni volver con el botón del
// navegador. Ahora "Comprar ahora" lleva acá desde cualquier página.
//
// No se indexa: es un paso de compra, no contenido. Y no se arma de antemano porque
// depende de lo que cada persona tenga en el carrito.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Finalizar compra',
  description: 'Completá tus datos para terminar el pedido en 028 Import.',
  robots: { index: false, follow: false },
};

export default async function PaginaCheckout() {
  let ssrProducts = [];
  try {
    ssrProducts = await getSSRProducts();
  } catch (err) {
    console.error('[checkout] no se pudo leer el catálogo:', err.message);
  }
  return <HomeClient ssrProducts={ssrProducts} modo="checkout" />;
}
