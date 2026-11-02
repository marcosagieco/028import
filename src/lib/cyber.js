// CYBER 028: del lunes 2/11 al miércoles 4/11 (hora de Argentina, UTC-3).
//
// Lo usan el navegador (contador, carrito, checkout) y /api/pedidos, que vuelve a
// decidir si el envío es gratis: el navegador sólo lo pide.
//
// Envío gratis, sólo en CABA:
//   · lanzamiento, de 00:00 a 04:00 del lunes 2: sin mínimo, pagando por transferencia
//   · el resto del Cyber: con un subtotal desde $100.000
export const CYBER_INICIO = new Date('2026-11-02T00:00:00-03:00').getTime();
export const CYBER_FIN = new Date('2026-11-05T00:00:00-03:00').getTime();
export const LANZAMIENTO_FIN = new Date('2026-11-02T04:00:00-03:00').getTime();
export const MINIMO_ENVIO_GRATIS = 100000;

export const cyberActivo = (ahora = Date.now()) => ahora >= CYBER_INICIO && ahora < CYBER_FIN;
export const enLanzamiento = (ahora = Date.now()) => ahora >= CYBER_INICIO && ahora < LANZAMIENTO_FIN;

// El miércoles 4, último día: "Últimas horas", con la cuenta regresiva al cierre.
export const ULTIMAS_HORAS = new Date('2026-11-04T00:00:00-03:00').getTime();
export const enUltimasHoras = (ahora = Date.now()) => ahora >= ULTIMAS_HORAS && ahora < CYBER_FIN;

/** Si el pedido llega al envío gratis, sin mirar todavía si es de CABA. */
export function alcanzaEnvioGratis({ subtotal, transferencia, ahora = Date.now() }) {
  if (!cyberActivo(ahora)) return false;
  if (subtotal >= MINIMO_ENVIO_GRATIS) return true;
  return enLanzamiento(ahora) && !!transferencia;
}

/** Lo que falta para el envío gratis (0 si ya llega o si no es época de Cyber). */
export function faltaParaEnvioGratis(subtotal, ahora = Date.now()) {
  if (!cyberActivo(ahora) || enLanzamiento(ahora)) return 0;
  return Math.max(0, MINIMO_ENVIO_GRATIS - (Number(subtotal) || 0));
}

/** La dirección que devuelve Google Maps es de la Ciudad de Buenos Aires. */
export function esDireccionCaba(componentes) {
  return (componentes || []).some(c =>
    c.types?.includes('administrative_area_level_1') &&
    /ciudad aut[oó]noma de buenos aires|^caba$|capital federal/i.test(c.long_name || '')
  );
}

// Link de invitación a la comunidad de WhatsApp (paso 2 del sorteo).
export const LINK_COMUNIDAD = 'https://chat.whatsapp.com/JYgkBHg7P4DLwv1V2HCZUZ';
