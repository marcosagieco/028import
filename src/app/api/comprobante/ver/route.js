import { NextResponse } from 'next/server';
import { paseValido } from '@/lib/paseAdmin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { linkTemporal } from '@/lib/bucket';

// Para el panel: el link que viaja por WhatsApp vence a los 7 días, así que el
// botón "Ver comprobante" pide uno nuevo cada vez.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  let cuerpo;
  try { cuerpo = await request.json(); } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!paseValido(cuerpo?.pase)) {
    return NextResponse.json({ ok: false, error: 'Sesión de admin vencida, volvé a entrar al panel.' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snap = await db.collection('orders').doc(String(cuerpo.orderId || '')).get();
    const ruta = snap.exists ? snap.data().comprobantePath : null;
    if (!ruta) return NextResponse.json({ ok: false, error: 'Este pedido no tiene comprobante.' }, { status: 404 });
    return NextResponse.json({ ok: true, url: await linkTemporal(ruta, 1) });
  } catch (err) {
    console.error('[api/comprobante/ver] error:', err);
    return NextResponse.json({ ok: false, error: 'No se pudo abrir el comprobante.' }, { status: 500 });
  }
}
