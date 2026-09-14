import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Acá NO se usa firebase-admin/auth a propósito. Ese módulo arrastra jwks-rsa, que
// a su vez hace require() de jose, que es ESM puro: en el Node de Vercel eso revienta
// con ERR_REQUIRE_ESM. Como un token de Firebase no es más que un JWT firmado con la
// clave privada de la cuenta de servicio, lo generamos acá con el crypto de Node y
// nos sacamos la dependencia entera de encima.

const AUDIENCIA = 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';

// Freno contra fuerza bruta: 8 intentos fallidos por IP cada 10 minutos.
const intentos = new Map();
const VENTANA_MS = 10 * 60 * 1000;
const MAX_INTENTOS = 8;

function demasiadosIntentos(ip) {
  const ahora = Date.now();
  const registro = intentos.get(ip);
  if (!registro || ahora - registro.desde > VENTANA_MS) {
    intentos.set(ip, { desde: ahora, fallos: 0 });
    return false;
  }
  return registro.fallos >= MAX_INTENTOS;
}

function registrarFallo(ip) {
  const r = intentos.get(ip);
  if (r) r.fallos += 1;
}

function base64url(dato) {
  return Buffer.from(dato).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function credenciales() {
  const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const clave = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  return { email, clave, completas: !!email && clave.includes('PRIVATE KEY') };
}

// Arma el token de sesión que después valida Firebase. El permiso admin va firmado
// adentro: las reglas de Firestore lo verifican del lado del servidor de Google.
async function crearTokenDeSesion(uid, permisos) {
  const { createSign } = await import('node:crypto');
  const { email, clave } = credenciales();
  const ahora = Math.floor(Date.now() / 1000);

  const cabecera = { alg: 'RS256', typ: 'JWT' };
  const cuerpo = {
    iss: email,
    sub: email,
    aud: AUDIENCIA,
    iat: ahora,
    exp: ahora + 3600,          // una hora, que es el máximo que acepta Firebase
    uid,
    claims: permisos,
  };

  const base = base64url(JSON.stringify(cabecera)) + '.' + base64url(JSON.stringify(cuerpo));
  const firma = createSign('RSA-SHA256').update(base).sign(clave);
  return base + '.' + base64url(firma);
}

// Comparación que tarda lo mismo acierte o no, para que no se pueda deducir el
// código midiendo tiempos de respuesta.
async function sonIguales(a, b) {
  const { timingSafeEqual } = await import('node:crypto');
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// Diagnóstico: dice si el servidor está en condiciones de validar. No revela el
// código ni la clave, solo si están presentes.
export async function GET() {
  const { completas } = credenciales();
  return NextResponse.json({
    admin_code_configurado: !!process.env.ADMIN_CODE,
    credenciales_firebase: completas ? 'ok' : 'faltan o están mal formadas',
  });
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

    if (demasiadosIntentos(ip)) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá 10 minutos.' }, { status: 429 });
    }

    const esperado = process.env.ADMIN_CODE;
    if (!esperado) {
      return NextResponse.json(
        { error: 'El acceso no está configurado en el servidor.', motivo: 'falta la variable ADMIN_CODE' },
        { status: 500 }
      );
    }

    let codigo = '';
    try {
      codigo = (await request.json())?.codigo ?? '';
    } catch {
      return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
    }

    if (!(await sonIguales(codigo, esperado))) {
      registrarFallo(ip);
      return NextResponse.json({ error: 'Código incorrecto' }, { status: 401 });
    }

    if (!credenciales().completas) {
      return NextResponse.json(
        { error: 'No se pudo crear la sesión.', motivo: 'faltan las credenciales de Firebase' },
        { status: 500 }
      );
    }

    const token = await crearTokenDeSesion('panel_028', { admin: true });
    return NextResponse.json({ token });

  } catch (err) {
    console.error('[admin/login] error:', err);
    return NextResponse.json(
      { error: 'Error en el servidor.', motivo: String(err?.message || err).slice(0, 200) },
      { status: 500 }
    );
  }
}
