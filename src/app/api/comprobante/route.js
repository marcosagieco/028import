import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { createHash, timingSafeEqual } from 'node:crypto';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getBucket, linkTemporal } from '@/lib/bucket';

// El cliente sube acá el comprobante de transferencia de un pedido recién hecho.
//
// El archivo queda PRIVADO en Storage: un comprobante muestra nombre, CBU y montos
// del cliente, así que nunca se publica con un link permanente. Lo que se devuelve
// es un link temporal (7 días) que viaja en el mensaje de WhatsApp; después, el
// panel genera uno nuevo cada vez que se lo pide (ver /api/comprobante/ver).
//
// Solo puede subir comprobante quien tiene el comprobanteToken del pedido, que
// /api/pedidos le devuelve únicamente a quien lo acaba de crear.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PESO_MAXIMO_MB = 10;
const TIPOS_OK = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

const golpes = new Map();
const VENTANA_MS = 60 * 1000;
const MAX_POR_MINUTO = 10;
function demasiados(ip) {
  const ahora = Date.now();
  const r = golpes.get(ip);
  if (!r || ahora - r.desde > VENTANA_MS) { golpes.set(ip, { desde: ahora, cuantos: 1 }); return false; }
  r.cuantos += 1;
  return r.cuantos > MAX_POR_MINUTO;
}

function mismoToken(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length > 0 && x.length === y.length && timingSafeEqual(x, y);
}

/** Achica la foto lo justo para que pese poco sin dejar de leerse bien. Un PDF va
 *  tal cual. Si sharp no puede leer la imagen (ej. HEIC de iPhone), se guarda la
 *  original: es preferible un archivo pesado a perder el comprobante. */
async function preparar(buffer, tipo) {
  if (tipo === 'application/pdf') return { buffer, ext: 'pdf', contentType: tipo };
  try {
    const salida = await sharp(buffer).rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    return { buffer: salida, ext: 'jpg', contentType: 'image/jpeg' };
  } catch {
    const ext = tipo.split('/')[1] || 'bin';
    return { buffer, ext, contentType: tipo };
  }
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (demasiados(ip)) {
    return NextResponse.json({ ok: false, error: 'Demasiados intentos, esperá un minuto.' }, { status: 429 });
  }

  let form;
  try { form = await request.formData(); } catch {
    return NextResponse.json({ ok: false, error: 'Pedido inválido.' }, { status: 400 });
  }

  const orderId = String(form.get('orderId') || '');
  const token = form.get('token');
  const archivo = form.get('archivo');

  if (!orderId || !archivo || typeof archivo === 'string') {
    return NextResponse.json({ ok: false, error: 'Falta el comprobante.' }, { status: 400 });
  }
  if (!TIPOS_OK.includes(archivo.type)) {
    return NextResponse.json({ ok: false, error: 'El comprobante tiene que ser una foto o un PDF.' }, { status: 400 });
  }
  if (archivo.size > PESO_MAXIMO_MB * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: `El archivo pesa más de ${PESO_MAXIMO_MB}MB.` }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    if (!db) return NextResponse.json({ ok: false, error: 'No se pudo conectar.' }, { status: 500 });

    const ref = db.collection('orders').doc(orderId);
    const snap = await ref.get();
    if (!snap.exists || !mismoToken(snap.data().comprobanteToken, token)) {
      return NextResponse.json({ ok: false, error: 'Pedido inválido.' }, { status: 403 });
    }
    if (snap.data().comprobantePath) {
      return NextResponse.json({ ok: false, error: 'Este pedido ya tiene comprobante.' }, { status: 409 });
    }

    const { buffer, ext, contentType } = await preparar(Buffer.from(await archivo.arrayBuffer()), archivo.type);
    const hash = createHash('sha1').update(buffer).digest('hex').slice(0, 12);
    const ruta = `comprobantes/${orderId}/${hash}.${ext}`;

    await getBucket().file(ruta).save(buffer, { metadata: { contentType } });
    await ref.update({ comprobantePath: ruta, comprobanteSubidoEn: new Date() });

    return NextResponse.json({ ok: true, url: await linkTemporal(ruta) });
  } catch (err) {
    console.error('[api/comprobante] error:', err);
    return NextResponse.json({ ok: false, error: 'No se pudo subir el comprobante.' }, { status: 500 });
  }
}
