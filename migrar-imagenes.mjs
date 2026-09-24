// Migra las fotos de producto desde hosts gratuitos externos (i.ibb.co, i.postimg.cc)
// a Firebase Storage, que es la misma infraestructura que ya sirve el resto del sitio.
//
// Por qué: esos hosts gratuitos no tienen compromiso de disponibilidad. Cuando están
// lentos o caídos, las fotos de producto no cargan y no hay nada que ajustar del lado
// del sitio — el problema está en un servidor ajeno. Alojando en Firebase Storage,
// las fotos las sirve la misma infraestructura que el resto de la tienda.
//
// Cómo funciona:
//   1. Lee TODOS los productos de la base (no solo los visibles hoy: también los
//      ocultos por falta de stock, que es la mayoría del catálogo).
//   2. Para cada URL de imagen distinta (una URL puede repetirse en dos productos:
//      el mismo sabor en dos marcas), la descarga una sola vez y la sube a Storage.
//   3. Actualiza cada producto para que apunte a la nueva URL.
//   4. Guarda un registro de lo hecho, para poder reanudar si se corta a mitad de
//      camino sin descargar de nuevo lo que ya se subió.
//
// Se salta los productos borrados (isDeleted): no tiene sentido migrar fotos de algo
// que ya no existe en la tienda.
//
// Uso:
//   node migrar-imagenes.mjs           — hace la migración de verdad
//   node migrar-imagenes.mjs --probar  — no descarga ni sube nada; sólo informa
//                                        qué haría y detecta problemas de antemano

import { getAdminDb } from './src/lib/firebaseAdmin.js';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { createHash } from 'node:crypto';
import fs from 'node:fs';

const SOLO_PROBAR = process.argv.includes('--probar');
const ARCHIVO_PROGRESO = './migracion-imagenes-progreso.json';
const CARPETA_DESTINO = 'productos';

function cargarProgreso() {
  try {
    return JSON.parse(fs.readFileSync(ARCHIVO_PROGRESO, 'utf8'));
  } catch {
    return { migradas: {} };   // url vieja -> url nueva
  }
}

function guardarProgreso(progreso) {
  fs.writeFileSync(ARCHIVO_PROGRESO, JSON.stringify(progreso, null, 2));
}

/** Nombre de archivo estable a partir de la URL: la misma URL siempre da el mismo
 *  nombre, así una segunda corrida no duplica lo ya subido. */
function nombreParaUrl(url, extension) {
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 16);
  return `${CARPETA_DESTINO}/${hash}.${extension}`;
}

function extensionDe(url, contentType) {
  const deUrl = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (deUrl && /^(jpg|jpeg|png|webp|gif)$/.test(deUrl)) return deUrl === 'jpeg' ? 'jpg' : deUrl;
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('gif')) return 'gif';
  return 'jpg';
}

async function descargarConReintentos(url, intentos = 3) {
  let ultimoError;
  for (let i = 0; i < intentos; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const r = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buffer = Buffer.from(await r.arrayBuffer());
      const contentType = r.headers.get('content-type') || 'image/jpeg';
      return { buffer, contentType };
    } catch (err) {
      ultimoError = err;
      if (i < intentos - 1) await new Promise(res => setTimeout(res, 1500 * (i + 1)));
    }
  }
  throw ultimoError;
}

async function subirABucket(bucket, buffer, contentType, rutaDestino) {
  const archivo = bucket.file(rutaDestino);
  await archivo.save(buffer, {
    metadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' },
  });
  await archivo.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${rutaDestino}`;
}

async function main() {
  const db = getAdminDb();
  if (!db) { console.error('No se pudo conectar a Firestore.'); process.exit(1); }

  // Se necesita una app propia con storageBucket configurado: la de firebaseAdmin.js
  // sólo inicializa Firestore.
  const appStorage = getApps().find(a => a.name === 'migracion-imagenes') || initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  }, 'migracion-imagenes');
  const bucket = SOLO_PROBAR ? null : getStorage(appStorage).bucket();

  const snap = await db.collection('products').get();
  const productos = snap.docs
    .map(d => ({ docId: d.id, ref: d.ref, ...d.data() }))
    .filter(p => p.isDeleted !== true && p.image);

  console.log(`${productos.length} productos con foto (excluidos los borrados).`);

  // Agrupar por URL: varias marcas pueden compartir la misma foto de sabor.
  const porUrl = new Map();
  for (const p of productos) {
    if (!porUrl.has(p.image)) porUrl.set(p.image, []);
    porUrl.get(p.image).push(p);
  }
  console.log(`${porUrl.size} imágenes distintas para descargar.\n`);

  const progreso = cargarProgreso();
  let subidas = 0, reutilizadas = 0, fallidas = 0, actualizados = 0;
  const errores = [];

  let i = 0;
  for (const [urlVieja, usadaPor] of porUrl) {
    i++;
    const etiqueta = `[${i}/${porUrl.size}]`;

    let urlNueva = progreso.migradas[urlVieja];

    if (!urlNueva) {
      if (SOLO_PROBAR) {
        console.log(`${etiqueta} descargaría: ${urlVieja} (usada por ${usadaPor.length})`);
      } else {
        try {
          const { buffer, contentType } = await descargarConReintentos(urlVieja);
          const ext = extensionDe(urlVieja, contentType);
          const destino = nombreParaUrl(urlVieja, ext);
          urlNueva = await subirABucket(bucket, buffer, contentType, destino);
          progreso.migradas[urlVieja] = urlNueva;
          guardarProgreso(progreso);   // guardar tras cada foto: si se corta, no se pierde lo hecho
          subidas++;
          console.log(`${etiqueta} OK  ${(buffer.length / 1024).toFixed(0)}KB  ${usadaPor.map(p => p.name).join(', ')}`);
        } catch (err) {
          fallidas++;
          errores.push({ url: urlVieja, productos: usadaPor.map(p => p.name), error: err.message });
          console.log(`${etiqueta} FALLA  ${urlVieja}: ${err.message}`);
          continue;
        }
      }
    } else {
      reutilizadas++;
      console.log(`${etiqueta} ya migrada, reutilizando: ${usadaPor.map(p => p.name).join(', ')}`);
    }

    if (!SOLO_PROBAR && urlNueva) {
      for (const p of usadaPor) {
        await p.ref.set({ image: urlNueva, imagenOriginal: urlVieja }, { merge: true });
        actualizados++;
      }
    }
  }

  console.log('\n--- resumen ---');
  console.log('imágenes subidas ahora:', subidas);
  console.log('imágenes ya migradas (reutilizadas):', reutilizadas);
  console.log('imágenes fallidas:', fallidas);
  console.log('productos actualizados en la base:', actualizados);

  if (errores.length) {
    console.log('\nProductos que quedaron con su foto vieja (falló la descarga):');
    errores.forEach(e => console.log(`  - ${e.productos.join(', ')}: ${e.error}`));
    console.log('\nVolvé a correr el script: retoma desde donde quedó, sin repetir lo ya migrado.');
  }

  process.exit(0);
}

main().catch(err => { console.error('Error general:', err); process.exit(1); });
