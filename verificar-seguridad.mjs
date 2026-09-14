// Comprueba, como visitante anónimo, que los datos de clientes quedaron cerrados
// y que la tienda sigue pudiendo leer lo que necesita.
//
//   node verificar-seguridad.mjs
//
// No escribe nada. Correlo después de deployar las reglas.
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const env = readFileSync('.env.local', 'utf8');
const v = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim().replace(/^["']|["']$/g, '');

const app = initializeApp({
  apiKey: v('NEXT_PUBLIC_FIREBASE_API_KEY'), authDomain: v('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: v('NEXT_PUBLIC_FIREBASE_PROJECT_ID'), storageBucket: v('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: v('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'), appId: v('NEXT_PUBLIC_FIREBASE_APP_ID'),
});
const db = getFirestore(app);
await signInAnonymously(getAuth(app));

// [colección, si un anónimo DEBERÍA poder leerla]
const CASOS = [
  ['orders',            false],
  ['users',             false],
  ['products',          true],
  ['promos',            true],
  ['home_sections',     true],
  ['settings',          true],
  ['upsells',           true],
  ['carritoDestacados', true],
  ['fomo',              true],
];

let fallos = 0;
console.log('Probando como visitante anónimo...\n');

for (const [col, deberiaLeer] of CASOS) {
  let pudo;
  try {
    await getDocs(query(collection(db, col), limit(1)));
    pudo = true;
  } catch {
    pudo = false;
  }
  const ok = pudo === deberiaLeer;
  if (!ok) fallos++;
  const que = deberiaLeer ? 'debe ser pública' : 'debe estar CERRADA';
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${col.padEnd(18)} ${que.padEnd(20)} -> ${pudo ? 'la lee' : 'bloqueada'}`);
}

console.log('');
if (fallos === 0) {
  console.log('TODO BIEN: los datos de clientes están cerrados y la tienda sigue funcionando.');
} else {
  console.log(`ATENCIÓN: ${fallos} comprobación(es) no dieron lo esperado. Revisá firestore.rules.`);
  process.exitCode = 1;
}
process.exit(process.exitCode || 0);
