import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getAdminDb } from '@/lib/firebaseAdmin';

// "¿Truco o trato?" de Halloween, del lado del servidor.
//
// Para participar hay que tener cuenta (Google o email): el navegador manda el ID
// token de Firebase y acá se comprueba quién es. Cada cuenta juega UNA vez; lo que
// eligió queda anotado en halloween/{uid}, así que cerrar la página, cambiar de
// navegador o entrar desde otro celular no da otro intento.
//
// El sorteo del truco se hace acá y no en el navegador, para que no se pueda forzar
// el premio. Cada ganador recibe un código propio (TRATO-XXXXXX / TRUCO-XXXXXX) que
// se guarda como cupón de un solo uso: /api/pedidos lo desactiva al usarlo.
//
// Acciones (POST { accion }):
//   estado → lo que ya jugó esa cuenta, o null
//   trato  → 5% OFF asegurado
//   truco  → 1 de cada 5 gana 10% OFF
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FIN = new Date('2026-11-01T00:00:00-03:00').getTime();
const CHANCE_TRUCO = 0.2;
const DESCUENTO = { trato: 5, truco: 10 };
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // sin 0/O ni 1/I, que se confunden

// Quién es la cuenta se le pregunta a Google con el ID token, en lugar de usar
// firebase-admin/auth: ese módulo arrastra jwks-rsa → jose (ESM puro) y en el Node
// de Vercel revienta con ERR_REQUIRE_ESM, tirando abajo todo el servidor.
// Devuelve null si el token no sirve o es una sesión anónima.
async function cuentaDelToken(token) {
  const clave = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!clave) return null;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${clave}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
  });
  if (!r.ok) return null;
  const u = (await r.json())?.users?.[0];
  if (!u?.localId || !u.providerUserInfo?.length) return null;
  return { uid: u.localId, email: u.email || null, name: u.displayName || null };
}

function codigoNuevo(prefijo) {
  const bytes = crypto.randomBytes(6);
  let s = '';
  for (const b of bytes) s += LETRAS[b % LETRAS.length];
  return `${prefijo}-${s}`;
}

/** Lo que ve el navegador: sin datos internos. */
function respuesta(datos, cupon) {
  if (!datos) return null;
  return {
    eleccion: datos.eleccion,
    gano: !!datos.gano,
    codigo: datos.codigo || null,
    descuento: datos.descuento || 0,
    usado: cupon ? cupon.active === false : false,
  };
}

export async function POST(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'login' }, { status: 401 });

  let cuerpo;
  try { cuerpo = await request.json(); } catch { cuerpo = {}; }
  const accion = cuerpo?.accion;

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: 'No se pudo conectar a la base.' }, { status: 500 });

  // Una sesión anónima no cuenta como registro.
  let usuario = null;
  try { usuario = await cuentaDelToken(token); } catch {}
  if (!usuario) return NextResponse.json({ error: 'login' }, { status: 401 });

  const ref = db.collection('halloween').doc(usuario.uid);

  try {
    if (accion === 'estado') {
      const snap = await ref.get();
      if (!snap.exists) return NextResponse.json({ participacion: null });
      const datos = snap.data();
      const cupon = datos.codigo ? (await db.collection('coupons').doc(datos.codigo).get()).data() : null;
      return NextResponse.json({ participacion: respuesta(datos, cupon) });
    }

    if (accion !== 'trato' && accion !== 'truco') {
      return NextResponse.json({ error: 'Acción inválida.' }, { status: 400 });
    }
    if (Date.now() >= FIN) {
      return NextResponse.json({ error: 'La promo de Halloween ya terminó.' }, { status: 410 });
    }

    // En una transacción: si la misma cuenta manda dos pedidos a la vez, sólo uno juega.
    const resultado = await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (snap.exists) return { repetido: true, datos: snap.data() };

      const gano = accion === 'trato' ? true : Math.random() < CHANCE_TRUCO;
      const datos = {
        eleccion: accion,
        gano,
        codigo: null,
        descuento: 0,
        email: usuario.email || null,
        nombre: usuario.name || null,
        createdAt: new Date(),
      };
      if (gano) {
        datos.codigo = codigoNuevo(accion === 'trato' ? 'TRATO' : 'TRUCO');
        datos.descuento = DESCUENTO[accion];
        t.set(db.collection('coupons').doc(datos.codigo), {
          id: datos.codigo,
          code: datos.codigo,
          discount: datos.descuento,
          active: true,
          usoUnico: true,
          halloween: true,
          uid: usuario.uid,
          email: usuario.email || null,
          createdAt: new Date(),
        });
      }
      t.set(ref, datos);
      return { repetido: false, datos };
    });

    let cupon = null;
    if (resultado.repetido && resultado.datos.codigo) {
      cupon = (await db.collection('coupons').doc(resultado.datos.codigo).get()).data();
    }
    return NextResponse.json({ repetido: resultado.repetido, participacion: respuesta(resultado.datos, cupon) });
  } catch (err) {
    console.error('[api/halloween] error:', err);
    return NextResponse.json({ error: 'Error en el servidor.' }, { status: 500 });
  }
}
