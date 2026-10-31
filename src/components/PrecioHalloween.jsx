'use client';

import { useSyncExternalStore } from 'react';

// El descuento de "¿Truco o trato?" mostrado en todos los precios de la tienda.
//
// Mientras la cuenta tiene su código de Halloween sin usar (5% o 10%), cada precio
// aparece tachado y debajo el precio con el descuento. HomeClient, que está en todas
// las páginas y sabe quién inició sesión y qué cupón tiene, es el único que lo fija;
// después de la compra (o al cerrar sesión) vuelve a 0 y los precios quedan normales.
//
// Se guarda en el navegador para que al recargar los precios salgan bien desde el
// primer momento, sin esperar a que cargue la sesión.

const CLAVE = '028_descuento_halloween';
let porcentaje = 0;
const oyentes = new Set();

if (typeof window !== 'undefined') {
  try { porcentaje = Number(JSON.parse(localStorage.getItem(CLAVE) || '0')) || 0; } catch {}
}

export function fijarDescuentoHalloween(pct) {
  const nuevo = Number(pct) || 0;
  if (nuevo === porcentaje) return;
  porcentaje = nuevo;
  try { localStorage.setItem(CLAVE, JSON.stringify(nuevo)); } catch {}
  oyentes.forEach((f) => f());
}

const suscribir = (f) => { oyentes.add(f); return () => oyentes.delete(f); };

/** El % de Halloween vigente (0 si no hay). En el servidor siempre 0. */
export function useDescuentoHalloween() {
  return useSyncExternalStore(suscribir, () => porcentaje, () => 0);
}

export const conHalloween = (precio, pct) => Math.round(Number(precio || 0) * (1 - pct / 100));

/**
 * El precio de un producto. Sin descuento de Halloween, no dibuja nada distinto:
 * devuelve `children` (el precio de siempre). Con descuento, el precio de siempre
 * tachado y abajo el de Halloween con su etiqueta.
 */
export function PrecioHalloween({ precio, simbolo = '$', formato, sufijo = null, claseNuevo = '', claseTachado = '', className = '', children }) {
  const pct = useDescuentoHalloween();
  if (!pct || !(precio > 0)) return children;
  const f = formato || ((n) => Number(n || 0).toLocaleString('es-AR'));
  return (
    <div className={className}>
      <p className={`font-bebas line-through decoration-[#ff6b1a] decoration-2 text-gray-400 leading-none ${claseTachado}`}>
        {simbolo}{f(precio)}
      </p>
      <p className={`font-bebas text-[#111111] tracking-wide leading-tight ${claseNuevo}`}>
        {simbolo}{f(conHalloween(precio, pct))}{sufijo}
      </p>
      <p className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-sm bg-[#111111] text-[#ff7a2a] text-[9px] font-bold uppercase tracking-[0.14em] font-poppins whitespace-nowrap">
        🎃 -{pct}% Halloween
      </p>
    </div>
  );
}
