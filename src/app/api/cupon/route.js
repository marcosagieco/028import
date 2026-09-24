import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

// Valida UN código de cupón por vez, sin devolver nunca la lista completa.
//
// Antes, para que el cajón "Aplicar cupón" funcionara, el navegador de cualquier
// visitante descargaba TODA la colección de cupones (activos e inactivos, con su
// porcentaje) apenas entraba a la tienda — no hacía falta ni escribir un código. Eso
// significa que cualquiera podía abrir las herramientas del navegador y sacar todos
// los cupones existentes, incluidos los que estuvieran pensados para un cliente
// puntual. Este endpoint devuelve sólo si ESE código puntual es válido, nunca el resto.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ valido: false }, { status: 400 });
  }

  const code = String(cuerpo?.code || '').trim().toUpperCase();
  if (!code) return NextResponse.json({ valido: false });

  try {
    const db = getAdminDb();
    if (!db) return NextResponse.json({ valido: false });

    const doc = await db.collection('coupons').doc(code).get();
    if (!doc.exists) return NextResponse.json({ valido: false });

    const datos = doc.data();
    if (datos.active === false) return NextResponse.json({ valido: false });

    return NextResponse.json({ valido: true, code: datos.code || code, discount: Number(datos.discount) || 0 });
  } catch (err) {
    console.error('[api/cupon] error:', err);
    return NextResponse.json({ valido: false }, { status: 500 });
  }
}
