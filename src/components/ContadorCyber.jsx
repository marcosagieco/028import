'use client';

import { useEffect, useRef, useState } from 'react';
import { CYBER_INICIO as INICIO, CYBER_FIN as FIN, enLanzamiento } from '@/lib/cyber';

// Cuenta regresiva al CYBER 028, entre el menú y el marquee de la portada.
// Estilo de lanzamiento de marca grande: negro, tipografía enorme, números separados
// por líneas finas y el amarillo sólo como detalle. Nada de cajas ni brillos.
//
// Al bajar, cuando la franja sale de la pantalla, aparece una versión finita fija
// debajo del menú (que también queda fijo), para que el contador se vea siempre.
//
// En el celular va en una sola franja: el título en dos renglones a la izquierda y
// el contador a la derecha. Apilado ocupaba media pantalla antes del banner.
//
// El CYBER 028 va del lunes 2/11 al miércoles 4/11 (hora de Argentina, UTC-3).
// Hasta el lunes a las 00:00 cuenta para el arranque. Cuando llega a cero, los números
// se van y queda "Cyber 028" con un botón que abre la historia de las ofertas (ver
// SeccionCyber). Desde el jueves 5 no se muestra más.
// "Cyber Monday" es marca registrada de la CACE: no se usa en ninguna pieza.

const dosCifras = (n) => String(n).padStart(2, '0');

function Unidad({ valor, etiqueta, primera }) {
  return (
    <div className={`flex flex-col items-center md:items-start px-2.5 md:px-7 md:w-[124px] ${primera ? 'pl-0 md:pl-7' : 'border-l border-white/15'}`}>
      <span className="font-bebas text-[30px] md:text-[92px] leading-[0.85] text-white tabular-nums">{valor}</span>
      <span className="mt-1.5 md:mt-2 text-[7px] md:text-[10px] font-semibold uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/45 font-poppins">{etiqueta}</span>
    </div>
  );
}

// La historia de SeccionCyber escucha este aviso para abrirse.
const abrirHistoria = () => window.dispatchEvent(new Event('cyber028:abrir'));

