// Arregla un error de optimizar-imagenes.mjs: al recomprimir y volver a subir cada
// foto, se perdió el permiso de lectura pública que sí tenían desde la migración.
// Esto vuelve a marcar como público cada archivo bajo productos/.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const app = getApps().find(a => a.name === 'arreglo') || initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  }),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
}, 'arreglo');
const bucket = getStorage(app).bucket();

const [archivos] = await bucket.getFiles({ prefix: 'productos/' });
console.log(`${archivos.length} archivos en productos/`);

let ok = 0, fallidos = 0;
for (const archivo of archivos) {
  try {
    await archivo.makePublic();
    ok++;
  } catch (err) {
    fallidos++;
    console.log('  FALLA', archivo.name, err.message);
  }
}
console.log(`\nvueltos a hacer públicos: ${ok}, fallidos: ${fallidos}`);
process.exit(0);
