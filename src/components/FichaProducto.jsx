"use client";

// Ficha de producto, con el reparto clásico de las tiendas grandes: la foto ocupa
// la izquierda y a la derecha queda fija la columna de compra (precio, cantidad,
// botones, envío).
//
// Está pensada para verse completa con lo que hay hoy —una sola foto y, en muchos
// productos, sin descripción— y para crecer sola cuando se carguen más fotos o texto:
// la galería aparece únicamente si hay más de una imagen, y la descripción sólo si
// existe. Nada queda como un hueco vacío.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCarrito } from '@/components/CarritoProvider';
import { rutaProducto, aSlug } from '@/lib/slug';
import { fichasDeCombo } from '@/lib/combos';

const WHATSAPP = '5491153412358';

const precioFormateado = (n) => Number(n || 0).toLocaleString('es-AR');

const POCAS_UNIDADES = 5;   // a partir de acá se avisa que queda poco

export default function FichaProducto({ producto, relacionados = [], escalones = [], puesto = null }) {
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
  const conOferta = producto.offerPrice > 0 && producto.offerPrice < producto.price;
  const precio = conOferta ? producto.offerPrice : producto.price;
  const esUSD = producto.tag === 'USD';
  const simbolo = esUSD ? 'USD ' : '$';
  const descuento = conOferta ? Math.round((1 - producto.offerPrice / producto.price) * 100) : 0;

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

  const mensajeWhatsApp = encodeURIComponent(
    `Hola! Me interesa ${producto.name} (${producto.category}) — ${simbolo}${precioFormateado(precio)}`
  );

  return (
    <div className="bg-[#f2f2f2]">

      <main className="w-full max-w-[1180px] mx-auto px-4 md:px-6 py-5 md:py-8">

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

        <div className="bg-white rounded-[1.5rem] shadow-[0_0_50px_rgba(0,0,0,0.05),0_0_14px_rgba(0,0,0,0.028)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]">

            {/* ---------- Foto ---------- */}
            <div className="p-5 md:p-8 lg:border-r border-gray-200">
              <div className="relative w-full aspect-square max-w-[560px] mx-auto bg-[#fafafa] rounded-2xl overflow-hidden">
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
                    <i className="fas fa-image text-5xl" aria-hidden="true"></i>
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
            <div className="p-5 md:p-8 lg:sticky lg:top-20 lg:self-start">
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

              {/* El distintivo del podio, calculado con las ventas reales. El número
                  suelto de unidades vendidas se sacó a pedido; el puesto queda. */}
              {puesto && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 bg-[#fcdb00] text-[#111111] font-bebas text-sm px-2.5 py-1 rounded-md tracking-wide">
                    <i className="fas fa-trophy text-[10px]" aria-hidden="true"></i>
                    {puesto === 1 ? 'El más vendido' : `Top ${puesto}`} en {producto.category}
                  </span>
                </div>
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

              <p className={`text-[12px] font-bold uppercase tracking-widest mb-4 ${sinStock ? 'text-red-500' : 'text-green-600'}`}>
                <i className={`fas ${sinStock ? 'fa-times-circle' : 'fa-check-circle'} mr-1.5`} aria-hidden="true"></i>
                {sinStock ? 'Sin stock por ahora' : 'Disponible'}
              </p>

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
                <div className="mb-5 border-2 border-[#111111] rounded-2xl overflow-hidden">
                  <p className="bg-[#111111] text-[#fcdb00] font-bebas text-base uppercase tracking-widest px-4 py-2 flex items-center gap-2">
                    <i className="fas fa-layer-group text-xs" aria-hidden="true"></i>
                    Cuantas más llevás, menos pagás
                  </p>
                  <div className="divide-y divide-gray-100">
                    {combos.map((c) => (
                      <div key={c.cantidad} className="flex items-center gap-3 px-4 py-3">
                        <span className="font-bebas text-2xl text-[#111111] w-12 shrink-0 leading-none">
                          {c.cantidad}{c.abierto ? '+' : ''}
                        </span>
                        <span className="flex-1 min-w-0">
                          {c.esBase ? (
                            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Por unidad</span>
                          ) : (
                            <span className="text-[11px] font-bold uppercase tracking-widest text-green-600">
                              Ahorrás {simbolo}{precioFormateado(Math.round(c.ahorro))}
                            </span>
                          )}
                        </span>
                        <span className={`font-bebas text-xl tracking-wide shrink-0 ${c.esBase ? 'text-gray-400' : 'text-[#111111]'}`}>
                          {simbolo}{precioFormateado(c.precioUnitario)}<span className="text-[11px] font-poppins font-bold text-gray-400 ml-1">c/u</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!sinStock && (
                <>
                  {/* Primero la acción que queremos que haga: comprar. Suma el
                      producto y lleva derecho a completar los datos. */}
                  <button
                    onClick={comprarAhora}
                    className="w-full bg-[#111111] text-white hover:bg-[#fcdb00] hover:text-[#111111] h-12 font-bebas text-xl uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] mb-3"
                  >
                    <i className="fas fa-bolt text-sm" aria-hidden="true"></i> Comprar ahora
                  </button>

                  {/* Y abajo, para quien quiere seguir mirando. */}
                  {enCarrito ? (
                    <div className="flex items-center justify-between bg-[#fcdb00] text-[#111111] h-12 rounded-xl font-bold px-2 mb-3 shadow-sm">
                      <button onClick={() => cambiarCantidad(producto.id, -1)} aria-label="Quitar una unidad" className="w-12 h-full flex items-center justify-center hover:text-black transition-colors">
                        <i className="fas fa-minus text-sm" aria-hidden="true"></i>
                      </button>
                      <span className="font-bebas text-xl pt-1">{enCarrito.qty} en el carrito</span>
                      <button onClick={agregar} aria-label="Agregar una unidad" className="w-12 h-full flex items-center justify-center hover:text-black transition-colors">
                        <i className="fas fa-plus text-sm" aria-hidden="true"></i>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={agregar}
                      className="w-full border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white h-12 font-bebas text-xl uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mb-3"
                    >
                      <i className="fas fa-shopping-bag text-sm" aria-hidden="true"></i> Agregar al carrito
                    </button>
                  )}
                </>
              )}

              <a
                href={`https://wa.me/${WHATSAPP}?text=${mensajeWhatsApp}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#25D366] text-white h-12 font-bebas text-xl uppercase tracking-widest rounded-xl hover:bg-[#1ebe5d] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <i className="fab fa-whatsapp text-lg" aria-hidden="true"></i> Consultar
              </a>

              {/* La promesa de entrega, destacada: es el argumento más fuerte de la
                  tienda y antes estaba perdido entre tres renglones grises. */}
              <div className="mt-6 bg-[#111111] rounded-2xl p-4 flex items-center gap-3">
                <span className="w-10 h-10 shrink-0 bg-[#fcdb00] rounded-full flex items-center justify-center text-[#111111]">
                  <i className="fas fa-motorcycle text-lg" aria-hidden="true"></i>
                </span>
                <span className="min-w-0">
                  <span className="block font-bebas text-xl text-[#fcdb00] uppercase tracking-wide leading-none">
                    Te llega en 30 minutos
                  </span>
                  <span className="block text-[12px] text-white/60 mt-1">
                    Por CABA y AMBA · Al resto del país, envío a domicilio
                  </span>
                </span>
              </div>

              {/* Fila de confianza */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-certificate text-[#fcdb00]" aria-hidden="true"></i> 100% original
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-box text-[#fcdb00]" aria-hidden="true"></i> Envío discreto
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="fab fa-whatsapp text-[#fcdb00]" aria-hidden="true"></i> Te atendemos siempre
                </span>
              </div>
            </div>
          </div>

          {/* ---------- Descripción y ficha técnica ---------- */}
          {(descripcion || fichaTecnica.length > 0) && (
            <div className="border-t border-gray-200 p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {descripcion && (
                <div>
                  <h2 className="font-bebas text-2xl uppercase tracking-wide text-[#111111] mb-3">Descripción</h2>
                  <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-line">{descripcion}</p>
                </div>
              )}
              {fichaTecnica.length > 0 && (
                <div>
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
            </div>
          )}
        </div>

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

      {/* Aviso al agregar: confirma la acción sin sacar a la persona de la página */}
      <div
        aria-live="polite"
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${avisoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}
      >
        <div className="bg-[#111111] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-[13px] font-semibold">
          <i className="fas fa-check-circle text-[#fcdb00]" aria-hidden="true"></i>
          Agregado al carrito
        </div>
      </div>
    </div>
  );
}
