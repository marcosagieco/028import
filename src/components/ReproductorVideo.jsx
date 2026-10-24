"use client";

// Reproductor a pantalla completa para los videos de 028 Community, igual en
// iPhone, Android y compu, con controles de vidrio al estilo iOS.
//
// Por qué no se usa la pantalla completa del navegador: en el celular, una vez
// adentro, la capa que tienen las tarjetas encima del video bloqueaba los toques, y
// no se podía salir ni activar el sonido. Esto es una capa propia de la página:
// la X siempre funciona (y Esc en la compu).

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const formatoTiempo = (s) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const seg = Math.floor(s % 60);
  return `${m}:${String(seg).padStart(2, '0')}`;
};

// Los íconos de volumen no están en el set de íconos de la página: van dibujados acá.
const IconoVolumen = ({ silenciado }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    {silenciado ? (
      <path d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    ) : (
      <path d="M16 8.5a4.5 4.5 0 010 7M18.5 6a8 8 0 010 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    )}
  </svg>
);

const vidrio = 'bg-white/15 backdrop-blur-xl border border-white/25 shadow-[0_8px_24px_rgba(0,0,0,0.25)] text-white';

export default function ReproductorVideo({ video, inicio = 0, onCerrar }) {
  const ref = useRef(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [silenciado, setSilenciado] = useState(false);
  const [volumen, setVolumen] = useState(1);
  const [tiempo, setTiempo] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [velocidad, setVelocidad] = useState(1);
  const [controles, setControles] = useState(true);
  const reloj = useRef(null);

  // Los controles se esconden solos a los 3 segundos mientras el video corre.
  const mostrarControles = () => {
    setControles(true);
    clearTimeout(reloj.current);
    reloj.current = setTimeout(() => {
      if (ref.current && !ref.current.paused) setControles(false);
    }, 3000);
  };

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // Se abre con un toque, así que el navegador deja arrancar con sonido. Si
    // igual lo bloquea, arranca silenciado y el botón de volumen lo activa.
    if (inicio > 0) v.currentTime = inicio;
    v.muted = false;
    v.play().catch(() => { v.muted = true; setSilenciado(true); v.play().catch(() => {}); });
    mostrarControles();

    const scrollAntes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const teclas = (e) => {
      if (e.key === 'Escape') onCerrar();
      if (e.key === ' ') { e.preventDefault(); alternarPlay(); }
    };
    document.addEventListener('keydown', teclas);
    return () => {
      document.body.style.overflow = scrollAntes;
      document.removeEventListener('keydown', teclas);
      clearTimeout(reloj.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alternarPlay = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {}); else v.pause();
    mostrarControles();
  };

  const alternarSonido = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && v.volume === 0) { v.volume = 1; setVolumen(1); }
    setSilenciado(v.muted);
    mostrarControles();
  };

  const cambiarVolumen = (valor) => {
    const v = ref.current;
    if (!v) return;
    v.volume = valor;
    v.muted = valor === 0;
    setVolumen(valor);
    setSilenciado(valor === 0);
    mostrarControles();
  };

  const alternarVelocidad = () => {
    const v = ref.current;
    if (!v) return;
    const nueva = velocidad === 1 ? 2 : 1;
    v.playbackRate = nueva;
    setVelocidad(nueva);
    mostrarControles();
  };

  const irA = (segundos) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = segundos;
    setTiempo(segundos);
    mostrarControles();
  };

  const progreso = duracion ? (tiempo / duracion) * 100 : 0;

  // Va directo al body: dentro de las tarjetas (que giran en 3D) el fixed no cubriría la pantalla.
  return createPortal(
    <div
      className="fixed inset-0 z-[400] bg-black flex items-center justify-center select-none"
      role="dialog"
      aria-modal="true"
      aria-label={video.titulo || 'Video de 028 Community'}
      onPointerMove={mostrarControles}
    >
      <video
        ref={ref}
        src={video.videoUrl}
        poster={video.poster || undefined}
        playsInline
        className="w-full h-full object-contain"
        onClick={alternarPlay}
        onPlay={() => { setReproduciendo(true); mostrarControles(); }}
        onPause={() => { setReproduciendo(false); setControles(true); }}
        onTimeUpdate={(e) => setTiempo(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuracion(e.currentTarget.duration)}
        onEnded={() => setControles(true)}
      />

      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${controles ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Arriba: salir a la izquierda, volumen a la derecha */}
        <div className="absolute top-0 inset-x-0 p-4 pt-[max(1rem,env(safe-area-inset-top))] flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar video"
            className={`pointer-events-auto w-11 h-11 rounded-full flex items-center justify-center ${vidrio} active:scale-95 transition-transform`}
          >
            <i className="fas fa-times text-base" aria-hidden="true"></i>
          </button>
          <div className={`pointer-events-auto flex items-center gap-2 h-11 pl-1 pr-3 rounded-full ${vidrio}`}>
            <button
              type="button"
              onClick={alternarSonido}
              aria-label={silenciado ? 'Activar sonido' : 'Silenciar'}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
              <IconoVolumen silenciado={silenciado} />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={silenciado ? 0 : volumen}
              onChange={(e) => cambiarVolumen(Number(e.target.value))}
              aria-label="Volumen"
              className="w-20 md:w-24 h-1 accent-white cursor-pointer"
            />
          </div>
        </div>

        {/* Abajo: play/pausa, barra de reproducción y velocidad */}
        <div className="absolute bottom-0 inset-x-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className={`pointer-events-auto flex items-center gap-3 rounded-full pl-1.5 pr-1.5 h-14 ${vidrio}`}>
            <button
              type="button"
              onClick={alternarPlay}
              aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
              className="w-11 h-11 shrink-0 rounded-full bg-white/20 flex items-center justify-center active:scale-95 transition-transform"
            >
              <i className={`fas ${reproduciendo ? 'fa-pause' : 'fa-play ml-0.5'} text-base`} aria-hidden="true"></i>
            </button>
            <span className="text-[11px] font-semibold tabular-nums w-9 text-right shrink-0">{formatoTiempo(tiempo)}</span>
            <div className="relative flex-1 h-5 flex items-center">
              <div className="absolute inset-x-0 h-1 rounded-full bg-white/25" />
              <div className="absolute left-0 h-1 rounded-full bg-white" style={{ width: `${progreso}%` }} />
              <input
                type="range"
                min="0"
                max={duracion || 0}
                step="0.1"
                value={tiempo}
                onChange={(e) => irA(Number(e.target.value))}
                aria-label="Barra de reproducción"
                className="relative w-full h-5 opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-[11px] font-semibold tabular-nums w-9 shrink-0">{formatoTiempo(duracion)}</span>
            <button
              type="button"
              onClick={alternarVelocidad}
              aria-label={`Velocidad ${velocidad === 1 ? 'normal' : 'doble'}`}
              className={`h-9 px-3 shrink-0 rounded-full text-[12px] font-bold transition-colors ${velocidad === 2 ? 'bg-white text-[#111111]' : 'bg-white/20'}`}
            >
              {velocidad === 2 ? '2x' : '1x'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
