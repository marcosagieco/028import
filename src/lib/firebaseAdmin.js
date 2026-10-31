import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let _app = null;
let _adminDb = null;
let _initAttempted = false;

function getApp() {
  if (_initAttempted) return _app;
  _initAttempted = true;
  try {
    _app = getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey:  (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
          }),
        });
  } catch (err) {
    console.error('[Firebase Admin] init falló:', err.message);
  }
  return _app;
}

export function getAdminDb() {
  if (_adminDb) return _adminDb;
  const app = getApp();
  if (!app) return null;
  _adminDb = getFirestore(app);
  return _adminDb;
}

