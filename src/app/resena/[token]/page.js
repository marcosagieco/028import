import ResenaCliente from './ResenaCliente';

// Página propia, sin la barra ni el carrito: a esto llega alguien desde un enlace
// de WhatsApp después de recibir su pedido, no navegando por la tienda.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dejá tu reseña',
  robots: { index: false, follow: false },
};

export default async function PaginaResena({ params }) {
  const { token } = await params;
  return <ResenaCliente token={token} />;
}
