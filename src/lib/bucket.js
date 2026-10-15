import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// La app de firebaseAdmin.js sólo inicializa Firestore; para Storage hace falta una
// propia con storageBucket configurado.
export function getBucket() {
  const app = getApps().find(a => a.name === 'storage') || initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  }, 'storage');
  return getStorage(app).bucket();
}

/** Link temporal para ver un archivo privado. 7 días es el máximo que permite Google. */
export async function linkTemporal(ruta, dias = 7) {
  const [url] = await getBucket().file(ruta).getSignedUrl({
    action: 'read',
    expires: Date.now() + dias * 24 * 60 * 60 * 1000,
  });
  return url;
}
