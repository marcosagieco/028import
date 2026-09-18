import { createHmac, timingSafeEqual } from 'node:crypto';

// El "pase" que le damos al panel cuando entra con el código correcto.
//
// Sirve para que /api/revalidar sepa que el pedido viene del panel y no de
// cualquiera. No podemos verificar el token de Firebase del lado del servidor
// —firebase-admin/auth es el módulo que reventaba en Vercel, por eso el login
// firma el token a mano—, así que usamos algo más simple y suficiente: una firma
// nuestra, con vencimiento.
//
// Lo que protege esto no es un secreto: es el gasto. Sin firma, cualquiera podría
// pedirle al sitio que rehaga páginas y hacernos leer la base miles de veces.

const VIGENCIA_MS = 12 * 60 * 60 * 1000;   // medio día: lo que dura una sesión del panel

/** La clave con la que firmamos. La privada de Firebase tiene mucha más entropía
 *  que el código de acceso, así que se prefiere esa cuando está. */
function clave() {
  const secreto = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.ADMIN_CODE;
  return secreto ? `pase-admin-028:${secreto}` : null;
}

const aBase64url = (dato) =>
  Buffer.from(dato).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function firmar(cuerpo) {
  return createHmac('sha256', clave()).update(cuerpo).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Crea un pase nuevo. Devuelve null si el servidor no tiene con qué firmarlo. */
export function crearPase() {
  if (!clave()) return null;
  const cuerpo = aBase64url(JSON.stringify({ vence: Date.now() + VIGENCIA_MS }));
  return `${cuerpo}.${firmar(cuerpo)}`;
}

/** Dice si un pase es nuestro y sigue vigente. Nunca lanza. */
export function paseValido(pase) {
  try {
    if (!clave() || typeof pase !== 'string') return false;
    const [cuerpo, firma] = pase.split('.');
    if (!cuerpo || !firma) return false;

    // Comparación de tiempo constante: que el tiempo de respuesta no delate
    // cuántos caracteres de la firma acertó quien esté probando.
    const esperada = Buffer.from(firmar(cuerpo));
    const recibida = Buffer.from(firma);
    if (esperada.length !== recibida.length) return false;
    if (!timingSafeEqual(esperada, recibida)) return false;

    const { vence } = JSON.parse(Buffer.from(cuerpo.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    return typeof vence === 'number' && Date.now() < vence;
  } catch {
    return false;
  }
}
