'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CYBER_INICIO, CYBER_FIN, cyberActivo, enLanzamiento, LINK_COMUNIDAD } from '@/lib/cyber';

// La campaña CYBER 028 como historia de Instagram, no como sección en la portada: en
// el celular un bloque de texto entre el banner y los productos hacía que la gente
// scrolleara un rato largo antes de ver algo para comprar. Casi todos llegan desde
// Instagram y TikTok, así que el formato es el que ya conocen: pantallas que pasan
// solas con barritas arriba, tocar a la derecha avanza, a la izquierda vuelve, y
// mantener apretado pausa.
//
// Cada pantalla tiene UNA idea en tipografía gigante, alternando negro y amarillo
// como en la propuesta de campaña. Humito (la cara de la campaña) abre la historia.
//
// Aparece una vez por visita (sessionStorage). Al cerrarla queda abajo a la izquierda
// —del otro lado que WhatsApp— una pastilla con la cuenta regresiva que la reabre.
// Desde el jueves 5 no se muestra nada.
//
// Siempre "descartable" o el modelo, nunca "vape": así lo pide la campaña.

export { LINK_COMUNIDAD };

const CLAVE_VISTO = '028_cyber_popup_visto';
const DURACION = 5000;

// Grano de película, para que los fondos lisos no queden planos.
const GRANO = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";

const dosCifras = (n) => String(n).padStart(2, '0');

// EB Create, la línea con más margen: es la escalera que se muestra.
const ESCALERA = [['1', '$20.000'], ['2', '$19.000'], ['3', '$17.500'], ['5', '$16.000']];

function Eyebrow({ children, className = '' }) {
  return <p className={`text-[10px] font-semibold uppercase tracking-[0.32em] font-poppins ${className}`}>{children}</p>;
}

