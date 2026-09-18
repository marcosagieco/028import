"use client";

// El carrito vive acá, por encima de todas las páginas, y no dentro de la home.
// Antes era un estado de HomeClient: alcanzaba porque toda la tienda era una sola
// página. Ahora que cada producto tiene su propia dirección, el carrito tiene que
// seguir existiendo cuando el visitante pasa de una página a otra.

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const CLAVE_CARRITO = '028_carrito';
const VENCIMIENTO_CARRITO = 7 * 24 * 60 * 60 * 1000;   // una semana

// ---------------------------------------------------------------------------
// Dónde guardar el carrito
//
// No alcanza con localStorage. Buena parte de la gente llega desde Instagram o
// TikTok, y esos links no abren Chrome: abren el navegador interno de la app,
// donde el almacenamiento suele estar bloqueado o aislado. Ahí localStorage tira
// error y el carrito se vaciaba solo al cambiar de página — la persona cargaba
// tres productos, pasaba a otra pantalla y encontraba el carrito vacío.
//
// Por eso se intenta en orden: localStorage, sessionStorage, una cookie, y como
// último recurso la memoria. La memoria no sobrevive a una recarga, pero sí al
// resto de la navegación, que es la mayor parte del recorrido de compra.
// ---------------------------------------------------------------------------

let enMemoria = null;

// La firma de lo último que se guardó o se leyó. Sirve para no escribir dos veces
// lo mismo y, sobre todo, para cortar el ida y vuelta entre pestañas.
let ultimaFirma = null;

/** Identifica el contenido del carrito sin mirar la hora en que se guardó. */
const firmaDe = (items) =>
  JSON.stringify((items || []).map(i => [String(i.id), Number(i.qty) || 0, Number(i.price) || 0]));

function almacenUtil(cual) {
  try {
    const a = window[cual];
    const prueba = '__prueba_028__';
    a.setItem(prueba, '1');
    a.removeItem(prueba);
    return a;
  } catch {
    return null;
  }
}

/** El primer lugar donde realmente se puede escribir. Se resuelve una sola vez. */
let almacenElegido;
function almacen() {
  if (almacenElegido !== undefined) return almacenElegido;
  if (typeof window === 'undefined') return (almacenElegido = null);
  almacenElegido = almacenUtil('localStorage') || almacenUtil('sessionStorage') || null;
  return almacenElegido;
}

/** Cookie propia: sobrevive a las recargas aunque el almacenamiento esté bloqueado. */
function leerCookie() {
  try {
    const par = document.cookie.split('; ').find(c => c.startsWith(CLAVE_CARRITO + '='));
    return par ? decodeURIComponent(par.slice(CLAVE_CARRITO.length + 1)) : null;
  } catch {
    return null;
  }
}

function escribirCookie(texto) {
  try {
    const vence = new Date(Date.now() + VENCIMIENTO_CARRITO).toUTCString();
    document.cookie = `${CLAVE_CARRITO}=${encodeURIComponent(texto)}; expires=${vence}; path=/; SameSite=Lax`;
    return true;
  } catch {
    return false;
  }
}

function borrarCookie() {
  try { document.cookie = `${CLAVE_CARRITO}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`; } catch {}
}

function leerCarritoGuardado() {
  let crudo = null;
  try {
    crudo = almacen()?.getItem(CLAVE_CARRITO) ?? null;
  } catch {
    crudo = null;
  }
  if (crudo == null) crudo = leerCookie();
  if (crudo == null) crudo = enMemoria;
  if (!crudo) return [];

  try {
    const guardado = JSON.parse(crudo);
    if (!guardado || !Array.isArray(guardado.items)) return [];
    // Un carrito de hace semanas ya no representa lo que la persona quería.
    if (Date.now() - (guardado.fecha || 0) > VENCIMIENTO_CARRITO) return [];
    const items = guardado.items.filter(i => i && i.id != null && Number(i.qty) > 0);
    ultimaFirma = firmaDe(items);
    return items;
  } catch {
    return [];
  }
}

function guardarCarrito(items) {
  const firma = firmaDe(items);
  // Si no cambió nada, no se escribe. Escribir de más dispara el aviso a las
  // otras pestañas, que responden escribiendo, y se arma un ida y vuelta sin fin:
  // los productos titilaban, se sumaban solos y no se dejaban borrar.
  if (firma === ultimaFirma) return;
  ultimaFirma = firma;

  if (!items.length) {
    try { almacen()?.removeItem(CLAVE_CARRITO); } catch {}
    borrarCookie();
    enMemoria = null;
    return;
  }
  const texto = JSON.stringify({ fecha: Date.now(), items });
  // Siempre en memoria: es lo único que nunca falla dentro de la misma pestaña.
  enMemoria = texto;
  try { almacen()?.setItem(CLAVE_CARRITO, texto); } catch {}
  // La cookie es chica; si el carrito es enorme no entra, y con lo anterior alcanza.
  if (texto.length < 3500) escribirCookie(texto);
}
const ContextoCarrito = createContext(null);

