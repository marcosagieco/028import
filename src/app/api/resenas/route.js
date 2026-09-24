import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';

// Sostiene la página /resena/[token]: primero le dice qué productos puede
// reseñar quien tiene ese enlace (GET), después guarda lo que escribe (POST).
//
// El token es el único "login" acá: nadie puede leer ni escribir una reseña sin
// el enlace exacto de SU pedido, y ese enlace no se puede adivinar (viene de
// crypto.randomBytes, ver /api/pedidos). La colección "orders" sigue sin
// exponerse: esto lee un solo pedido por su token, con el SDK de administrador,
// nunca la lista completa.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const golpes = new Map();
const VENTANA_MS = 60 * 1000;
const MAX_POR_MINUTO = 30;
function demasiados(ip) {
  const ahora = Date.now();
  const r = golpes.get(ip);
  if (!r || ahora - r.desde > VENTANA_MS) { golpes.set(ip, { desde: ahora, cuantos: 1 }); return false; }
  r.cuantos += 1;
  return r.cuantos > MAX_POR_MINUTO;
}

async function buscarPedido(db, token) {
  if (!token || typeof token !== 'string') return null;
  const snap = await db.collection('orders').where('reviewToken', '==', token).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function GET(request) {
  const token = new URL(request.url).searchParams.get('token');
  try {
    const db = getAdminDb();
    if (!db) return NextResponse.json({ ok: false }, { status: 500 });

    const pedido = await buscarPedido(db, token);
    if (!pedido) return NextResponse.json({ ok: false, error: 'Enlace inválido.' }, { status: 404 });

    const reseñados = pedido.reviewedProductIds || [];
    return NextResponse.json({
      ok: true,
      clientName: (pedido.clientName || '').split(' ')[0] || '',
      items: (pedido.items || [])
        .filter(i => !i.isUpsell)
        .map(i => ({
          productId: String(i.productId),
          name: i.name,
          yaReseñado: reseñados.includes(String(i.productId)),
        })),
    });
  } catch (err) {
    console.error('[api/resenas GET] error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (demasiados(ip)) {
    return NextResponse.json({ ok: false, error: 'Demasiados intentos, probá en un rato.' }, { status: 429 });
  }

  let cuerpo;
  try { cuerpo = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const { token, productId, rating, name, text } = cuerpo || {};
  const puntaje = Math.round(Number(rating));
  if (!token || !productId || !puntaje || puntaje < 1 || puntaje > 5) {
    return NextResponse.json({ ok: false, error: 'Faltan datos.' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    if (!db) return NextResponse.json({ ok: false }, { status: 500 });

    const pedido = await buscarPedido(db, token);
    if (!pedido) return NextResponse.json({ ok: false, error: 'Enlace inválido.' }, { status: 404 });

    const item = (pedido.items || []).find(i => String(i.productId) === String(productId) && !i.isUpsell);
    if (!item) return NextResponse.json({ ok: false, error: 'Ese producto no es de este pedido.' }, { status: 400 });

    if ((pedido.reviewedProductIds || []).includes(String(productId))) {
      return NextResponse.json({ ok: false, error: 'Ya dejaste una reseña para ese producto.' }, { status: 409 });
    }

    await db.collection('reviews').add({
      productId: String(productId),
      productName: item.name,
      orderId: pedido.id,
      name: (String(name || '').trim().slice(0, 60)) || (pedido.clientName || '').split(' ')[0] || 'Cliente',
      rating: puntaje,
      text: String(text || '').trim().slice(0, 600),
      oculta: false,
      createdAt: new Date(),
    });

    await db.collection('orders').doc(pedido.id).update({
      reviewedProductIds: FieldValue.arrayUnion(String(productId)),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/resenas POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Error en el servidor.' }, { status: 500 });
  }
}
