// Comprime las fotos de producto que ya viven en Firebase Storage (después de
// migrar-imagenes.mjs). No las trae de ningún lado externo: lee y escribe
// directo en el mismo bucket, así que no depende de la conexión a hosts de
// terceros.
//
// Por qué hace falta: las fotos migradas venían de i.ibb.co / i.postimg.cc tal
// como estaban, sin comprimir. Algunas de 600x600 pesaban 300KB; las más
// grandes (hasta 1424x1105) llegaban a pesar casi 3MB. Para una foto de
// producto eso es entre 10 y 40 veces más de lo necesario.
//
// Qué hace, por cada imagen:
//   1. La descarga del bucket (no de internet: es la misma infraestructura).
//   2. Si mide más de 1000px de lado, la achica a 1000px (de sobra para verse
//      nítida incluso en pantallas de alta densidad).
//   3. La recomprime, MANTENIENDO el mismo formato que ya tenía (un PNG sigue
//      siendo PNG, un JPEG sigue siendo JPEG). Esto es a propósito: cambiar de
//      formato podría romper la vista previa cuando alguien comparte el link
//      del producto por WhatsApp o Instagram, que a veces no procesan bien un
//      formato inesperado.
//   4. La vuelve a subir en el MISMO lugar (misma dirección web). No hace
//      falta tocar la base de datos: el producto sigue apuntando a la misma
//      URL, que ahora pesa mucho menos.
//
// Se salta lo que ya está liviano (menos de 120KB): no tiene sentido gastar
// tiempo volviendo a comprimir algo que ya está bien.
//
// Uso:
//   node optimizar-imagenes.mjs           — comprime de verdad
//   node optimizar-imagenes.mjs --probar  — sólo informa cuánto ahorraría,
//                                           sin subir nada

import { getAdminDb } from './src/lib/firebaseAdmin.js';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import sharp from 'sharp';
import fs from 'node:fs';

const SOLO_PROBAR = process.argv.includes('--probar');
const ARCHIVO_PROGRESO = './optimizacion-imagenes-progreso.json';
const LADO_MAXIMO = 1000;
const YA_ESTA_LIVIANA_KB = 120;

function cargarProgreso() {
  try { return JSON.parse(fs.readFileSync(ARCHIVO_PROGRESO, 'utf8')); }
  catch { return { hechas: {} }; }   // ruta del archivo -> { antesKB, despuesKB }
}
function guardarProgreso(p) { fs.writeFileSync(ARCHIVO_PROGRESO, JSON.stringify(p, null, 2)); }

/** Recomprime manteniendo el formato de entrada. */
async function comprimir(buffer, formato) {
  const base = sharp(buffer).resize({
    width: LADO_MAXIMO, height: LADO_MAXIMO, fit: 'inside', withoutEnlargement: true,
  });
  switch (formato) {
    case 'png':  return base.png({ compressionLevel: 9, palette: true, quality: 88, effort: 8 }).toBuffer();
    case 'jpeg': return base.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    case 'webp': return base.webp({ quality: 82, effort: 6 }).toBuffer();
    case 'gif':  return base.gif().toBuffer();
    default:     return base.toBuffer();
  }
}

async function main() {
  const db = getAdminDb();
  if (!db) { console.error('No se pudo conectar a Firestore.'); process.exit(1); }

  const appStorage = getApps().find(a => a.name === 'optimizacion-imagenes') || initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  }, 'optimizacion-imagenes');
  const bucket = getStorage(appStorage).bucket();

  const productos = (await db.collection('products').get()).docs
    .map(d => d.data())
    .filter(p => p.isDeleted !== true && p.image && p.image.includes('storage.googleapis.com'));

  // Una URL puede repetirse en dos productos (mismo sabor, dos marcas): se
  // comprime una sola vez.
  const rutasUnicas = new Map();   // ruta en el bucket -> nombre de ejemplo
  for (const p of productos) {
    const ruta = decodeURIComponent(new URL(p.image).pathname.split('/').slice(2).join('/'));
    if (!rutasUnicas.has(ruta)) rutasUnicas.set(ruta, p.name);
  }
  console.log(`${rutasUnicas.size} imágenes distintas para revisar.\n`);

  const progreso = cargarProgreso();
  let comprimidas = 0, yaLivianas = 0, saltadas = 0, fallidas = 0;
  let kbAntes = 0, kbDespues = 0;

  let i = 0;
  for (const [ruta, nombre] of rutasUnicas) {
    i++;
    const etiqueta = `[${i}/${rutasUnicas.size}]`;

    if (progreso.hechas[ruta]) {
      const h = progreso.hechas[ruta];
      kbAntes += h.antesKB; kbDespues += h.despuesKB;
      saltadas++;
      continue;
    }

    try {
      const archivo = bucket.file(ruta);
      const [buffer] = await archivo.download();
      const antesKB = buffer.length / 1024;

      if (antesKB <= YA_ESTA_LIVIANA_KB) {
        yaLivianas++;
        progreso.hechas[ruta] = { antesKB, despuesKB: antesKB, saltada: true };
        guardarProgreso(progreso);
        console.log(`${etiqueta} ya está liviana (${antesKB.toFixed(0)}KB)  ${nombre}`);
        continue;
      }

      const meta = await sharp(buffer).metadata();
      const nuevo = await comprimir(buffer, meta.format);
      const despuesKB = nuevo.length / 1024;

      if (SOLO_PROBAR) {
        console.log(`${etiqueta} ${antesKB.toFixed(0)}KB -> ${despuesKB.toFixed(0)}KB  (${meta.width}x${meta.height} ${meta.format})  ${nombre}`);
      } else {
        // Sólo se sube si de verdad mejora; si por algún motivo la nueva
        // pesara más, se deja el original tal cual.
        if (despuesKB < antesKB) {
          await archivo.save(nuevo, {
            metadata: { contentType: `image/${meta.format}`, cacheControl: 'public, max-age=31536000, immutable' },
          });
          console.log(`${etiqueta} OK  ${antesKB.toFixed(0)}KB -> ${despuesKB.toFixed(0)}KB  ${nombre}`);
        } else {
          console.log(`${etiqueta} sin cambios (ya era chica)  ${nombre}`);
        }
      }

      progreso.hechas[ruta] = { antesKB, despuesKB: Math.min(antesKB, despuesKB) };
      guardarProgreso(progreso);
      kbAntes += antesKB; kbDespues += Math.min(antesKB, despuesKB);
      comprimidas++;
    } catch (err) {
      fallidas++;
      console.log(`${etiqueta} FALLA  ${nombre}: ${err.message}`);
    }
  }

  console.log('\n--- resumen ---');
  console.log('comprimidas ahora:', comprimidas);
  console.log('ya livianas (sin tocar):', yaLivianas);
  console.log('ya procesadas antes (saltadas):', saltadas);
  console.log('fallidas:', fallidas);
  console.log(`peso total: ${(kbAntes/1024).toFixed(1)}MB -> ${(kbDespues/1024).toFixed(1)}MB`);
  if (kbAntes > 0) console.log(`ahorro: ${(100 - (kbDespues/kbAntes)*100).toFixed(0)}%`);

  process.exit(0);
}

main().catch(err => { console.error('Error general:', err); process.exit(1); });
