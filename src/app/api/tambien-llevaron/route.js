import { NextResponse } from 'next/server';
import { getComprasJuntos, tambienLlevaron } from '@/lib/juntos';

// Para el carrito: qué productos se compraron más junto con uno dado, para ordenar
// los sabores que se le sugieren. Sólo devuelve ids y cantidades, nada de pedidos.
export const runtime = 'nodejs';

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ ids: [] });
  const juntos = await getComprasJuntos();
  const ids = tambienLlevaron(juntos, id, 12).map(x => x.id);
  return NextResponse.json({ ids }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
}
