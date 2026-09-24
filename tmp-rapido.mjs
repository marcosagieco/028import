import { getAdminDb } from './src/lib/firebaseAdmin.js';
const db = getAdminDb();
const ps = (await db.collection('products').get()).docs.map(d => d.data())
  .filter(p => p.isDeleted !== true && p.isHidden !== true && p.image);

const muestra = ps.slice(0, 15);
console.log('midiendo', muestra.length, 'imagenes, con limite de 8 segundos cada una...\n');
for (const p of muestra) {
  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const r = await fetch(p.image, { redirect: 'follow', signal: controller.signal });
    await r.arrayBuffer();
    clearTimeout(timer);
    const ms = Date.now() - t0;
    console.log(`  ${String(ms).padStart(5)}ms  status ${r.status}  ${p.name} (${new URL(p.image).host})`);
  } catch (e) {
    console.log(`  TIMEOUT/ERROR (${Date.now()-t0}ms)  ${p.name}: ${e.message.slice(0,50)}`);
  }
}
process.exit(0);
