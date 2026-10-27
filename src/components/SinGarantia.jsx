import { aSlug } from '@/lib/slug';

// La línea Elfbar EB Create se vende sin garantía: si llega fallada de fábrica, no
// hay cambio ni devolución. Se avisa sólo en la ficha del producto (junto a los
// botones de compra) y en el checkout: en tarjetas y listados quedaba recargado.
//
// Se busca "eb-create" dentro del slug de la marca, y no el texto exacto, para que
// cuenten igual "Elfbar Eb create", "ELFBAR EB CREATE 40K" o cualquier modelo nuevo
// de la línea. (Antes se comparaba exacto y "Elfbar Eb create 40K" quedaba afuera.)

export const esSinGarantia = (producto) => aSlug(producto?.category || '').includes('eb-create');

export const TEXTO_SIN_GARANTIA = 'Si llega con fallas de fábrica, no tiene cambio ni devolución.';

// El set de íconos de la página no trae el triángulo de advertencia.
export const IconoAlerta = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2.5c.6 0 1.1.3 1.4.8l9.2 16c.6 1-.1 2.2-1.3 2.2H2.7c-1.2 0-1.9-1.2-1.3-2.2l9.2-16c.3-.5.8-.8 1.4-.8zm0 6.5c-.6 0-1 .4-1 1v4.5c0 .6.4 1 1 1s1-.4 1-1V10c0-.6-.4-1-1-1zm0 8a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z" />
  </svg>
);

/** Recuadro para la ficha, junto a los botones de compra. */
export const AvisoSinGarantia = () => (
  <div role="note" className="flex items-start gap-3 bg-red-50 border-2 border-red-500 rounded-xl px-4 py-3">
    <span className="w-9 h-9 shrink-0 rounded-full bg-red-600 text-white flex items-center justify-center">
      <IconoAlerta className="w-5 h-5" />
    </span>
    <div>
      <p className="font-bebas text-xl uppercase tracking-wide text-red-700 leading-none mt-1">Producto sin garantía</p>
      <p className="text-[12px] font-bold text-red-700/90 leading-snug mt-1">{TEXTO_SIN_GARANTIA}</p>
    </div>
  </div>
);

/** Línea chica debajo del nombre, en el resumen del checkout. */
export const EtiquetaSinGarantia = () => (
  <p className="inline-flex items-center gap-1 w-fit bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
    <IconoAlerta className="w-3 h-3" /> Sin garantía
  </p>
);