export default function ContadorCyber() {
  // Sin hora hasta montar: el servidor y el navegador darían números distintos.
  const [ahora, setAhora] = useState(null);
  const franja = useRef(null);
  const [franjaVisible, setFranjaVisible] = useState(true);

  useEffect(() => {
    setAhora(Date.now());
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = franja.current;
    if (!el) return;
    // 72px = alto del menú fijo: la franja cuenta como tapada cuando queda debajo de él.
    const obs = new IntersectionObserver(([e]) => setFranjaVisible(e.isIntersecting), { rootMargin: '-72px 0px 0px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (ahora !== null && ahora >= FIN) return null;

  const enCurso = ahora !== null && ahora >= INICIO;
  const lanzamiento = ahora !== null && enLanzamiento(ahora);
  const resta = ahora === null ? 0 : Math.max(0, (enCurso ? FIN : INICIO) - ahora);
  const ver = (n) => (ahora === null ? '--' : dosCifras(n));
  const dias = ver(Math.floor(resta / 86400000));
  const horas = ver(Math.floor(resta / 3600000) % 24);
  const minutos = ver(Math.floor(resta / 60000) % 60);
  const segundos = ver(Math.floor(resta / 1000) % 60);

  return (
    <>
    <section ref={franja} className="relative w-full bg-[#0a0a0a] border-b border-white/10 overflow-hidden">
      <div className="relative max-w-[1400px] mx-auto px-4 md:px-12 py-4 md:py-12 flex flex-row items-center justify-between gap-4 md:gap-10">
        <div className="min-w-0">
          <p className="flex items-center gap-2 md:gap-3 text-[8px] md:text-[11px] font-semibold uppercase tracking-[0.25em] md:tracking-[0.3em] text-white/55 font-poppins">
            <span className="w-4 md:w-6 h-[2px] bg-[#fcdb00]"></span>
            {enCurso
              ? (lanzamiento
                ? <><span className="md:hidden">Envío gratis hasta 04:00</span><span className="hidden md:inline">Envío gratis en CABA hasta las 04:00</span></>
                : <><span className="md:hidden">Ya empezó</span><span className="hidden md:inline">Ya empezó · hasta el miércoles 04.11</span></>)
              : <><span className="md:hidden">02.11 al 04.11</span><span className="hidden md:inline">Del lunes 02.11 al miércoles 04.11</span></>}
          </p>
          <h2 className="font-bebas text-[34px] md:text-[132px] leading-[0.85] md:leading-[0.82] text-white mt-1.5 md:mt-5">
            Cyber<br className="md:hidden" /> 028
          </h2>
          <p className="hidden md:block mt-4 max-w-md text-[15px] text-white/60 font-poppins leading-relaxed">
            {enCurso
              ? 'Nuevas ofertas, Mystery Box, envío gratis en CABA y un sorteo de $50.000. Mirá cómo funciona.'
              : 'Ofertas únicas · tiempo limitado. Del lunes al miércoles.'}
          </p>
        </div>

        {enCurso ? (
          <button
            type="button"
            onClick={abrirHistoria}
            className="group shrink-0 flex flex-col items-end md:items-start text-left"
          >
            <span className="hidden md:block text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45 font-poppins mb-3">Precios, envíos y sorteo</span>
            <span className="flex items-center gap-2.5 md:gap-4 h-11 md:h-16 px-4 md:px-8 bg-[#fcdb00] text-[#0a0a0a] rounded-[8px] md:rounded-[10px] font-bebas text-[19px] md:text-[30px] leading-none tracking-[0.06em] uppercase transition-colors group-hover:bg-white">
              <span className="md:hidden">Descubrilas</span>
              <span className="hidden md:inline">Descubrí las ofertas</span>
              <i className="fas fa-arrow-right text-[11px] md:text-[16px] transition-transform group-hover:translate-x-1"></i>
            </span>
            <span className="md:hidden mt-1.5 text-[7px] font-semibold uppercase tracking-[0.2em] text-white/45 font-poppins">Cómo funciona</span>
          </button>
        ) : (
          <div className="flex md:-mx-7 shrink-0" aria-label="Tiempo que falta para el CYBER 028">
            <Unidad valor={dias} etiqueta="Días" primera />
            <Unidad valor={horas} etiqueta="Horas" />
            <Unidad valor={minutos} etiqueta="Min" />
            <Unidad valor={segundos} etiqueta="Seg" />
          </div>
        )}
      </div>
    </section>

    {/* Versión fija al bajar. */}
    <div
      aria-hidden={franjaVisible}
      className={`fixed top-[72px] inset-x-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-300 ${franjaVisible ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 h-10 md:h-11 flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 md:gap-3 min-w-0">
          <span className="w-4 md:w-6 h-[2px] bg-[#fcdb00] shrink-0"></span>
          <span className="font-bebas text-[19px] md:text-[22px] leading-none text-white tracking-wide whitespace-nowrap">CYBER 028</span>
          <span className="hidden md:inline text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45 font-poppins ml-2">{enCurso ? 'Nuevas ofertas hasta el miércoles' : 'Del 02.11 al 04.11 — Ofertas únicas'}</span>
        </p>
        {enCurso ? (
          <button type="button" onClick={abrirHistoria} className="flex items-center gap-2 font-bebas text-[17px] md:text-[20px] leading-none text-[#fcdb00] tracking-[0.06em] uppercase whitespace-nowrap hover:text-white transition-colors">
            Descubrilas <i className="fas fa-arrow-right text-[10px]"></i>
          </button>
        ) : (
          <p className="font-bebas text-[19px] md:text-[22px] leading-none text-white tabular-nums tracking-wide whitespace-nowrap">
            {dias}<span className="text-white/45 text-[13px] md:text-[14px] mr-2">D</span>
            {horas}<span className="text-white/45 text-[13px] md:text-[14px] mr-2">H</span>
            {minutos}<span className="text-white/45 text-[13px] md:text-[14px] mr-2">M</span>
            {segundos}<span className="text-white/45 text-[13px] md:text-[14px]">S</span>
          </p>
        )}
      </div>
    </div>
    </>
  );
}
