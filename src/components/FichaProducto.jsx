"use client";

// Ficha de producto, con el reparto clásico de las tiendas grandes: la foto ocupa
// la izquierda y a la derecha queda fija la columna de compra (precio, cantidad,
// botones, envío).
//
// Está pensada para verse completa con lo que hay hoy —una sola foto y, en muchos
// productos, sin descripción— y para crecer sola cuando se carguen más fotos o texto:
// la galería aparece únicamente si hay más de una imagen, y la descripción sólo si
// existe. Nada queda como un hueco vacío.

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCarrito } from '@/components/CarritoProvider';
import { rutaProducto, aSlug } from '@/lib/slug';
import { esSinGarantia, AvisoSinGarantia, IconoAlerta } from '@/components/SinGarantia';
import { fichasDeCombo, precioSegunCantidad } from '@/lib/combos';

const precioFormateado = (n) => Number(n || 0).toLocaleString('es-AR');

const POCAS_UNIDADES = 5;   // a partir de acá se avisa que queda poco

export default function FichaProducto({ producto, relacionados = [], escalones = [], puesto = null, resenas = { promedio: 0, cantidad: 0, lista: [] }, variantes = [], videosComunidad = [], compradosJuntos = [] }) {
  // Videos de la comunidad: sólo se descarga el que la persona toca para ver.
  const [videoActivo, setVideoActivo] = useState(null);
  // Los otros sabores (o modelos) de la misma marca, para cambiar sin volver atrás.
  // Se eligen en un desplegable: cerrado muestra el actual; abierto, la lista entera.
  const esVape = /vape/i.test(String(producto.department || ''));
  const [saboresAbiertos, setSaboresAbiertos] = useState(false);
  const saboresRef = useRef(null);
  useEffect(() => {
    if (!saboresAbiertos) return;
    const cerrarSiAfuera = (e) => { if (saboresRef.current && !saboresRef.current.contains(e.target)) setSaboresAbiertos(false); };
    const cerrarConEsc = (e) => { if (e.key === 'Escape') setSaboresAbiertos(false); };
    document.addEventListener('mousedown', cerrarSiAfuera);
    document.addEventListener('keydown', cerrarConEsc);
    return () => { document.removeEventListener('mousedown', cerrarSiAfuera); document.removeEventListener('keydown', cerrarConEsc); };
  }, [saboresAbiertos]);
  const { agregarAlCarrito, cambiarCantidad, cart } = useCarrito();
  const router = useRouter();
  const [avisoVisible, setAvisoVisible] = useState(false);

  const enCarrito = cart.find(i => String(i.id) === String(producto.id));
  const combos = fichasDeCombo(escalones, producto.offerPrice > 0 && producto.offerPrice < producto.price ? producto.offerPrice : producto.price);
  // Las unidades que quedan salen del panel. Si no las cargaste, no se avisa nada:
  // es preferible no decir nada antes que inventar un número.
  const unidadesRestantes = Number.isFinite(Number(producto.stockUnits)) && producto.stockUnits !== null && producto.stockUnits !== ''
    ? Number(producto.stockUnits)
    : null;
  const sinStock = producto.inStock === false;
  // La línea EB Create se vende sin garantía (ver components/SinGarantia.jsx y
  // Términos y Condiciones).
  const esEbCreate = esSinGarantia(producto);
  const conOferta = producto.offerPrice > 0 && producto.offerPrice < producto.price;
  const precio = conOferta ? producto.offerPrice : producto.price;
  const esUSD = producto.tag === 'USD';
  const simbolo = esUSD ? 'USD ' : '$';
  const descuento = conOferta ? Math.round((1 - producto.offerPrice / producto.price) * 100) : 0;

  // Qué escalón está rigiendo ahora, para marcarlo. Con el carrito vacío rige el
  // de una unidad, que es lo que pagaría si comprara ahora mismo.
  // Va acá abajo a propósito: necesita `precio`, declarado unas líneas arriba.
  const cantidadElegida = Math.max(1, enCarrito?.qty || 0);
  const precioPorCantidad = precioSegunCantidad(escalones, cantidadElegida, precio);

  // Sólo hay galería cuando hay más de una foto cargada.
  const fotos = [producto.image, ...(Array.isArray(producto.images) ? producto.images : [])]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
  const [fotoActiva, setFotoActiva] = useState(0);

  const descripcion = String(producto.description || '').trim();

  const fichaTecnica = [
    ['Marca', producto.category],
    ['Categoría', producto.department],
    producto.puffs ? ['Puffs', Number(producto.puffs).toLocaleString('es-AR')] : null,
  ].filter(Boolean);

  /**
   * Deja el carrito con exactamente esa cantidad de este producto.
   * Es lo que hace falta para elegir un combo: tocar "2+" tiene que poner 2,
   * no sumar 2 a lo que ya había.
   */
  const ponerCantidad = (cuantas) => {
    const actual = enCarrito?.qty || 0;
    if (actual === cuantas) return;
    if (actual === 0) {
      if (!agregarAlCarrito(producto)) return;   // sin stock
      if (cuantas > 1) cambiarCantidad(producto.id, cuantas - 1);
      return;
    }
    cambiarCantidad(producto.id, cuantas - actual);
  };

  /** Suma al carrito y lleva a completar los datos, sin pasos intermedios. */
  const comprarAhora = () => {
    if (!enCarrito) agregarAlCarrito(producto);
    router.push('/checkout');
  };

  const agregar = () => {
    if (!agregarAlCarrito(producto)) return;
    setAvisoVisible(true);
    setTimeout(() => setAvisoVisible(false), 2600);
  };

  // Barra de compra fija abajo: aparece cuando los botones principales no están a la
  // vista (bajaste a leer la descripción, o en el celular todavía no llegaste a
  // ellos), así comprar nunca queda a más de un toque. Mientras está, se le avisa al
  // resto de la página (data-barra-compra en <body>) para que la burbuja de WhatsApp
  // suba y no la tape.
  const botonesRef = useRef(null);
  const [barraVisible, setBarraVisible] = useState(false);
  useEffect(() => {
    const el = botonesRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entrada]) => setBarraVisible(!entrada.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, [sinStock]);
  useEffect(() => {
    if (barraVisible) document.body.dataset.barraCompra = '1';
    else delete document.body.dataset.barraCompra;
    return () => { delete document.body.dataset.barraCompra; };
  }, [barraVisible]);

  const preguntas = [
    {
      p: '¿Cuánto tarda en llegar?',
      r: 'En CABA y AMBA, con Envío Flash te llega en menos de 30 minutos (se paga por transferencia). Con motomensajería elegís el día y el turno: 15:30 o 18:30. Al resto del país lo enviamos a domicilio y lo coordinamos por WhatsApp.',
    },
    {
      p: '¿Los productos son originales?',
      r: 'Sí, 100% originales. Se entregan en su empaque de fábrica, con los sellos de seguridad del fabricante. El envío es discreto.',
    },
    {
      p: '¿Cómo pago?',
      r: 'Por transferencia o en efectivo al recibir (efectivo sólo con motomensajería). Pagando en efectivo tenés descuento.',
    },
    {
      p: '¿Qué pasa si mi pedido se pierde en el envío?',
      r: 'Al finalizar la compra podés sumar Pago Seguro por $1.900: si el pedido se pierde en el camino, te lo reenviamos o te devolvemos la plata.',
    },
    {
      p: '¿Tiene garantía?',
      r: esEbCreate
        ? 'Los modelos de la línea Elfbar EB Create se venden sin garantía: si llegan con fallas de fábrica, no tienen cambio ni devolución.'
        : 'Si el producto llega con una falla de fábrica, avisanos dentro de las 48 horas de recibirlo, con fotos o un video, y lo resolvemos. No hay cambios por gusto o sabor una vez abierto el precinto.',
    },
    {
      p: '¿Cómo hago el pedido?',
      r: 'Agregás lo que querés, completás tus datos y tocás Confirmar. Te lleva a nuestro WhatsApp con el pedido ya armado, y ahí te lo confirmamos.',
    },
  ];


  return (
    <div className="bg-[#f2f2f2]">

      <main className="w-full max-w-[1400px] mx-auto px-4 md:px-6 pt-5 md:pt-8 pb-24">

        {/* Rastro de navegación: dice dónde está parado y deja volver un nivel */}
        <nav aria-label="Ubicación" className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href="/" className="hover:text-[#111111] transition-colors">Inicio</Link>
          {producto.department && (
            <>
              <span aria-hidden="true">›</span>
              <Link href={`/${aSlug(producto.department)}`} className="hover:text-[#111111] transition-colors">
                {producto.department}
              </Link>
            </>
          )}
          {producto.category && (
            <>
              <span aria-hidden="true">›</span>
              {producto.department ? (
                <Link
                  href={`/${aSlug(producto.department)}/${aSlug(producto.category)}`}
                  className="text-gray-400 hover:text-[#111111] transition-colors"
                >
                  {producto.category}
                </Link>
              ) : (
                <span className="text-gray-400">{producto.category}</span>
              )}
            </>
          )}
        </nav>

        {/* overflow-clip y no overflow-hidden: hidden rompe el sticky de la foto. */}
        <div className="bg-white rounded-[1.5rem] shadow-[0_0_50px_rgba(0,0,0,0.05),0_0_14px_rgba(0,0,0,0.028)] overflow-clip">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_480px] xl:grid-cols-[minmax(0,1fr)_540px]">

            {/* ---------- Foto ----------
                En compu queda fija (sticky) mientras la columna de la derecha baja
                con la compra, la descripción y las preguntas. */}
            <div className="p-5 md:p-8 lg:sticky lg:top-20 lg:self-start">
              <div className="relative w-full aspect-square max-w-[640px] mx-auto bg-[#fafafa] rounded-2xl overflow-hidden">
                {fotos[fotoActiva] ? (
                  <Image
                    src={fotos[fotoActiva]}
                    alt={producto.name}
                    fill
                    sizes="(max-width: 1024px) 92vw, 560px"
                    priority
                    className="object-contain p-6"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                    <i className="fas fa-images text-5xl" aria-hidden="true"></i>
                  </div>
                )}
                {sinStock && (
                  <div className="absolute inset-0 bg-[#111111]/70 backdrop-blur-sm flex items-center justify-center">
                    <span className="bg-red-600 text-white font-bebas text-lg px-5 py-2 uppercase tracking-wider rounded-sm">Sin stock</span>
                  </div>
                )}
                {!sinStock && descuento > 0 && (
                  <span className="absolute top-4 left-4 bg-[#fcdb00] text-[#111111] font-bebas text-lg px-3 py-1 rounded-md tracking-wide">
                    {descuento}% OFF
                  </span>
                )}
              </div>

              {fotos.length > 1 && (
                <div className="flex gap-2 justify-center mt-4 flex-wrap">
                  {fotos.map((f, i) => (
                    <button
                      key={f}
                      onClick={() => setFotoActiva(i)}
                      aria-label={`Ver foto ${i + 1}`}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === fotoActiva ? 'border-[#111111]' : 'border-gray-200 hover:border-gray-400'}`}
                    >
                      <Image src={f} alt="" fill sizes="56px" className="object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ---------- Columna de compra ---------- */}
            <div className="p-5 md:p-8 lg:border-l border-gray-200">
              {producto.category && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{producto.category}</p>
              )}
              <h1 className="font-bebas text-3xl md:text-4xl uppercase tracking-wide leading-none text-[#111111] mb-3">
                {producto.name}
              </h1>

              {/* Las caladas, si el producto las tiene cargadas. La cantidad de
                  gustos se sacó: no se entendía a qué se refería. */}
              {producto.puffs && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 bg-[#111111] text-[#fcdb00] font-bebas text-sm px-2.5 py-1 rounded-md tracking-wide">
                    <i className="fas fa-wind text-[10px]" aria-hidden="true"></i> {producto.puffs} PUFFS
                  </span>
                </div>
              )}

              {/* Promedio de estrellas, sólo con reseñas de compras verificadas. */}
              {resenas.cantidad > 0 && (
                <a href="#resenas" className="flex items-center gap-1.5 mb-3 w-fit">
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <i key={n} className={`fas fa-star text-[13px] ${n <= Math.round(resenas.promedio) ? 'text-[#fcdb00]' : 'text-gray-200'}`}></i>
                    ))}
                  </span>
                  <span className="text-[11px] font-bold text-gray-500 tracking-wide">
                    {resenas.promedio.toFixed(1)} ({resenas.cantidad} reseña{resenas.cantidad === 1 ? '' : 's'})
                  </span>
                </a>
              )}

              {/* El distintivo del podio, calculado con las ventas reales. El número
                  suelto de unidades vendidas se sacó a pedido; el puesto queda. */}
              {puesto && (
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#8a6d00] mb-4">
                  <i className="fas fa-crown text-[10px]" aria-hidden="true"></i>
                  {puesto === 1 ? 'El más vendido' : `Top ${puesto}`} en {producto.category}
                </p>
              )}

              {conOferta && (
                <p className="text-gray-400 text-base line-through leading-none mb-1">
                  {simbolo}{precioFormateado(producto.price)}
                </p>
              )}
              <p className="font-bebas text-4xl md:text-5xl text-[#111111] tracking-wide leading-none mb-1">
                {simbolo}{precioFormateado(precio)}
              </p>
              {esUSD && <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Precio en dólares</p>}

              <p className={`flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest mb-5 ${sinStock ? 'text-red-500' : 'text-gray-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sinStock ? 'bg-red-500' : 'bg-green-500'}`} aria-hidden="true"></span>
                {sinStock ? 'Sin stock por ahora' : 'Disponible'}
              </p>

              {/* ---------- Sabores de la misma marca ---------- */}
              {variantes.length > 1 && (
                <div className="mb-5 relative" ref={saboresRef}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    {esVape ? 'Sabor' : 'Modelo'} · {variantes.length} opciones
                  </p>
                  {/* Cerrado: el actual, del mismo ancho que el recuadro de combos */}
                  <button
                    type="button"
                    onClick={() => setSaboresAbiertos(v => !v)}
                    aria-expanded={saboresAbiertos}
                    aria-haspopup="listbox"
                    className={`w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 bg-white transition-colors ${saboresAbiertos ? 'border-[#111111]' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    {producto.image && (
                      <span className="relative w-9 h-9 shrink-0 rounded-lg bg-[#fafafa] overflow-hidden">
                        <Image src={producto.image} alt="" fill sizes="36px" className="object-contain" />
                      </span>
                    )}
                    <span className="flex-1 text-left font-bebas text-lg uppercase tracking-wide text-[#111111] leading-none">{producto.name}</span>
                    <i className={`fas fa-chevron-down text-xs text-gray-500 transition-transform ${saboresAbiertos ? 'rotate-180' : ''}`} aria-hidden="true"></i>
                  </button>

                  {/* Abierto: la lista entera, con tilde en el actual */}
                  {saboresAbiertos && (
                    <ul role="listbox" className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] max-h-80 overflow-y-auto py-1">
                      {variantes.map(v => {
                        const actual = String(v.id) === String(producto.id);
                        return (
                          <li key={v.id} role="option" aria-selected={actual}>
                            <Link
                              href={rutaProducto(v)}
                              onClick={() => setSaboresAbiertos(false)}
                              className={`flex items-center gap-3 px-3 py-2 transition-colors ${actual ? 'bg-[#fcdb00]/15' : 'hover:bg-gray-50'} ${v.inStock ? '' : 'opacity-50'}`}
                            >
                              {v.image ? (
                                <span className="relative w-8 h-8 shrink-0 rounded-md bg-[#fafafa] overflow-hidden">
                                  <Image src={v.image} alt="" fill sizes="32px" className="object-contain" />
                                </span>
                              ) : <span className="w-8 h-8 shrink-0" />}
                              <span className="flex-1 min-w-0">
                                <span className="block font-bebas text-base uppercase tracking-wide text-[#111111] leading-tight truncate">{v.name}</span>
                                {!v.inStock && <span className="block text-[10px] font-bold uppercase tracking-widest text-red-500">Sin stock</span>}
                              </span>
                              {actual && <i className="fas fa-check text-[#8a6d00] text-xs shrink-0" aria-hidden="true"></i>}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {/* Quedan pocas. El número sale del stock cargado en el panel. */}
              {!sinStock && unidadesRestantes != null && unidadesRestantes <= POCAS_UNIDADES && (
                <div className="mb-5">
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${Math.max(8, (unidadesRestantes / POCAS_UNIDADES) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-red-500 mt-1.5">
                    {unidadesRestantes === 1 ? '¡Queda la última!' : `¡Quedan ${unidadesRestantes}!`}
                  </p>
                </div>
              )}

              {/* Combos por cantidad. Vacío por defecto: aparece sólo si cargaste
                  escalones desde el panel. */}
              {!sinStock && combos.length > 1 && (
                <div className="mb-5 border border-gray-200 rounded-xl overflow-hidden">
                  <p className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-widest px-4 py-2 border-b border-gray-200">
                    Cuantas más llevás, menos pagás
                  </p>
                  <div className="divide-y divide-gray-100">
                    {combos.map((c, i) => {
                      // Rige el escalón más alto que la cantidad elegida ya alcanzó.
                      const siguiente = combos[i + 1];
                      const activo = cantidadElegida >= c.cantidad && (!siguiente || cantidadElegida < siguiente.cantidad);
                      return (
                        <button
                          key={c.cantidad}
                          type="button"
                          onClick={() => ponerCantidad(c.cantidad)}
                          aria-pressed={activo}
                          aria-label={`Llevar ${c.cantidad} ${c.cantidad === 1 ? 'unidad' : 'unidades'}`}
                          className={`w-full text-left flex items-center gap-3 px-4 py-3 border-l-[3px] transition-colors ${activo ? 'bg-[#fcdb00]/15 border-[#fcdb00]' : 'bg-white border-transparent hover:bg-gray-50'}`}
                        >
                          <span className={`font-bebas text-2xl w-10 shrink-0 leading-none ${activo ? 'text-[#111111]' : 'text-gray-400'}`}>
                            {c.cantidad}{c.abierto ? '+' : ''}
                          </span>
                          <span className="flex-1 min-w-0">
                            {c.esBase ? (
                              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Por unidad</span>
                            ) : (
                              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                Ahorrás {simbolo}{precioFormateado(Math.round(c.ahorro))}
                              </span>
                            )}
                          </span>
                          <span className={`font-bebas text-xl tracking-wide shrink-0 ${activo ? 'text-[#111111]' : 'text-gray-500'}`}>
                            {simbolo}{precioFormateado(c.precioUnitario)}<span className={`text-[11px] font-poppins font-bold ml-1 ${activo ? 'text-[#111111]/60' : 'text-gray-400'}`}>c/u</span>
                          </span>
                          {activo && (
                            <i className="fas fa-check text-[#8a6d00] text-xs shrink-0" aria-hidden="true"></i>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Lo que va a pagar en total con lo que eligió. Sin esto hay que
                      hacer la cuenta de cabeza para saber si conviene. */}
                  {enCarrito && (
                    <p className="bg-gray-50 border-t border-gray-200 px-4 py-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                        Llevás {enCarrito.qty} {enCarrito.qty === 1 ? 'unidad' : 'unidades'}
                      </span>
                      <span className="font-bebas text-xl text-[#111111] tracking-wide">
                        {simbolo}{precioFormateado(precioPorCantidad * enCarrito.qty)}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Justo arriba de los botones: es lo último que se lee antes de comprar. */}
              {esEbCreate && (
                <div className="mb-3">
                  <AvisoSinGarantia />
                </div>
              )}

              {!sinStock && (
                <div ref={botonesRef}>
                  {/* Primero la acción que queremos que haga: comprar. Suma el
                      producto y lleva derecho a completar los datos. */}
                  <button
                    onClick={comprarAhora}
                    className="w-full bg-[#111111] text-white hover:bg-[#2a2a2a] h-[52px] font-bebas text-xl uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-[0.99] mb-2.5"
                  >
                    <i className="fas fa-bolt text-sm" aria-hidden="true"></i> Comprar ahora
                  </button>

                  {/* Y abajo, para quien quiere seguir mirando. */}
                  {enCarrito ? (
                    <div className="flex items-center justify-between border border-gray-300 text-[#111111] h-[52px] rounded-xl px-1 mb-2.5">
                      <button onClick={() => cambiarCantidad(producto.id, -1)} aria-label="Quitar una unidad" className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-[#111111] transition-colors">
                        <i className="fas fa-minus text-sm" aria-hidden="true"></i>
                      </button>
                      <span className="font-bebas text-lg uppercase tracking-wide pt-0.5">{enCarrito.qty} en el carrito</span>
                      <button onClick={agregar} aria-label="Agregar una unidad" className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-[#111111] transition-colors">
                        <i className="fas fa-plus text-sm" aria-hidden="true"></i>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={agregar}
                      className="w-full border border-gray-300 text-[#111111] hover:border-[#111111] h-[52px] font-bebas text-lg uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 mb-2.5"
                    >
                      Agregar al carrito
                    </button>
                  )}
                </div>
              )}

              {/* Lo que da confianza para comprar, pegado a los botones: es el momento
                  en que la persona duda. Todo es cierto hoy; si algo cambia (turnos,
                  precio del Pago Seguro), hay que cambiarlo acá y en las preguntas. */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { icono: 'fas fa-motorcycle', titulo: 'Envío en 30’', detalle: 'CABA y AMBA' },
                  { icono: 'fas fa-award', titulo: '100% original', detalle: 'Empaque de fábrica' },
                  { icono: 'fas fa-shield-alt', titulo: 'Envío asegurado', detalle: 'Opcional, con Pago Seguro' },
                  { icono: 'fas fa-money-bill-wave', titulo: 'Efectivo o transferencia', detalle: 'Con efectivo, descuento' },
                ].map(s => (
                  <div key={s.titulo} className="flex items-start gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                    <i className={`${s.icono} text-[#111111] text-sm mt-0.5 w-4 text-center shrink-0`} aria-hidden="true"></i>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-bold text-[#111111] leading-tight">{s.titulo}</span>
                      <span className="block text-[11px] text-gray-500 leading-snug">{s.detalle}</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* ---------- Los que llevaron este, también llevaron ----------
                  Sale de los pedidos reales (lib/juntos.js). Si no hay datos para
                  este producto, no se muestra: nada inventado. */}
              {compradosJuntos.length > 0 && (
                <div className="mt-6">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Los que llevaron este, también llevaron</p>
                  <div className="space-y-2">
                    {compradosJuntos.map(p => {
                      const yaEsta = cart.some(i => String(i.id) === String(p.id));
                      const pPrecio = p.offerPrice > 0 && p.offerPrice < p.price ? p.offerPrice : p.price;
                      return (
                        <div key={p.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-2 pr-3">
                          <Link href={rutaProducto(p)} className="relative w-12 h-12 shrink-0 rounded-lg bg-[#fafafa] overflow-hidden">
                            {p.image && <Image src={p.image} alt={p.name} fill sizes="48px" className="object-contain p-0.5" />}
                          </Link>
                          <Link href={rutaProducto(p)} className="flex-1 min-w-0">
                            <span className="block font-bebas text-base uppercase tracking-wide leading-tight text-[#111111] truncate">{p.name}</span>
                            <span className="block font-bebas text-base text-gray-500 tracking-wide leading-tight">{p.tag === 'USD' ? 'USD ' : '$'}{precioFormateado(pPrecio)}</span>
                          </Link>
                          {yaEsta ? (
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-green-600 flex items-center gap-1">
                              <i className="fas fa-check" aria-hidden="true"></i> En el carrito
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { if (agregarAlCarrito(p)) { setAvisoVisible(true); setTimeout(() => setAvisoVisible(false), 2600); } }}
                              className="shrink-0 h-9 px-3 rounded-lg border border-gray-300 hover:border-[#111111] text-[#111111] font-bebas text-sm uppercase tracking-widest transition-colors flex items-center gap-1.5"
                            >
                              <i className="fas fa-plus text-[10px]" aria-hidden="true"></i> Agregar
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ---------- Descripción, características y preguntas ----------
                  Van en esta columna, debajo de la compra: en compu la foto queda
                  fija a la izquierda mientras se lee todo esto (como Blissy). */}
              {descripcion && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h2 className="font-bebas text-2xl uppercase tracking-wide text-[#111111] mb-3">Descripción</h2>
                  <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-line">{descripcion}</p>
                </div>
              )}
              {fichaTecnica.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h2 className="font-bebas text-2xl uppercase tracking-wide text-[#111111] mb-3">Características</h2>
                  <dl className="text-[13px]">
                    {fichaTecnica.map(([clave, valor]) => (
                      <div key={clave} className="flex justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
                        <dt className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">{clave}</dt>
                        <dd className="text-[#111111] font-semibold text-right">{valor}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Preguntas frecuentes: las respuestas que antes estaban en páginas
                  aparte (Envíos, Pagos, Términos), acá donde la persona duda.
                  <details> abre y cierra solo, sin estado. */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="font-bebas text-2xl uppercase tracking-wide text-[#111111] mb-2">Preguntas frecuentes</h2>
                <div className="divide-y divide-gray-100">
                  {preguntas.map(({ p, r }) => (
                    <details key={p} className="group">
                      <summary className="flex items-center justify-between gap-4 py-3.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <span className="text-[14px] font-bold text-[#111111]">{p}</span>
                        <i className="fas fa-chevron-down text-xs text-gray-400 transition-transform group-open:rotate-180" aria-hidden="true"></i>
                      </summary>
                      <p className="pb-4 text-[13px] text-gray-600 leading-relaxed">{r}</p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- 028 Community ----------
            Primero los videos donde aparece este producto, después los de su marca
            y después el resto (el orden viene de la página). Mientras nadie toca
            play se ve sólo la portada, una imagen liviana: el video no se baja. */}
        {videosComunidad.length > 0 && (
          <section className="mt-10">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Comunidad real</p>
                <h2 className="font-bebas text-3xl uppercase tracking-wide text-[#111111] leading-none">Visto en 028 Community</h2>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
              {videosComunidad.map(v => (
                <div key={v.id} className="snap-start shrink-0 w-[160px] md:w-[200px]">
                  <div className="relative aspect-[9/16] rounded-[1.25rem] overflow-hidden bg-[#111111] shadow-[0_0_20px_rgba(0,0,0,0.06)]">
                    {videoActivo === v.id ? (
                      <video
                        src={v.videoUrl}
                        poster={v.poster || undefined}
                        controls
                        autoPlay
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setVideoActivo(v.id)}
                        aria-label={`Ver video${v.titulo ? `: ${v.titulo}` : ''}`}
                        className="absolute inset-0 w-full h-full group"
                      >
                        {v.poster && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.poster} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        )}
                        <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <i className="fas fa-play text-[#111111] text-sm ml-0.5" aria-hidden="true"></i>
                          </span>
                        </span>
                        {v.conEsteProducto && (
                          <span className="absolute top-2.5 left-2.5 bg-[#fcdb00] text-[#111111] text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
                            Aparece este producto
                          </span>
                        )}
                        {(v.titulo || v.creador) && (
                          <span className="absolute bottom-2.5 left-3 right-3 text-left text-white">
                            {v.titulo && <span className="block font-bebas text-base uppercase tracking-wide leading-tight line-clamp-2">{v.titulo}</span>}
                            {v.creador && <span className="block text-[10px] font-bold opacity-80">{v.creador}</span>}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------- Reseñas ----------
            Sólo las deja quien compró: llega a esto desde un enlace propio que le
            manda el vendedor por WhatsApp después del pedido, no hay botón acá para
            "escribir una reseña" porque no seríamos capaces de saber si compró de
            verdad. */}
        {resenas.cantidad > 0 && (
          <section id="resenas" className="mt-10 scroll-mt-24">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-bebas text-3xl uppercase tracking-wide text-[#111111]">Reseñas</h2>
              <span className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <i key={n} className={`fas fa-star text-sm ${n <= Math.round(resenas.promedio) ? 'text-[#fcdb00]' : 'text-gray-200'}`}></i>
                ))}
              </span>
              <span className="text-[12px] font-bold text-gray-500">{resenas.promedio.toFixed(1)} de 5 · {resenas.cantidad} reseña{resenas.cantidad === 1 ? '' : 's'}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {resenas.lista.map(r => (
                <div key={r.id} className="bg-white rounded-[1.25rem] border border-gray-100 shadow-[0_0_20px_rgba(0,0,0,0.04)] p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[13px] text-[#111111]">{r.name}</span>
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <i key={n} className={`fas fa-star text-[11px] ${n <= r.rating ? 'text-[#fcdb00]' : 'text-gray-200'}`}></i>
                      ))}
                    </span>
                  </div>
                  {r.text && <p className="text-[13px] text-gray-600 leading-relaxed">{r.text}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------- Otros de la misma marca ---------- */}
        {relacionados.length > 0 && (
          <section className="mt-10">
            <h2 className="font-bebas text-3xl uppercase tracking-wide text-[#111111] mb-4">
              Más de {producto.category}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
              {relacionados.map(p => {
                const pOferta = p.offerPrice > 0 && p.offerPrice < p.price;
                return (
                  <Link
                    key={p.id}
                    href={rutaProducto(p)}
                    className="snap-start flex-shrink-0 w-[160px] md:w-[190px] bg-white rounded-[1.25rem] shadow-[0_0_20px_rgba(0,0,0,0.045)] hover:shadow-[0_0_26px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                  >
                    <div className="relative aspect-square bg-[#fafafa]">
                      {p.image && (
                        <Image src={p.image} alt={p.name} fill sizes="190px" className="object-contain p-3 group-hover:scale-105 transition-transform duration-500" />
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-bebas text-base uppercase tracking-wide leading-tight text-[#111111] line-clamp-2 mb-1">{p.name}</h3>
                      <p className="font-bebas text-lg text-[#111111] tracking-wide">
                        {p.tag === 'USD' ? 'USD ' : '$'}{precioFormateado(pOferta ? p.offerPrice : p.price)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ---------- Barra de compra fija ---------- */}
      {!sinStock && (
        <div
          className={`fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] transition-transform duration-300 ${barraVisible ? 'translate-y-0' : 'translate-y-full'}`}
          aria-hidden={!barraVisible}
        >
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-2.5 flex items-center gap-3">
            {fotos[0] && (
              <div className="relative w-11 h-11 shrink-0 rounded-lg bg-[#fafafa] overflow-hidden hidden sm:block">
                <Image src={fotos[0]} alt="" fill sizes="44px" className="object-contain p-1" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bebas text-base md:text-lg uppercase tracking-wide leading-none text-[#111111] truncate">{producto.name}</p>
              <p className="font-bebas text-lg md:text-xl text-[#111111] tracking-wide leading-none mt-0.5">
                {simbolo}{precioFormateado(precio)}
                {esEbCreate && (
                  <span className="inline-flex items-center gap-1 ml-2 align-middle text-red-600 text-sm tracking-wider">
                    <IconoAlerta className="w-3 h-3" /> Sin garantía
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={agregar}
              tabIndex={barraVisible ? 0 : -1}
              aria-label="Agregar al carrito"
              className="shrink-0 h-11 px-3 md:px-5 border border-gray-300 hover:border-[#111111] text-[#111111] rounded-xl font-bebas text-base uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <i className="fas fa-cart-plus text-sm" aria-hidden="true"></i>
              <span className="hidden md:inline">Agregar</span>
            </button>
            <button
              onClick={comprarAhora}
              tabIndex={barraVisible ? 0 : -1}
              className="shrink-0 h-11 px-4 md:px-6 bg-[#111111] hover:bg-[#2a2a2a] text-white rounded-xl font-bebas text-base md:text-lg uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <i className="fas fa-bolt text-xs" aria-hidden="true"></i> Comprar ahora
            </button>
          </div>
        </div>
      )}

      {/* Aviso al agregar: confirma la acción sin sacar a la persona de la página.
          Con la barra fija visible, sube para no quedar tapado. */}
      <div
        aria-live="polite"
        className={`fixed ${barraVisible ? 'bottom-24' : 'bottom-5'} left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${avisoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}
      >
        <div className="bg-[#111111] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-[13px] font-semibold">
          <i className="fas fa-check-circle text-[#fcdb00]" aria-hidden="true"></i>
          Agregado al carrito
        </div>
      </div>
    </div>
  );
}
