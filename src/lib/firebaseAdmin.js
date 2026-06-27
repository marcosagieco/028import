let _adminDb = null;

export function getAdminDb() {
  if (_adminDb) return _adminDb;
  try {
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const { getFirestore } = require('firebase-admin/firestore');

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
    return _adminDb;
  } catch (err) {
    console.error('[Firebase Admin] init falló:', err.message);
    return null;
  }
}
