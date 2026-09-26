import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { paseValido } from '@/lib/paseAdmin';

// Sube una foto de producto directo desde la compu del admin a Firebase Storage,
// en vez de depender de pegar un link de un servicio externo (ImgBB, Postimage).
//
// Por qué hace falta: esos servicios gratuitos no tienen ningún compromiso de
// estar arriba. Cuando andan lentos o se caen, las fotos de producto dejan de
// cargar en la tienda y no hay nada que arreglar del lado de acá — el problema
// está en un servidor ajeno. Subiendo directo a Storage, la foto la sirve la
// misma infraestructura que ya sirve el resto del sitio.
//
// Antes de guardarla, se la redimensiona y comprime con las mismas reglas que
// usó la migración de fotos viejas (ver optimizar-imagenes.mjs): nunca más de
// 1000px de lado, que alcanza de sobra incluso para pantallas de alta densidad.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CARPETA_DESTINO = 'productos';
const LADO_MAXIMO = 1000;
const PESO_MAXIMO_MB = 15;

const golpes = new Map();
const VENTANA_MS = 60 * 1000;
const MAX_POR_MINUTO = 20;
function demasiados(ip) {
  const ahora = Date.now();
  const r = golpes.get(ip);
  if (!r || ahora - r.desde > VENTANA_MS) { golpes.set(ip, { desde: ahora, cuantos: 1 }); return false; }
  r.cuantos += 1;
  return r.cuantos > MAX_POR_MINUTO;
}

let appStorage = null;
function getBucket() {
  if (!appStorage) {
    appStorage = getApps().find(a => a.name === 'subir-imagen') || initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    }, 'subir-imagen');
  }
  return getStorage(appStorage).bucket();
}

/** Recomprime igual que optimizar-imagenes.mjs, para que las fotos nuevas pesen
 *  lo mismo que las que ya se migraron. */
async function comprimir(buffer) {
  const metadatos = await sharp(buffer).metadata();
  const formato = metadatos.format === 'jpg' ? 'jpeg' : metadatos.format;
  const base = sharp(buffer).resize({
    width: LADO_MAXIMO, height: LADO_MAXIMO, fit: 'inside', withoutEnlargement: true,
  });
  switch (formato) {
    case 'png':  return { buffer: await base.png({ compressionLevel: 9, palette: true, quality: 88, effort: 8 }).toBuffer(), ext: 'png', contentType: 'image/png' };
    case 'webp': return { buffer: await base.webp({ quality: 82, effort: 6 }).toBuffer(), ext: 'webp', contentType: 'image/webp' };
    case 'gif':  return { buffer: await base.gif().toBuffer(), ext: 'gif', contentType: 'image/gif' };
    default:     return { buffer: await base.jpeg({ quality: 80, mozjpeg: true }).toBuffer(), ext: 'jpg', contentType: 'image/jpeg' };
  }
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (demasiados(ip)) {
    return NextResponse.json({ ok: false, error: 'Demasiadas subidas seguidas, esperá un minuto.' }, { status: 429 });
  }

  let datosForm;
  try {
    datosForm = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Pedido inválido.' }, { status: 400 });
  }

  const pase = datosForm.get('pase');
  if (!paseValido(pase)) {
    return NextResponse.json({ ok: false, error: 'Sesión de admin vencida, volvé a entrar al panel.' }, { status: 401 });
  }

  const archivo = datosForm.get('archivo');
  if (!archivo || typeof archivo === 'string') {
    return NextResponse.json({ ok: false, error: 'Falta la imagen.' }, { status: 400 });
  }
  if (!archivo.type?.startsWith('image/')) {
    return NextResponse.json({ ok: false, error: 'Eso no es una imagen.' }, { status: 400 });
  }
  if (archivo.size > PESO_MAXIMO_MB * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: `La imagen pesa más de ${PESO_MAXIMO_MB}MB.` }, { status: 400 });
  }

  try {
    const bufferOriginal = Buffer.from(await archivo.arrayBuffer());
    const { buffer, ext, contentType } = await comprimir(bufferOriginal);

    // Nombre estable según el contenido: si subís la misma foto dos veces, no
    // se duplica en el bucket.
    const hash = createHash('sha1').update(buffer).digest('hex').slice(0, 16);
    const ruta = `${CARPETA_DESTINO}/${hash}.${ext}`;

    const bucket = getBucket();
    const archivoDestino = bucket.file(ruta);
    await archivoDestino.save(buffer, {
      metadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' },
    });
    await archivoDestino.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${ruta}`;
    return NextResponse.json({ ok: true, url, pesoKB: Math.round(buffer.length / 1024) });
  } catch (err) {
    console.error('[api/subir-imagen] error:', err);
    return NextResponse.json({ ok: false, error: 'No se pudo subir la imagen.' }, { status: 500 });
  }
}
