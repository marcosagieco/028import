import { NextResponse } from 'next/server';
import { paseValido } from '@/lib/paseAdmin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { linkTemporal } from '@/lib/bucket';

// Para la pestaña "Comprobantes" del panel: los links (temporales, 1 día) de varios
// pedidos de una vez, para mostrarlos todos juntos sin abrir pedido por pedido.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAXIMO_POR_PEDIDO = 60;

export async function POST(request) {
  let cuerpo;
  try { cuerpo = await request.json(); } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!paseValido(cuerpo?.pase)) {
    return NextResponse.json({ ok: false, error: 'Sesión de admin vencida, volvé a entrar al panel.' }, { status: 401 });
  }

  const ids = [...new Set((Array.isArray(cuerpo.orderIds) ? cuerpo.orderIds : []).map(String).filter(Boolean))]
    .slice(0, MAXIMO_POR_PEDIDO);
  if (!ids.length) return NextResponse.json({ ok: true, links: {} });

  try {
    const db = getAdminDb();
    const snaps = await db.getAll(...ids.map(id => db.collection('orders').doc(id)));
    const links = {};
    await Promise.all(snaps.map(async (snap) => {
      const ruta = snap.exists ? snap.data().comprobantePath : null;
      if (!ruta) return;
      links[snap.id] = { url: await linkTemporal(ruta, 1), pdf: ruta.endsWith('.pdf') };
    }));
    return NextResponse.json({ ok: true, links });
  } catch (err) {
    console.error('[api/comprobante/lista] error:', err);
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar los comprobantes.' }, { status: 500 });
  }
}
