import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Nada pesado se importa acá arriba a propósito. Si un import falla al cargarse el
// módulo, la ruta entera se cae antes de ejecutar nada y Next devuelve una página
// HTML de error que no explica qué pasó. Cargando todo adentro del handler, un
// fallo de import se vuelve un error atrapable que sí podemos reportar.

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

// Comparación que tarda lo mismo acierte o no, para que no se pueda deducir el
// código midiendo tiempos de respuesta.
async function sonIguales(a, b) {
  const { timingSafeEqual } = await import('node:crypto');
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// Diagnóstico: dice si el servidor está en condiciones de validar, sin revelar
// el código ni ningún dato. Sirve para saber qué falta sin tener que probar a ciegas.
export async function GET() {
  const estado = {
    admin_code_configurado: !!process.env.ADMIN_CODE,
    firebase_admin: 'sin probar',
  };
  try {
    const { getAdminAuth } = await import('@/lib/firebaseAdmin');
    estado.firebase_admin = getAdminAuth() ? 'ok' : 'no inicializa (revisar credenciales)';
  } catch (err) {
    estado.firebase_admin = 'falla al importar: ' + String(err?.message || err).slice(0, 200);
  }
  return NextResponse.json(estado);
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

    const { getAdminAuth } = await import('@/lib/firebaseAdmin');
    const auth = getAdminAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'No se pudo validar contra Firebase.', motivo: 'firebase-admin no inicializó' },
        { status: 500 }
      );
    }

    // Sesión real de Firebase con el permiso de admin adentro. Las reglas de
    // Firestore validan ese permiso del lado del servidor de Google, así que no
    // alcanza con trucar nada en el navegador.
    const token = await auth.createCustomToken('panel_028', { admin: true });
    return NextResponse.json({ token });

  } catch (err) {
    console.error('[admin/login] error:', err);
    return NextResponse.json(
      { error: 'Error en el servidor.', motivo: String(err?.message || err).slice(0, 200) },
      { status: 500 }
    );
  }
}
