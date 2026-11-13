'use client';

import { useEffect, useState } from 'react';
import { promoEnvioActual, MINIMO_ENVIO_GRATIS } from '@/lib/cyber';

// La promo de envío gratis (ver PROMOS_ENVIO en lib/cyber), entre el menú y la cinta
// de la portada. Es un descuento chico, no un evento: una franja finita que lo
// explica en una línea, sin contador.
//
// Se decide recién al montar: la portada queda guardada en el servidor un rato y no
// tiene que mostrar una promo que ya terminó.

export default function AvisoEnvioGratis() {
  const [promo, setPromo] = useState(null);
  useEffect(() => { setPromo(promoEnvioActual()); }, []);
  if (!promo) return null;

  const minimo = `$${MINIMO_ENVIO_GRATIS.toLocaleString('es-AR')}`;
  return (
    <div className="w-full bg-[#0a0a0a] border-b border-white/10">
      <p className="max-w-[1400px] mx-auto px-4 md:px-12 py-2.5 md:py-3 flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-4 text-center">
        <span className="font-bebas text-[18px] md:text-[20px] leading-none tracking-wide text-white whitespace-nowrap">
          Envío gratis en CABA desde <span className="text-[#fcdb00]">{minimo}</span>
        </span>
        <span className="hidden md:block w-px h-3.5 bg-white/25" aria-hidden="true"></span>
        <span className="text-[9px] md:text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 font-poppins">
          <span className="md:hidden">Solo este finde</span>
          <span className="hidden md:inline">Solo este fin de semana · viernes a domingo</span>
        </span>
      </p>
    </div>
  );
}