export default function SeccionCyber() {
  // Sin hora hasta montar, para que el servidor y el navegador dibujen lo mismo.
  const [ahora, setAhora] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState(0);
  const [pausa, setPausa] = useState(false);
  const apretado = useRef(0);

  useEffect(() => {
    setAhora(Date.now());
    const id = setInterval(() => setAhora(Date.now()), 1000);
    let visto = false;
    try { visto = sessionStorage.getItem(CLAVE_VISTO) === '1'; } catch {}
    const t = visto ? null : setTimeout(() => setAbierto(true), 1500);
    // El botón "Descubrí las ofertas" de la franja de arriba (ContadorCyber) la reabre.
    const reabrir = () => { setPaso(0); setAbierto(true); };
    window.addEventListener('cyber028:abrir', reabrir);
    return () => { clearInterval(id); if (t) clearTimeout(t); window.removeEventListener('cyber028:abrir', reabrir); };
  }, []);

  // Con la historia abierta la página de atrás no scrollea, y la burbuja de WhatsApp
  // (que quedaba encima del botón) se esconde.
  useEffect(() => {
    if (!abierto) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('cyber-abierto');
    return () => {
      document.body.style.overflow = antes;
      document.body.classList.remove('cyber-abierto');
    };
  }, [abierto]);

  if (ahora === null || ahora >= CYBER_FIN) return null;

  const activo = cyberActivo(ahora);
  const lanzamiento = enLanzamiento(ahora);
  const resta = Math.max(0, (activo ? CYBER_FIN : CYBER_INICIO) - ahora);
  const t = {
    d: Math.floor(resta / 86400000),
    h: Math.floor(resta / 3600000) % 24,
    m: Math.floor(resta / 60000) % 60,
    s: Math.floor(resta / 1000) % 60,
  };

  const pantallas = [
    // 1 · Apertura: Humito y la cuenta regresiva.
    {
      fondo: 'negro',
      contenido: (
        <>
          {/* Foto vertical, del mismo formato que la historia: Humito arriba con la
              bolsa y la parte de abajo oscura, que es donde va el texto. */}
          <div className="absolute inset-0">
            <Image src="/historia-cyber.webp" alt="" fill priority sizes="420px" className="object-cover object-top" />
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#070707] via-[#070707]/80 to-transparent" />
          </div>
          <div className="relative mt-auto">
            <Eyebrow className="text-white/60">Ofertas únicas · tiempo limitado</Eyebrow>
            <h2 id="cyber-028" className="font-bebas text-[88px] leading-[0.8] mt-3">Cyber <span className="text-[#fcdb00]">028</span></h2>
            {activo ? (
              <>
                <Eyebrow className="text-[#fcdb00]/90 mt-7">Ya empezó</Eyebrow>
                <p className="font-bebas text-[40px] leading-[0.9] mt-2.5">Nuevas ofertas<br /><span className="text-white/50">hasta el miércoles</span></p>
              </>
            ) : (
            <>
            <Eyebrow className="text-[#fcdb00]/90 mt-7">Arranca en</Eyebrow>
            <div className="flex mt-2.5">
              {[['d', 'Días'], ['h', 'Horas'], ['m', 'Min'], ['s', 'Seg']].map(([k, etiqueta], i) => (
                <div key={k} className={`flex-1 ${i > 0 ? 'pl-4 border-l border-white/15' : ''}`}>
                  <span className="block font-bebas text-[46px] leading-[0.85] tabular-nums">{dosCifras(t[k])}</span>
                  <span className="block mt-1.5 text-[8px] font-semibold uppercase tracking-[0.28em] text-white/45 font-poppins">{etiqueta}</span>
                </div>
              ))}
            </div>
            </>
            )}
          </div>
        </>
      ),
    },
    // 2 · Mystery Box: la novedad del Cyber, va primero.
    {
      fondo: 'amarillo',
      fantasma: '?',
      contenido: (
        <>
          <Eyebrow className="text-black/60 mt-16">Nadie sabe qué trae</Eyebrow>
          <div className="mt-auto">
            <p className="font-bebas text-[112px] leading-[0.78] tracking-[-0.01em]">Mystery<br />Box</p>
            <div className="mt-7 border-t border-black/20">
              {[['$50.000', 'Descartables'], ['$100.000', 'Elegís el estilo'], ['$200.000', 'La más grande']].map(([p, detalle]) => (
                <div key={p} className="flex items-baseline justify-between py-2.5 border-b border-black/15">
                  <span className="font-bebas text-[30px] leading-none">{p}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] font-poppins text-black/55">{detalle}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ),
      href: '/mystery-box',
      boton: 'Ver las Mystery Box',
    },
    // 3 · Envío gratis.
    {
      fondo: 'negro',
      fantasma: 'CABA',
      contenido: (
        <>
          <Eyebrow className="text-white/55 mt-16">Solo en CABA</Eyebrow>
          <div className="mt-auto">
            <p className="font-bebas text-[34px] leading-none text-white/90">Envío</p>
            <p className="font-bebas text-[140px] leading-[0.78] tracking-[-0.01em] text-[#fcdb00]">Gratis</p>
            <p className="font-bebas text-[30px] leading-[0.95] mt-3">Desde $100.000.<br /><span className="text-white/50">Juntate con tus amigos.</span></p>
            <p className="text-[12px] font-poppins text-white/55 mt-6 leading-relaxed">
              {lanzamiento || !activo
                ? <>Lunes de 00:00 a 04:00: <span className="text-white">sin mínimo</span>, pagando por transferencia.</>
                : 'Moto o Flash. Tandas de 15:30 y 18:30.'}
            </p>
          </div>
        </>
      ),
      href: '/catalogo',
    },
    // 4 · Precios progresivos.
    {
      fondo: 'amarillo',
      fantasma: 'x5',
      contenido: (
        <>
          <Eyebrow className="text-black/60 mt-16">Cuantas más llevás, menos pagás</Eyebrow>
          <div className="mt-auto">
            <p className="font-bebas text-[34px] leading-none">Descartables desde</p>
            <p className="font-bebas text-[106px] leading-[0.8] tracking-[-0.01em]">$16.000</p>
            <p className="font-bebas text-[26px] leading-none mt-2">c/u llevando 5</p>
            <div className="mt-8 grid grid-cols-4 border-t border-black/20">
              {ESCALERA.map(([q, precio], i) => (
                <div key={q} className={`pt-3 ${i > 0 ? 'pl-3 border-l border-black/15' : ''}`}>
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] font-poppins text-black/55">x{q}</span>
                  <span className={`block font-bebas text-[21px] leading-none mt-1 ${i === 3 ? '' : 'text-black/45 line-through decoration-1'}`}>{precio}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] font-poppins text-black/60 mt-3">EB Create 40K. Llevando 4, pagás al precio de 3.</p>
          </div>
        </>
      ),
      href: '/vapes',
    },
    // 5 · Combo Apple.
    {
      fondo: 'negro',
      fantasma: '-20K',
      contenido: (
        <>
          <Eyebrow className="text-white/55 mt-16">Apple · combos del Cyber</Eyebrow>
          <div className="mt-auto">
            <p className="font-bebas text-[34px] leading-none text-white/90">Combo Apple</p>
            <p className="font-bebas text-[106px] leading-[0.8] tracking-[-0.01em]">$58.000</p>
            <p className="font-bebas text-[26px] leading-[1.05] mt-3 text-white/60">AirPods Gen 4 + adaptador 35W + cable</p>
            <p className="font-bebas text-[30px] leading-none mt-5 text-[#fcdb00]">Ahorrás $20.000</p>
          </div>
        </>
      ),
      href: '/apple',
    },
    // 6 · Sorteo.
    {
      fondo: 'amarillo',
      fantasma: '028',
      contenido: (
        <>
          <Eyebrow className="text-black/60 mt-16">Sorteo CYBER 028</Eyebrow>
          <div className="mt-auto">
            <p className="font-bebas text-[106px] leading-[0.8] tracking-[-0.01em]">$50.000</p>
            <p className="font-bebas text-[34px] leading-none mt-2">en la web, para un comprador.</p>
            <div className="mt-8 border-t border-black/20">
              {['Comprá durante el Cyber', 'Sumate a la comunidad de WhatsApp', 'Ganador en vivo el jueves 5'].map((paso, i) => (
                <p key={paso} className="flex items-baseline gap-4 py-2.5 border-b border-black/15">
                  <span className="font-bebas text-[18px] leading-none text-black/45">0{i + 1}</span>
                  <span className="font-bebas text-[22px] leading-none">{paso}</span>
                </p>
              ))}
            </div>
          </div>
        </>
      ),
      href: '/sorteo50000',
      boton: 'Cómo participar',
    },
  ];

  const total = pantallas.length;
  const actual = pantallas[paso];
  const amarillo = actual.fondo === 'amarillo';

  const cerrar = () => {
    setAbierto(false);
    try { sessionStorage.setItem(CLAVE_VISTO, '1'); } catch {}
  };
  const abrir = () => { setPaso(0); setAbierto(true); };
  const ir = (n) => { setPaso(Math.max(0, Math.min(total - 1, n))); };

  return (
    <>
      {/* Pastilla flotante con la cuenta regresiva: abajo a la izquierda. */}
      {!abierto && (
        <button
          type="button"
          onClick={abrir}
          aria-label="Ver las ofertas del CYBER 028"
          className="cyber-flotante fixed bottom-6 left-4 md:bottom-8 md:left-8 z-[60] h-12 pl-4 pr-5 rounded-full bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/15 flex items-center gap-3 shadow-[0_14px_40px_rgba(0,0,0,0.45)] active:scale-95 transition-transform"
        >
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-[#fcdb00] cyber-pulso"></span>
            <span className="relative w-2 h-2 rounded-full bg-[#fcdb00]"></span>
          </span>
          <span className="font-bebas text-[19px] leading-none text-white tracking-wide">Cyber 028</span>
          <span className="w-px h-4 bg-white/20"></span>
          <span className="font-bebas text-[19px] leading-none text-[#fcdb00] tabular-nums tracking-wide">
            {activo ? 'Ver ofertas' : `${dosCifras(t.d * 24 + t.h)}:${dosCifras(t.m)}:${dosCifras(t.s)}`}
          </span>
        </button>
      )}

      {abierto && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-6" role="dialog" aria-modal="true" aria-labelledby="cyber-028">
          <button type="button" aria-label="Cerrar" onClick={cerrar} className="absolute inset-0 bg-black/85 backdrop-blur-md cyber-fondo" />

          <div
            className={`cyber-ventana relative w-full max-w-[420px] h-[min(760px,calc(100dvh-1.5rem))] rounded-[22px] overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.8)] transition-colors duration-500 ${amarillo ? 'bg-[#fcdb00] text-[#0a0a0a]' : 'bg-[#070707] text-white ring-1 ring-white/10'}`}
          >
            {/* Una sola pantalla a la vez; la clave fuerza la animación de entrada. */}
            <div key={paso} className="cyber-pantalla absolute inset-0 flex flex-col px-6 pt-6 pb-[104px]">
              {/* Una palabra gigante calada de fondo, para que la pantalla no quede vacía. */}
              {actual.fantasma && (
                <span
                  aria-hidden="true"
                  className={`cyber-fantasma pointer-events-none absolute right-[-0.06em] top-[86px] font-bebas leading-[0.8] whitespace-nowrap ${actual.fantasma.length > 3 ? 'text-[190px]' : 'text-[290px]'} ${amarillo ? 'text-black/[0.07]' : 'text-white/[0.06]'}`}
                >
                  {actual.fantasma}
                </span>
              )}
              {actual.contenido}
            </div>

            {/* Zonas para tocar: izquierda vuelve, derecha avanza; mantener pausa. */}
            <div
              className="absolute inset-x-0 top-14 bottom-[104px] flex"
              onPointerDown={() => { apretado.current = Date.now(); setPausa(true); }}
              onPointerUp={() => setPausa(false)}
              onPointerLeave={() => setPausa(false)}
            >
              <button type="button" aria-label="Anterior" className="w-1/3 h-full" onClick={() => { if (Date.now() - apretado.current < 300) ir(paso - 1); }} />
              <button type="button" aria-label="Siguiente" className="w-2/3 h-full" onClick={() => { if (Date.now() - apretado.current < 300) { if (paso < total - 1) ir(paso + 1); } }} />
            </div>

            {/* Barritas de progreso, como en las historias. */}
            <div className="absolute top-3 inset-x-3 flex gap-1.5">
              {pantallas.map((_, i) => (
                <span key={i} className={`h-[3px] flex-1 rounded-full overflow-hidden ${amarillo ? 'bg-black/15' : 'bg-white/20'}`}>
                  <span
                    className={`block h-full rounded-full ${amarillo ? 'bg-black' : 'bg-white'} ${i === paso ? 'cyber-barra' : ''}`}
                    style={i === paso
                      ? { animationDuration: `${DURACION}ms`, animationPlayState: pausa ? 'paused' : 'running' }
                      : { width: i < paso ? '100%' : '0%' }}
                    onAnimationEnd={() => { if (i === paso && paso < total - 1) ir(paso + 1); }}
                  />
                </span>
              ))}
            </div>
            <div className="absolute top-7 inset-x-4 flex items-center justify-between">
              <span className={`text-[10px] font-semibold uppercase tracking-[0.32em] font-poppins ${amarillo ? 'text-black/70' : 'text-white/75'}`}>028 Import</span>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className={`w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center transition-colors ${amarillo ? 'text-black hover:bg-black/10' : 'text-white hover:bg-white/10'}`}
              >
                <i className="fas fa-times text-[14px]"></i>
              </button>
            </div>

            {/* El botón queda siempre abajo; en cada pantalla lleva a lo suyo. */}
            <div className="absolute inset-x-0 bottom-0 px-6 pb-6 pt-4">
              {actual.href ? (
                <Link
                  href={actual.href}
                  prefetch={false}
                  onClick={cerrar}
                  target={actual.href.startsWith('http') ? '_blank' : undefined}
                  className={`flex items-center justify-center w-full h-14 font-bebas text-[23px] tracking-[0.08em] uppercase rounded-[10px] transition-colors ${amarillo ? 'bg-[#0a0a0a] text-[#fcdb00] hover:bg-black/85' : 'bg-[#fcdb00] text-[#0a0a0a] hover:bg-white'}`}
                >
                  {actual.boton || 'Ver ofertas'}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={paso === 0 ? () => ir(1) : cerrar}
                  className={`w-full h-14 font-bebas text-[23px] tracking-[0.08em] uppercase rounded-[10px] transition-colors ${amarillo ? 'bg-[#0a0a0a] text-[#fcdb00] hover:bg-black/85' : 'bg-[#fcdb00] text-[#0a0a0a] hover:bg-white'}`}
                >
                  {paso === 0 ? 'Ver las ofertas' : 'Ir a la tienda'}
                </button>
              )}
            </div>

            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay" style={{ backgroundImage: GRANO }} />
          </div>
        </div>
      )}
    </>
  );
}
