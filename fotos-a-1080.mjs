// Lleva todas las fotos de producto a 1080x1080, rellenando con blanco las que no
// son cuadradas (no se recorta nada del producto).
//
// No pisa las fotos actuales: genera copias nuevas en productos-1080/ y cambia los
// productos para que apunten a ellas. Las originales quedan en el bucket, y el
// mapa viejo -> nuevo se guarda en fotos-1080-mapa.json para poder volver atrás.
//
// Uso:
//   node fotos-a-1080.mjs --muestra=CARPETA   procesa 3 fotos a CARPETA, sin tocar nada en vivo
//   node fotos-a-1080.mjs                      hace el cambio de verdad
//   node fotos-a-1080.mjs --deshacer           vuelve los productos a las fotos originales

import fs from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

for (const linea of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const i = linea.indexOf('=');
  if (i === -1) continue;
  let v = linea.slice(i + 1).trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  process.env[linea.slice(0, i).trim()] = v;
}

const LADO = 1080;
const CARPETA = 'productos-1080';
const ARCHIVO_MAPA = './fotos-1080-mapa.json';
const argMuestra = process.argv.find(a => a.startsWith('--muestra='));
const DESHACER = process.argv.includes('--deshacer');

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.split(String.fromCharCode(92) + 'n').join(String.fromCharCode(10)),
  }),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});
const db = getFirestore(app);
const bucket = getStorage(app).bucket();

const cargarMapa = () => { try { return JSON.parse(fs.readFileSync(ARCHIVO_MAPA, 'utf8')); } catch { return {}; } };
const guardarMapa = (m) => fs.writeFileSync(ARCHIVO_MAPA, JSON.stringify(m, null, 2));

/** Cuadrado de 1080, con el producto entero centrado sobre blanco. Mantiene el
 *  formato (un PNG sigue PNG) para no romper vistas previas de links compartidos. */
async function a1080(buffer) {
  const meta = await sharp(buffer).metadata();
  const formato = meta.format === 'jpg' ? 'jpeg' : meta.format;
  const base = sharp(buffer)
    .flatten({ background: '#ffffff' })
    .resize(LADO, LADO, { fit: 'contain', background: '#ffffff' });
  switch (formato) {
    case 'png':  return { buffer: await base.png({ compressionLevel: 9, palette: true, quality: 88, effort: 8 }).toBuffer(), ext: 'png', tipo: 'image/png', antes: `${meta.width}x${meta.height}` };
    case 'webp': return { buffer: await base.webp({ quality: 82, effort: 6 }).toBuffer(), ext: 'webp', tipo: 'image/webp', antes: `${meta.width}x${meta.height}` };
    default:     return { buffer: await base.jpeg({ quality: 82, mozjpeg: true }).toBuffer(), ext: 'jpg', tipo: 'image/jpeg', antes: `${meta.width}x${meta.height}` };
  }
}

async function productosConFotos() {
  const snap = await db.collection('products').get();
  return snap.docs
    .map(d => ({ ref: d.ref, ...d.data() }))
    .filter(p => p.isDeleted !== true && (p.image || (Array.isArray(p.images) && p.images.length)));
}

async function deshacer() {
  const mapa = cargarMapa();
  const inverso = Object.fromEntries(Object.entries(mapa).map(([viejo, nuevo]) => [nuevo, viejo]));
  let cambiados = 0;
  for (const p of await productosConFotos()) {
    const cambios = {};
    if (inverso[p.image]) cambios.image = inverso[p.image];
    if (Array.isArray(p.images) && p.images.some(u => inverso[u])) cambios.images = p.images.map(u => inverso[u] || u);
    if (Object.keys(cambios).length) { await p.ref.update(cambios); cambiados++; }
  }
  console.log(`Listo: ${cambiados} productos volvieron a sus fotos originales.`);
}

async function main() {
  if (DESHACER) return deshacer();

  const productos = await productosConFotos();
  const urls = [...new Set(productos.flatMap(p => [p.image, ...(Array.isArray(p.images) ? p.images : [])]).filter(Boolean))]
    .filter(u => !u.includes(`/${CARPETA}/`));

  if (argMuestra) {
    const carpeta = argMuestra.split('=')[1];
    const muestra = [];
    for (const u of urls) {
      const b = Buffer.from(await (await fetch(u)).arrayBuffer());
      const m = await sharp(b).metadata();
      if (m.width !== m.height && m.height > m.width && !muestra.some(x => x.vertical)) muestra.push({ u, b, vertical: true });
      else if (m.width !== m.height && m.width >= m.height && !muestra.some(x => x.casi)) muestra.push({ u, b, casi: true });
      else if (m.width === m.height && !muestra.some(x => x.cuadrada)) muestra.push({ u, b, cuadrada: true });
      if (muestra.length === 3) break;
    }
    for (const [i, { b }] of muestra.entries()) {
      const r = await a1080(b);
      const destino = `${carpeta}/muestra-${i + 1}.${r.ext}`;
      fs.writeFileSync(destino, r.buffer);
      console.log(`${destino}: ${r.antes} -> 1080x1080, ${Math.round(r.buffer.length / 1024)}KB`);
    }
    return;
  }

  const mapa = cargarMapa();
  let hechas = 0, fallidas = 0;
  for (const u of urls) {
    if (mapa[u]) continue;
    try {
      const r = await a1080(Buffer.from(await (await fetch(u)).arrayBuffer()));
      const ruta = `${CARPETA}/${createHash('sha1').update(u).digest('hex').slice(0, 16)}.${r.ext}`;
      const archivo = bucket.file(ruta);
      await archivo.save(r.buffer, { metadata: { contentType: r.tipo, cacheControl: 'public, max-age=31536000, immutable' } });
      await archivo.makePublic();
      mapa[u] = `https://storage.googleapis.com/${bucket.name}/${ruta}`;
      guardarMapa(mapa);
      hechas++;
      if (hechas % 20 === 0) console.log(`  ${hechas} fotos convertidas...`);
    } catch (err) {
      fallidas++;
      console.log(`  FALLÓ ${u}: ${err.message}`);
    }
  }
  console.log(`Fotos: ${hechas} convertidas, ${fallidas} fallidas.`);

  let cambiados = 0;
  for (const p of productos) {
    const cambios = {};
    if (mapa[p.image]) cambios.image = mapa[p.image];
    if (Array.isArray(p.images) && p.images.some(u => mapa[u])) cambios.images = p.images.map(u => mapa[u] || u);
    if (Object.keys(cambios).length) { await p.ref.update(cambios); cambiados++; }
  }
  console.log(`Productos actualizados: ${cambiados}. Mapa para deshacer: ${ARCHIVO_MAPA}`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
