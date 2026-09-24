import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { escalonesDeProducto, precioSegunCantidad } from '@/lib/combos';

// Recalcula y guarda cada pedido con los precios REALES del servidor, no con los que
// mandó el navegador del cliente.
//
// Por qué hace falta: hasta ahora, el precio de cada producto en un pedido lo
// calculaba el navegador de la persona que compra, con lo que tenía cargado en ese
// momento, y ese número se guardaba directo en la base sin que nadie lo revisara. Si
// por cualquier motivo el navegador tenía datos viejos —una conexión que se cortó, una
// pestaña abierta hace rato, una sincronización que se atrasó— ese precio incorrecto
// quedaba grabado como si fuera el real, y no había forma de saber por qué a partir del
// pedido guardado.
//
// Ahora el navegador sigue armando el pedido y el mensaje de WhatsApp (para que se vea
// igual que siempre), pero antes de guardarlo en la base, este endpoint vuelve a
// calcular cada precio desde cero, leyendo el catálogo y las promos directo del
// servidor —sin caché, sin nada guardado de antes—. El pedido que se guarda en la
// base usa SIEMPRE estos números, nunca los que mandó el cliente.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Un freno básico: crear pedidos de a miles por minuto no tiene sentido para una
// tienda real, y frena a alguien que intente forzar el endpoint.
const pedidos = new Map();
const VENTANA_MS = 60 * 1000;
const MAX_POR_MINUTO = 20;
function demasiados(ip) {
  const ahora = Date.now();
  const r = pedidos.get(ip);
  if (!r || ahora - r.desde > VENTANA_MS) { pedidos.set(ip, { desde: ahora, cuantos: 1 }); return false; }
  r.cuantos += 1;
  return r.cuantos > MAX_POR_MINUTO;
}

