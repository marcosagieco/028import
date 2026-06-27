import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let _adminDb = null;
let _initAttempted = false;

export function getAdminDb() {
  if (_initAttempted) return _adminDb;
  _initAttempted = true;
  try {
    const app = getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey:  (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
          }),
        });
    _adminDb = getFirestore(app);
  } catch (err) {
    console.error('[Firebase Admin] init falló:', err.message);
  }
  return _adminDb;
}
