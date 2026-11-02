'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CYBER_FIN, LINK_COMUNIDAD } from '@/lib/cyber';

// Después de comprar en el CYBER 028: "ya estás participando, sumate a la comunidad".
// Comprar es el paso 1 del sorteo y sumarse a la comunidad el 2; este es el momento en
// que más gente se suma, y antes sólo había una nota chica debajo del botón.
//
// Al confirmar, la web manda a WhatsApp. La pantalla aparece cuando la persona vuelve:
// si el navegador recupera la página tal cual (botón atrás), ya está abierta; si la
// recarga, la abre lo guardado en este navegador. Se muestra una sola vez por pedido.

const CLAVE = '028_sorteo_participa';
const EVENTO = 'cyber028:compra';
// Hasta el sorteo en vivo del jueves 5 a la noche.
const HASTA = CYBER_FIN + 24 * 60 * 60 * 1000;

/** Lo llama el checkout justo antes de mandar el pedido a WhatsApp. */
export function marcarParticipacion(codigo) {
  try { localStorage.setItem(CLAVE, JSON.stringify({ codigo: codigo || '', visto: false, fecha: Date.now() })); } catch {}
  window.dispatchEvent(new Event(EVENTO));
}

function pendiente() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    return d && !d.visto && Date.now() < HASTA ? d : null;
  } catch { return null; }
}

export default function SorteoPostCompra() {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    setDatos(pendiente());
    const abrir = () => setDatos(pendiente());
    window.addEventListener(EVENTO, abrir);
    return () => window.removeEventListener(EVENTO, abrir);
  }, []);

  useEffect(() => {
    if (!datos) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('cyber-abierto');
    return () => { document.body.style.overflow = antes; document.body.classList.remove('cyber-abierto'); };
  }, [datos]);

  if (!datos) return null;

  const cerrar = () => {
    try { localStorage.setItem(CLAVE, JSON.stringify({ ...datos, visto: true })); } catch {}
    setDatos(null);
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-end md:items-center justify-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="sorteo-titulo">
      <button type="button" aria-label="Cerrar" onClick={cerrar} className="absolute inset-0 bg-black/85 backdrop-blur-md cyber-fondo" />

      <div className="cyber-ventana relative w-full max-w-[440px] bg-[#fcdb00] text-[#0a0a0a] rounded-t-[22px] md:rounded-[22px] overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.8)]">
        <span aria-hidden="true" className="pointer-events-none absolute right-[-0.05em] top-[-0.12em] font-bebas text-[230px] leading-none text-black/[0.07]">028</span>

        <div className="relative px-6 pt-6 pb-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] font-poppins text-black/60">
              Pedido enviado{datos.codigo ? ` · #${datos.codigo}` : ''}
            </p>
            <button type="button" onClick={cerrar} aria-label="Cerrar" className="w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors">
              <i className="fas fa-times text-[14px]"></i>
            </button>
          </div>

          <h2 id="sorteo-titulo" className="font-bebas text-[64px] leading-[0.82] mt-8">Ya estás<br />participando</h2>
          <p className="font-bebas text-[26px] leading-none mt-3">por <span className="text-[34px]">$50.000</span> en la web.</p>

          <div className="mt-7 border-t border-black/20">
            {[
              ['01', 'Compraste en el Cyber', true],
              ['02', 'Sumate a la comunidad de WhatsApp', false],
              ['03', 'Ganador en vivo el jueves 05.11', false],
            ].map(([n, texto, hecho]) => (
              <p key={n} className={`flex items-baseline gap-4 py-2.5 border-b border-black/15 ${hecho ? 'text-black/45' : ''}`}>
                <span className="w-[18px] font-bebas text-[18px] leading-none text-black/45">{hecho ? <i className="fas fa-check text-[12px] text-black"></i> : n}</span>
                <span className="font-bebas text-[22px] leading-none">{texto}</span>
              </p>
            ))}
          </div>
          <p className="text-[12px] font-poppins text-black/65 mt-4 leading-relaxed">
            Para entrar al sorteo te falta sumarte a la comunidad. Ahí se anuncia quién ganó.
          </p>

          {LINK_COMUNIDAD ? (
            <a
              href={LINK_COMUNIDAD}
              target="_blank"
              rel="noopener noreferrer"
              onClick={cerrar}
              className="mt-6 flex items-center justify-center gap-3 w-full h-14 bg-[#0a0a0a] text-[#fcdb00] font-bebas text-[23px] tracking-[0.08em] uppercase rounded-[10px] hover:bg-black/85 transition-colors"
            >
              Sumarme a la comunidad <i className="fab fa-whatsapp text-[20px]"></i>
            </a>
          ) : null}
          <Link href="/sorteo50000" prefetch={false} onClick={cerrar} className="mt-3 block text-center text-[11px] font-semibold uppercase tracking-[0.2em] font-poppins text-black/60 hover:text-black transition-colors">
            Ver bases del sorteo
          </Link>
        </div>
      </div>
    </div>
  );
}
