// Crea las versiones livianas (WebP) de todas las fotos de producto que ya están en
// el bucket (ver src/lib/imagenWeb.js). Las fotos nuevas ya las crea el panel solo,
// así que esto se corre una vez; si se vuelve a correr, saltea las que ya existen.
//
// No toca las fotos originales ni los productos: sólo agrega archivos en web/.
//
// Uso:  node crear-fotos-web.mjs

import fs from 'node:fs';
import sharp from 'sharp';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { ANCHOS_WEB, rutaWeb } from './src/lib/imagenWeb.js';

for (const linea of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const i = linea.indexOf('=');
  if (i === -1) continue;
  let v = linea.slice(i + 1).trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  process.env[linea.slice(0, i).trim()] = v;
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.split(String.fromCharCode(92) + 'n').join(String.fromCharCode(10)),
  }),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});
const bucket = getStorage(app).bucket();

const existentes = new Set((await bucket.getFiles({ prefix: 'web/' }))[0].map(f => f.name));
const fotos = [];
for (const carpeta of ['productos/', 'productos-1080/']) {
  const [archivos] = await bucket.getFiles({ prefix: carpeta });
  fotos.push(...archivos.filter(f => /\.(png|jpe?g|webp)$/i.test(f.name)));
}

let hechas = 0, salteadas = 0, fallidas = 0, pesoAntes = 0, pesoDespues = 0;
const EN_PARALELO = 6;
const cola = [...fotos];

async function trabajar() {
  while (cola.length) {
    const archivo = cola.shift();
    const sinExtension = archivo.name.replace(/\.[^.]+$/, '');
    const faltan = ANCHOS_WEB.filter(a => !existentes.has(rutaWeb(sinExtension, a)));
    if (!faltan.length) { salteadas++; continue; }
    try {
      const [original] = await archivo.download();
      for (const ancho of faltan) {
        const buffer = await sharp(original)
          .resize({ width: ancho, height: ancho, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80, effort: 5 })
          .toBuffer();
        const destino = bucket.file(rutaWeb(sinExtension, ancho));
        await destino.save(buffer, {
          metadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' },
        });
        await destino.makePublic();
        if (ancho === 480) { pesoAntes += original.length; pesoDespues += buffer.length; }
      }
      hechas++;
      if (hechas % 25 === 0) console.log(`  ${hechas} fotos listas...`);
    } catch (err) {
      fallidas++;
      console.error('  no se pudo:', archivo.name, err.message);
    }
  }
}

console.log(`${fotos.length} fotos en el bucket.`);
await Promise.all(Array.from({ length: EN_PARALELO }, trabajar));
console.log(`Listo: ${hechas} convertidas, ${salteadas} ya estaban, ${fallidas} con error.`);
if (hechas) console.log(`Peso promedio: ${Math.round(pesoAntes / hechas / 1024)}KB la original, ${Math.round(pesoDespues / hechas / 1024)}KB la versión de 480.`);