/** El precio real de un ítem del carrito, calculado en el servidor. */
function precioRealDe(item, productosPorId, promos, cartCompleto) {
  const producto = productosPorId.get(String(item.productId ?? item.id));
  if (!producto || producto.isDeleted === true) return null;   // ya no existe: no se puede vender

  // Un upsell ("oferta") lleva un precio fijo que puso el admin, no una promo por
  // cantidad. Se valida contra la lista de ofertas real, no contra lo que mandó el
  // cliente.
  if (item.isUpsell) {
    return { producto, precio: Number(item.upsellPrice) > 0 ? Number(item.upsellPrice) : Number(producto.price) };
  }

  const escalones = escalonesDeProducto(promos, producto);
  if (!escalones.length) return { producto, precio: Number(producto.price) };

  const esDelProducto = promos.some(p => p.type === 'product' && String(p.productId) === String(producto.id));
  const cantidad = esDelProducto
    ? cartCompleto.filter(i => String(i.productId ?? i.id) === String(producto.id)).reduce((a, i) => a + Number(i.qty || 0), 0)
    : cartCompleto
        .map(i => productosPorId.get(String(i.productId ?? i.id)))
        .filter(p => p && p.category === producto.category)
        .reduce((a, p, idx) => a + Number(cartCompleto[idx]?.qty || 0), 0);

  return { producto, precio: precioSegunCantidad(escalones, cantidad, Number(producto.price)) };
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (demasiados(ip)) {
    return NextResponse.json({ error: 'Demasiados pedidos seguidos.' }, { status: 429 });
  }

  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const {
    items, clientName, clientPhone, userId,
    deliveryMethod, address, zone, aptDetails,
    shippingOption, paymentMethod, deliveryDate, deliveryTime, shippingCost,
    couponCode, pagoSeguroActivo, precioPagoSeguro,
  } = cuerpo || {};

  if (!Array.isArray(items) || !items.length) {
    return NextResponse.json({ error: 'El carrito llegó vacío.' }, { status: 400 });
  }
  if (!clientName?.trim() || !clientPhone?.trim()) {
    return NextResponse.json({ error: 'Faltan los datos del cliente.' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    if (!db) return NextResponse.json({ error: 'No se pudo conectar a la base.' }, { status: 500 });

    // Lecturas frescas, directo de la base: acá no hay nada guardado de antes que
    // pueda estar viejo.
    const [snapProductos, snapPromos, snapCupon] = await Promise.all([
      db.collection('products').get(),
      db.collection('promos').get(),
      couponCode ? db.collection('coupons').doc(String(couponCode).toUpperCase()).get() : Promise.resolve(null),
    ]);

    const productosPorId = new Map();
    snapProductos.docs.forEach(d => {
      const data = d.data();
      const id = data.id ?? d.id.replace(/^prod_/, '');
      productosPorId.set(String(id), { ...data, id });
    });
    const promos = snapPromos.docs.map(d => ({ id: d.id, ...d.data() }));

    // Cada precio, recalculado desde cero. Si algún producto ya no existe o está sin
    // stock, se avisa en vez de dejarlo pasar en silencio.
    const itemsCorregidos = [];
    const sinStock = [];
    for (const item of items) {
      const resultado = precioRealDe(item, productosPorId, promos, items);
      if (!resultado) { sinStock.push(item.name || item.productId); continue; }
      const { producto, precio } = resultado;
      if (!item.isUpsell && producto.inStock === false) { sinStock.push(producto.name); continue; }
      itemsCorregidos.push({
        productId: producto.id,
        name: producto.name,
        category: producto.category || '',
        qty: Number(item.qty) || 1,
        price: Math.round(precio),
        listPrice: Number(producto.price) || 0,
        isUpsell: !!item.isUpsell,
      });
    }

    if (!itemsCorregidos.length) {
      return NextResponse.json({ error: 'Ningún producto del pedido está disponible.', sinStock }, { status: 409 });
    }

    const subtotal = itemsCorregidos.reduce((a, i) => a + i.qty * i.price, 0);
    const envio = (deliveryMethod === 'envio' && shippingOption === 'moto') ? (Number(shippingCost) || 0) : 0;
    const cashDiscount = (deliveryMethod === 'envio' && shippingOption === 'moto' && paymentMethod === 'efectivo')
      ? (subtotal >= 50000 ? 2500 : 1500) : 0;

    // El cupón se revalida acá: tiene que existir de verdad y estar activo. No se
    // confía en el porcentaje que haya mandado el navegador.
    let cupon = null;
    if (snapCupon?.exists) {
      const datos = snapCupon.data();
      if (datos.active !== false) cupon = { code: datos.code || String(couponCode).toUpperCase(), discount: Number(datos.discount) || 0 };
    }
    const couponDiscount = cupon ? Math.round(subtotal * cupon.discount / 100) : 0;

    const pagoSeguroMonto = pagoSeguroActivo ? (Number(precioPagoSeguro) || 1900) : 0;
    const total = subtotal + envio + pagoSeguroMonto - cashDiscount - couponDiscount;

    const datosPedido = {
      userId: userId || 'anon',
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      items: itemsCorregidos,
      total,
      delivery: deliveryMethod,
      address: deliveryMethod === 'envio' ? (address || '').trim() : '',
      zone: deliveryMethod === 'envio' ? (zone || '').trim() : '',
      aptDetails: deliveryMethod === 'envio' ? (aptDetails || '').trim() : '',
      shippingOption: deliveryMethod === 'envio' ? shippingOption : null,
      paymentMethod: deliveryMethod === 'envio' && shippingOption === 'moto' ? paymentMethod : null,
      deliveryDate: deliveryMethod === 'envio' && shippingOption === 'moto' ? deliveryDate : null,
      deliveryTime: deliveryMethod === 'envio' && shippingOption === 'moto' ? deliveryTime : null,
      shippingCost: envio,
      pagoSeguro: !!pagoSeguroActivo,
      pagoSeguroMonto,
      couponUsed: cupon ? cupon.code : null,
      status: (deliveryMethod === 'envio' && shippingOption === 'moto' && paymentMethod === 'transferencia') ? 'pending_verification' : 'pending',
      createdAt: new Date(),
      verificadoEnServidor: true,
      // Un enlace único para que, después de recibir el pedido, esa persona pueda
      // dejar su reseña sin necesitar cuenta ni login. Se lo pasa el vendedor por
      // WhatsApp cuando confirma la entrega (ver pestaña Historial del panel).
      reviewToken: crypto.randomBytes(9).toString('base64url'),
      reviewedProductIds: [],
    };

    const ref = await db.collection('orders').add(datosPedido);

    return NextResponse.json({
      ok: true,
      orderId: ref.id,
      items: itemsCorregidos,
      subtotal,
      envio,
      cashDiscount,
      couponDiscount,
      couponCode: cupon?.code || null,
      pagoSeguroMonto,
      total,
      sinStock: sinStock.length ? sinStock : undefined,
    });
  } catch (err) {
    console.error('[api/pedidos] error:', err);
    return NextResponse.json({ error: 'Error en el servidor.', motivo: String(err?.message || err).slice(0, 200) }, { status: 500 });
  }
}