export function CarritoProvider({ children }) {
  const [cart, setCart] = useState([]);
  const restaurado = useRef(false);

  // Se restaura después del primer dibujado, no en el estado inicial: el servidor
  // no tiene localStorage y arrancar con contenidos distintos rompe la hidratación.
  useEffect(() => {
    const guardado = leerCarritoGuardado();
    if (guardado.length) setCart(guardado);
    restaurado.current = true;
  }, []);

  // Se guarda en cada cambio, pero recién después de haber restaurado: si no, el
  // carrito vacío del primer dibujado pisaría lo que había guardado.
  useEffect(() => {
    if (!restaurado.current) return;
    guardarCarrito(cart);
  }, [cart]);

  // Si la persona tiene la tienda abierta en dos pestañas, que las dos vean lo mismo.
  //
  // Con cuidado: antes esto respondía a cualquier aviso, aunque el contenido fuera
  // idéntico. Como cada respuesta generaba otra escritura, las dos pestañas se
  // avisaban en círculo para siempre. Ahora sólo se hace caso si cambió algo.
  useEffect(() => {
    const alCambiar = (e) => {
      if (e.key !== CLAVE_CARRITO) return;

      // Se usa lo que vino en el aviso, no lo que esta pestaña tenga guardado.
      // El respaldo en memoria es de cada pestaña por separado: si otra vació el
      // carrito, ésta seguiría leyendo su propia copia vieja y no se enteraría.
      let items = [];
      if (e.newValue != null) {
        try {
          const guardado = JSON.parse(e.newValue);
          if (guardado && Array.isArray(guardado.items)) {
            items = guardado.items.filter(i => i && i.id != null && Number(i.qty) > 0);
          }
        } catch {
          items = [];
        }
      }

      const firma = firmaDe(items);
      if (firma === ultimaFirma) return;   // llegó un aviso, pero es lo mismo
      ultimaFirma = firma;
      enMemoria = items.length ? e.newValue : null;
      setCart(items);
    };
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }, []);

  /**
   * Pone al día un carrito guardado contra el catálogo actual: corrige precios y
   * nombres, y descarta lo que ya no se vende. Sin esto alguien podría comprar a un
   * precio que cambiaste hace una semana.
   */
  const sincronizarConCatalogo = useCallback((productos) => {
    if (!restaurado.current || !productos || !productos.length) return;
    setCart(prev => {
      if (!prev.length) return prev;
      let huboCambios = false;
      const alDia = [];
      for (const item of prev) {
        const actual = productos.find(p => String(p.id) === String(item.id));
        if (!actual || actual.inStock === false) { huboCambios = true; continue; }
        const conOferta = actual.offerPrice > 0 && actual.offerPrice < actual.price;
        const precio = item.isUpsell ? item.upsellPrice : (conOferta ? actual.offerPrice : actual.price);
        if (precio !== item.price || actual.name !== item.name) huboCambios = true;
        alDia.push({ ...actual, ...item, price: precio, listPrice: actual.price, name: actual.name, image: actual.image });
      }
      return huboCambios ? alDia : prev;
    });
  }, []);

  /** Agrega una unidad. Devuelve false si el producto está sin stock. */
  const agregarAlCarrito = useCallback((producto) => {
    if (!producto || producto.inStock === false) return false;
    const conOferta = producto.offerPrice > 0 && producto.offerPrice < producto.price;
    const precio = conOferta ? producto.offerPrice : producto.price;
    setCart(prev => {
      const existente = prev.find(i => String(i.id) === String(producto.id));
      if (existente) return prev.map(i => String(i.id) === String(producto.id) ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...producto, price: precio, listPrice: producto.price, qty: 1 }];
    });
    return true;
  }, []);

  const cambiarCantidad = useCallback((id, delta) => {
    setCart(prev => prev.map(i => String(i.id) === String(id) ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  }, []);

  const unidadesEnCarrito = cart.reduce((total, i) => total + (Number(i.qty) || 0), 0);

  return (
    <ContextoCarrito.Provider value={{ cart, setCart, agregarAlCarrito, cambiarCantidad, sincronizarConCatalogo, unidadesEnCarrito }}>
      {children}
    </ContextoCarrito.Provider>
  );
}

export function useCarrito() {
  const ctx = useContext(ContextoCarrito);
  if (!ctx) throw new Error('useCarrito se usó fuera de <CarritoProvider>');
  return ctx;
}
