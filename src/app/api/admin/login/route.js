import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Comparación que tarda lo mismo acierte o no, para que no se pueda adivinar
// el código midiendo tiempos de respuesta.
function sonIguales(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// Freno simple contra fuerza bruta: 8 intentos fallidos por IP cada 10 minutos.
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

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

  if (demasiadosIntentos(ip)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Esperá 10 minutos.' },
      { status: 429 }
    );
  }

  const esperado = process.env.ADMIN_CODE;
  if (!esperado) {
    console.error('[admin/login] Falta la variable de entorno ADMIN_CODE');
    return NextResponse.json({ error: 'El acceso no está configurado en el servidor.' }, { status: 500 });
  }

  let codigo = '';
  try {
    codigo = (await request.json())?.codigo ?? '';
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  if (!sonIguales(codigo, esperado)) {
    registrarFallo(ip);
    return NextResponse.json({ error: 'Código incorrecto' }, { status: 401 });
  }

  const auth = getAdminAuth();
  if (!auth) {
    return NextResponse.json({ error: 'No se pudo validar contra Firebase.' }, { status: 500 });
  }

  try {
    // Sesión real de Firebase con el permiso de admin adentro. Las reglas de
    // Firestore validan ese permiso del lado del servidor de Google, así que no
    // alcanza con trucar nada en el navegador.
    const token = await auth.createCustomToken('panel_028', { admin: true });
    return NextResponse.json({ token });
  } catch (err) {
    console.error('[admin/login] createCustomToken falló:', err.message);
    return NextResponse.json({ error: 'No se pudo crear la sesión.' }, { status: 500 });
  }
}
