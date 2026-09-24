import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

// Opiniones libres para el inicio: cualquiera puede dejar la suya, no hace falta
// haber comprado. Por eso, a diferencia de /api/resenas (que verifica un pedido
// real), acá lo único que protege de spam es que:
//   1) queda "aprobado: false" hasta que alguien del panel la revisa a mano,
//   2) hay un límite de cuántas puede mandar la misma IP por minuto.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const golpes = new Map();
const VENTANA_MS = 60 * 1000;
const MAX_POR_MINUTO = 5;
function demasiados(ip) {
  const ahora = Date.now();
  const r = golpes.get(ip);
  if (!r || ahora - r.desde > VENTANA_MS) { golpes.set(ip, { desde: ahora, cuantos: 1 }); return false; }
  r.cuantos += 1;
  return r.cuantos > MAX_POR_MINUTO;
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (demasiados(ip)) {
    return NextResponse.json({ ok: false, error: 'Demasiados intentos, probá en un rato.' }, { status: 429 });
  }

  let cuerpo;
  try { cuerpo = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const { name, rating, text } = cuerpo || {};
  const puntaje = Math.round(Number(rating));
  const texto = String(text || '').trim();
  if (!puntaje || puntaje < 1 || puntaje > 5 || !texto) {
    return NextResponse.json({ ok: false, error: 'Faltan datos.' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    if (!db) return NextResponse.json({ ok: false }, { status: 500 });

    await db.collection('comentarios_home').add({
      name: String(name || '').trim().slice(0, 60) || 'Cliente',
      rating: puntaje,
      text: texto.slice(0, 500),
      aprobado: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/opiniones] error:', err);
    return NextResponse.json({ ok: false, error: 'Error en el servidor.' }, { status: 500 });
  }
}
