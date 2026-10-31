'use client';

import { useEffect, useRef, useState } from 'react';

// Ventana de Halloween que aparece al entrar a la portada: "¿Truco o trato?". Sale a
// los 3 segundos, para que primero se vea la tienda y se entienda que es una oferta.
//  - Trato: 5% OFF asegurado, para una compra.
//  - Truco: un giro de rodillo; 1 de cada 5 gana 10% OFF, si no, nada.
//
// Para llevarse cualquiera de los dos hay que registrarse (Google o email): cada
// cuenta juega una sola vez y recibe un código propio de un solo uso, que entrega
// /api/halloween (ahí también se hace el sorteo del truco). El código ganado queda
// guardado en este navegador y el carrito lo aplica solo, también en /checkout. La
// ventana aparece en cada visita hasta que la cuenta participa.
//
// Se muestra hasta el final del 31/10 (hora de Argentina) y después no aparece más:
// no hace falta sacarlo a mano.
const FIN = new Date('2026-11-01T00:00:00-03:00').getTime();

const CLAVE = '028_halloween';

/** Llama a /api/halloween como la cuenta `u` (Firebase). */
async function consultar(u, accion) {
  const token = await u.getIdToken();
  const r = await fetch('/api/halloween', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ accion }),
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.error || 'No se pudo conectar. Probá de nuevo.');
  return datos;
}

function leer() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch { return null; }
}
function guardar(datos) {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch {}
}

/** El cupón que ganó este navegador y todavía no usó, o null. */
export function cuponHalloweenGuardado() {
  const d = leer();
  return d && d.codigo && !d.usado ? d.codigo : null;
}

/** Después de un pedido con el cupón de Halloween: ya no se vuelve a aplicar solo. */
export function marcarCuponHalloweenUsado(codigo) {
  const d = leer();
  if (d && d.codigo && d.codigo === codigo) guardar({ ...d, usado: true });
}

// --- Rodillo del truco ---------------------------------------------------------
const FILA = 64;
const META = 41;
const GANA = '10% OFF';
const PIERDE = ['SIN PREMIO', 'SUSTO', 'NADA', 'CALABAZA VACÍA', 'MALDICIÓN', 'OTRA VEZ SERÁ'];

function armarFilas(final) {
  const filas = [];
  for (let i = 0; i < 44; i++) filas.push(i % 3 === 1 ? GANA : PIERDE[(i * 5 + 2) % PIERDE.length]);
  filas[0] = 'SUSTO'; filas[1] = GANA; filas[2] = 'SIN PREMIO';
  if (final) {
    filas[META] = final;
    filas[META - 1] = final === GANA ? 'SIN PREMIO' : GANA;
    filas[META + 1] = final === GANA ? 'NADA' : GANA;
  }
  return filas;
}

const dos = (n) => String(n).padStart(2, '0');

// --- Ilustraciones -------------------------------------------------------------
const MURCIELAGO = 'M60 18C58 12 56 10 55 5L53 12C50 11 48 12 46 14C40 8 30 4 16 6C22 10 24 16 22 22C18 18 12 18 6 22C2 24 0 28 0 30C6 26 12 27 16 32C20 27 28 27 32 34C36 28 44 28 48 34C51 30 55 28 60 30C65 28 69 30 72 34C76 28 84 28 88 34C92 27 100 27 104 32C108 27 114 26 120 30C120 28 118 24 114 22C108 18 102 18 98 22C96 16 98 10 104 6C90 4 80 8 74 14C72 12 70 11 67 12L65 5C64 10 62 12 60 18Z';
const CARA = 'M62 86L90 86L78 61ZM110 86L138 86L122 61ZM93 106L107 106L100 94ZM48 118Q100 152 152 118Q148 142 128 150L124 138L114 152L100 142L86 152L76 138L72 150Q52 142 48 118Z';

function Murcielago({ className = '', style, ancho }) {
  return (
    <span aria-hidden="true" className={`tt-murcielago absolute pointer-events-none ${className}`} style={style}>
      <svg width={ancho} height={ancho * 0.42} viewBox="0 0 120 50" fill="currentColor"><path d={MURCIELAGO} /></svg>
    </span>
  );
}

function Calabaza({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 200 184" style={{ overflow: 'visible' }} aria-hidden="true">
      <defs>
        <linearGradient id="tt-lobulo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#40220f" /><stop offset="0.55" stopColor="#1b0e06" /><stop offset="1" stopColor="#070403" /></linearGradient>
        <linearGradient id="tt-lobuloC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4f2b14" /><stop offset="0.6" stopColor="#1e1007" /><stop offset="1" stopColor="#080504" /></linearGradient>
        <linearGradient id="tt-tallo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7a6830" /><stop offset="1" stopColor="#2b2410" /></linearGradient>
        <radialGradient id="tt-fuego" cx="50%" cy="50%" r="60%"><stop offset="0" stopColor="#fff7cf" /><stop offset="0.45" stopColor="#ffc63d" /><stop offset="1" stopColor="#ff7a12" /></radialGradient>
        <filter id="tt-brillo" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id="tt-sombra" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <ellipse cx="100" cy="176" rx="80" ry="9" fill="#6a2000" opacity="0.5" filter="url(#tt-sombra)" />
      <path d="M95 32C93 19 97 8 108 2L115 8C106 13 104 21 106 32Z" fill="url(#tt-tallo)" />
      <path d="M107 12C121 3 136 9 132 20C129 28 119 25 123 18" fill="none" stroke="#4f4220" strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="50" cy="104" rx="45" ry="62" fill="url(#tt-lobulo)" />
      <ellipse cx="150" cy="104" rx="45" ry="62" fill="url(#tt-lobulo)" />
      <ellipse cx="74" cy="102" rx="42" ry="70" fill="url(#tt-lobulo)" stroke="#000" strokeOpacity="0.5" />
      <ellipse cx="126" cy="102" rx="42" ry="70" fill="url(#tt-lobulo)" stroke="#000" strokeOpacity="0.5" />
      <ellipse cx="100" cy="102" rx="38" ry="75" fill="url(#tt-lobuloC)" stroke="#000" strokeOpacity="0.55" />
      <path d="M12 86C15 63 28 48 46 43M40 48C47 38 58 33 70 32M84 30C90 28 96 27 102 27" fill="none" stroke="#ffb27a" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
      <g className="tt-cara">
        <path filter="url(#tt-brillo)" fill="#ffb02e" opacity="0.85" d={CARA} />
        <path fill="#5c1d00" transform="translate(0 -3)" d={CARA} />
        <path fill="url(#tt-fuego)" d={CARA} />
      </g>
    </svg>
  );
}

function CalabazaChica() {
  return (
    <svg aria-hidden="true" width="16" height="15" viewBox="0 0 100 92" className="shrink-0">
      <path fill="#ff6b1a" d="M47 18C46 9 49 3 56 0L59 5C55 7 53 12 54 18Z" />
      <ellipse fill="#ff6b1a" cx="30" cy="55" rx="26" ry="33" />
      <ellipse fill="#ff6b1a" cx="70" cy="55" rx="26" ry="33" />
      <ellipse fill="#ff6b1a" cx="50" cy="55" rx="23" ry="37" />
      <path fill="#0c0c0c" d="M27 46L40 46L34 33ZM60 46L73 46L66 33ZM23 63Q50 80 77 63Q74 76 63 79L60 72L55 80L45 80L40 72L37 79Q26 76 23 63Z" />
    </svg>
  );
}

function Luna({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id="tt-luna" cx="38%" cy="34%" r="72%"><stop offset="0" stopColor="#fffaf0" /><stop offset="0.55" stopColor="#efe3bd" /><stop offset="1" stopColor="#b3a070" /></radialGradient>
        <filter id="tt-crater" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" /></filter>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#tt-luna)" />
      <g fill="#9c8a5c" opacity="0.38" filter="url(#tt-crater)">
        <circle cx="40" cy="44" r="10" /><circle cx="80" cy="34" r="6" /><circle cx="72" cy="80" r="13" />
        <circle cx="34" cy="84" r="5" /><circle cx="94" cy="62" r="4" /><circle cx="56" cy="22" r="3" />
      </g>
    </svg>
  );
}

function Arana({ className = '', hilo, tamano = 34 }) {
  return (
    <span aria-hidden="true" className={`tt-arana absolute top-0 flex flex-col items-center pointer-events-none ${className}`}>
      <span className="block w-px" style={{ height: hilo, background: 'linear-gradient(rgba(255,255,255,0.05), rgba(255,255,255,0.45))' }} />
      <svg width={tamano} height={tamano} viewBox="0 0 40 40" style={{ marginTop: -tamano * 0.18 }}>
        <defs><radialGradient id="tt-arana" cx="38%" cy="30%" r="75%"><stop offset="0" stopColor="#a5a5a5" /><stop offset="0.5" stopColor="#3a3a3a" /><stop offset="1" stopColor="#121212" /></radialGradient></defs>
        <path d="M16 17Q9 9 5 12L1 18M16 19Q8 15 4 20L2 26M16 22Q9 22 6 28L5 34M17 25Q12 28 11 34L12 39M24 17Q31 9 35 12L39 18M24 19Q32 15 36 20L38 26M24 22Q31 22 34 28L35 34M23 25Q28 28 29 34L28 39" fill="none" stroke="#8c8c8c" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="20" cy="14" rx="4.5" ry="4" fill="url(#tt-arana)" />
        <ellipse cx="20" cy="25" rx="7" ry="8.5" fill="url(#tt-arana)" />
        <ellipse cx="17.6" cy="22" rx="1.8" ry="3" fill="#ffffff" opacity="0.22" />
        <circle cx="18.6" cy="13" r="0.9" fill="#ff6b1a" /><circle cx="21.4" cy="13" r="0.9" fill="#ff6b1a" />
      </svg>
    </span>
  );
}

function Flecha() {
  return (
    <svg aria-hidden="true" width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 7h20M14 1l6 6-6 6" /></svg>
  );
}

function Cerrar({ onClick, className = '' }) {
  return (
    <button type="button" aria-label="Cerrar" onClick={onClick} className={`w-11 h-11 shrink-0 flex items-center justify-center text-white/70 hover:text-white transition-colors ${className}`}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  );
}

// El código como un ticket troquelado: el código a la izquierda, "Copiar" del otro
// lado del corte.
function Codigo({ codigo, descuento }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(codigo); setCopiado(true); } catch {}
  };
  return (
    <div className="relative flex items-stretch rounded-[4px] border border-[#fcdb00]/35" style={{ background: 'linear-gradient(120deg, #1f1c11 0%, #12110c 55%, #0d0d0b 100%)', boxShadow: '0 0 34px rgba(252,219,0,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
      <div className="flex-1 min-w-0 px-4 md:px-5 py-3.5 md:py-4">
        <span className="block text-[9.5px] md:text-[10px] font-semibold tracking-[0.28em] uppercase text-white/50">Tu código · {descuento}% OFF</span>
        <span className="tt-neon-fila block mt-1.5 font-bebas text-[38px] md:text-[44px] leading-none tracking-[4px]">{codigo}</span>
        <span className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-white/60">
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fcdb00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg>
          Ya aplicado en tu carrito
        </span>
      </div>
      <span aria-hidden="true" className="relative w-0 border-l border-dashed border-[#fcdb00]/30 my-3">
        <span className="absolute -top-[19px] -left-[9px] w-[18px] h-[18px] rounded-full bg-[#0c0c0c] border-b border-[#fcdb00]/35" />
        <span className="absolute -bottom-[19px] -left-[9px] w-[18px] h-[18px] rounded-full bg-[#0c0c0c] border-t border-[#fcdb00]/35" />
      </span>
      <button type="button" onClick={copiar} className="w-[86px] md:w-[96px] shrink-0 flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold tracking-[0.22em] uppercase text-white/85 hover:text-white transition-colors">
        {copiado ? (
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fcdb00" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg>
        ) : (
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="1.5" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" /></svg>
        )}
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}

function Dato({ titulo, valor, primero }) {
  return (
    <div className={`flex-1 min-w-0 px-3 md:px-4 ${primero ? 'pl-0 md:pl-0' : 'border-l border-white/10'}`}>
      <span className="block text-[8.5px] md:text-[9.5px] font-semibold tracking-[0.24em] uppercase text-white/45 whitespace-nowrap">{titulo}</span>
      <span className="block mt-1 font-bebas text-[22px] md:text-[24px] leading-none tracking-[1px] text-white">{valor}</span>
    </div>
  );
}

const BOTON_AMARILLO = 'tt-cta tt-cta-claro w-full h-14 px-5 md:px-[22px] flex items-center justify-between rounded-[2px] font-bebas text-[24px] tracking-[1.8px] leading-none text-[#111111]';
const ESTILO_AMARILLO = { background: 'linear-gradient(#ffe74a, #f5c800)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 16px 36px rgba(252,219,0,0.18)' };

export default function TrucoOTrato({ usuario, authAbierto, onGoogle, onEmail, onCupon }) {
  const [abierto, setAbierto] = useState(false);
  const [pantalla, setPantalla] = useState('elegir');
  const [fase, setFase] = useState('listo');
  const [gano, setGano] = useState(false);
  const [premio, setPremio] = useState(null);         // { codigo, descuento, usado }
  const [yaJugado, setYaJugado] = useState(null);     // lo que la cuenta jugó antes
  const [pendiente, setPendiente] = useState(null);   // lo que eligió antes de registrarse
  const [esperandoEmail, setEsperandoEmail] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [filas, setFilas] = useState(() => armarFilas(null));
  const [rodillo, setRodillo] = useState({ y: 0, trans: 'none' });
  const [ahora, setAhora] = useState(null);
  const timers = useRef([]);

  // Modo prueba (?prueba=perder): el truco siempre pierde, sin cuenta ni servidor, y
  // se puede girar las veces que se quiera. Sólo anda en la compu o
  // en la red de casa (localhost / 192.168.x.x / 10.x.x.x), nunca en la web publicada.
  const [modoPrueba] = useState(() => {
    if (typeof window === 'undefined') return false;
    const local = /^(localhost|127\.|192\.168\.|10\.)/.test(window.location.hostname);
    return local && new URLSearchParams(window.location.search).get('prueba') === 'perder';
  });
  const registrado = (!!usuario && !usuario.isAnonymous) || modoPrueba;

  // Aparece en cada visita, aunque la hayan cerrado antes. La única excepción es una
  // cuenta que ya participó: a esa no se le vuelve a ofrecer. Se mira la sesión al
  // momento de abrir (3 s después de entrar), cuando el login ya suele estar resuelto.
  const usuarioRef = useRef(usuario);
  usuarioRef.current = usuario;
  useEffect(() => {
    if (Date.now() >= FIN) return;
    let vivo = true;
    const t = setTimeout(async () => {
      const u = usuarioRef.current;
      if (u && !u.isAnonymous && !modoPrueba) {
        try {
          const r = await consultar(u, 'estado');
          if (r?.participacion) return;
        } catch {}
      }
      if (vivo) setAbierto(true);
    }, 3000);
    return () => { vivo = false; clearTimeout(t); };
  }, []);

  useEffect(() => {
    if (!abierto) return;
    setAhora(Date.now());
    const id = setInterval(() => setAhora(Date.now()), 1000);
    // La página de atrás se traba igual que con el carrito: fijando el body donde
    // estaba. Con sólo overflow:hidden, en el celular la página igual se movía y el
    // menú (sticky) se iba, dejando la franja fija del Cyber Monday suelta en el medio.
    const scrollY = window.scrollY;
    const { body } = document;
    const prev = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width, overflow: body.style.overflow };
    Object.assign(body.style, { position: 'fixed', top: `-${scrollY}px`, left: '0', right: '0', width: '100%', overflow: 'hidden' });
    // Mientras está abierta, el botón verde de WhatsApp se esconde: se veía como una
    // mancha verde a través del oscurecido.
    body.classList.add('tt-abierto');
    const tecla = (e) => { if (e.key === 'Escape') cerrar(); };
    window.addEventListener('keydown', tecla);
    return () => {
      clearInterval(id);
      body.classList.remove('tt-abierto');
      Object.assign(body.style, prev);
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', tecla);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Si la cuenta ya jugó (en otro navegador o celular), la ventana no se ofrece de nuevo.
  useEffect(() => {
    if (!registrado || !abierto || pantalla !== 'elegir' || pendiente) return;
    let vivo = true;
    pedir('estado').then((r) => {
      if (vivo && r?.participacion) {
        guardar({ codigo: r.participacion.usado ? null : r.participacion.codigo, fecha: Date.now() });
        setAbierto(false);
      }
    }).catch(() => {});
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrado, abierto]);

  // Se registró: sigue solo con lo que había elegido.
  useEffect(() => {
    if (!registrado || !pendiente) return;
    const eleccion = pendiente;
    setPendiente(null);
    setEsperandoEmail(false);
    if (eleccion === 'trato') jugarTrato();
    else irAlTruco();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrado, pendiente]);

  // Vuelve la ventana después del formulario de email: se haya registrado (sigue
  // donde estaba) o lo haya cerrado sin hacerlo (vuelve a este paso).
  useEffect(() => {
    if (esperandoEmail && (registrado || !authAbierto)) setEsperandoEmail(false);
  }, [esperandoEmail, authAbierto, registrado]);

  if (!abierto || esperandoEmail) return null;

  function cerrar() {
    setAbierto(false);
  }

  function pedir(accion) {
    return consultar(usuario, accion);
  }

  const ganarCupon = (codigo) => {
    guardar({ codigo, fecha: Date.now() });
    onCupon?.(codigo);
  };

  // La cuenta ya había jugado: se le muestra lo que le tocó, no se juega de nuevo.
  const mostrarYaJugado = (p) => {
    setYaJugado(p);
    guardar({ codigo: p.usado ? null : p.codigo, fecha: Date.now() });
    if (p.codigo && !p.usado) onCupon?.(p.codigo);
    setPantalla('ya');
  };

  async function jugarTrato() {
    setError('');
    setCargando(true);
    try {
      const r = await pedir('trato');
      if (r.repetido) return mostrarYaJugado(r.participacion);
      setPremio({ codigo: r.participacion.codigo, descuento: r.participacion.descuento });
      ganarCupon(r.participacion.codigo);
      setPantalla('trato');
    } catch (e) {
      setError(e.message);
      setPantalla('registro');
    } finally {
      setCargando(false);
    }
  }

  function irAlTruco() {
    setError('');
    setFilas(armarFilas(null));
    setRodillo({ y: 0, trans: 'none' });
    setFase('listo');
    setPantalla('truco');
  }

  // Para cualquiera de los dos descuentos hay que tener cuenta: así cada persona
  // juega una vez y no puede sacar códigos sin fin cerrando y volviendo a entrar.
  // El truco va directo a la ruleta y el registro se pide ahí mismo, en lugar del
  // botón de girar; el trato pasa por su pantalla de registro.
  const elegir = (eleccion) => {
    setError('');
    if (eleccion === 'truco') return irAlTruco();
    if (!registrado) {
      setPendiente('trato');
      setPantalla('registro');
      return;
    }
    jugarTrato();
  };

  const girar = async () => {
    if (fase !== 'listo') return;
    setError('');
    setFase('girando');
    let r;
    try {
      r = modoPrueba
        ? { participacion: { gano: false } }
        : await pedir('truco');   // el sorteo lo hace el servidor
    } catch (e) {
      setError(e.message);
      setFase('listo');
      return;
    }
    if (r.repetido) { setFase('listo'); return mostrarYaJugado(r.participacion); }
    const salio = r.participacion.gano;
    const final = salio ? GANA : ['SIN PREMIO', 'SUSTO', 'NADA'][Math.floor(Math.random() * 3)];
    setGano(salio);
    setFilas(armarFilas(final));
    setRodillo({ y: 0, trans: 'none' });
    timers.current.push(setTimeout(() => setRodillo({ y: -(META - 1) * FILA, trans: 'transform 3.8s cubic-bezier(0.1, 0.65, 0.15, 1)' }), 40));
    timers.current.push(setTimeout(() => {
      setFase('fin');
      if (salio) {
        setPremio({ codigo: r.participacion.codigo, descuento: r.participacion.descuento });
        ganarCupon(r.participacion.codigo);
      } else {
        if (!modoPrueba) guardar({ codigo: null, eleccion: 'truco', perdio: true, fecha: Date.now() });
      }
    }, 4000));
  };

  const registrarConEmail = (modo) => {
    setEsperandoEmail(true);
    onEmail?.(modo);
  };

  // Los botones para registrarse: en la pantalla del trato y, en el truco, dentro de
  // la misma ruleta en lugar del botón de girar.
  const botonesRegistro = (margen) => (
    <>
      <button
        type="button"
        disabled={cargando}
        onClick={async () => { setError(''); setCargando(true); try { await onGoogle?.(); } finally { setCargando(false); } }}
        className={`tt-cta ${margen} w-full h-14 flex items-center justify-center gap-3 rounded-[2px] bg-white text-[#111111] font-bebas text-[23px] tracking-[1.6px] leading-none disabled:opacity-70`}
        style={{ boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.08), 0 16px 34px rgba(0,0,0,0.45)' }}
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" /></svg>
        {cargando ? 'Un momento…' : 'Continuar con Google'}
      </button>
      <button
        type="button"
        disabled={cargando}
        onClick={() => registrarConEmail('register')}
        className="tt-cta tt-cta-oscuro mt-3 w-full h-14 flex items-center justify-center gap-3 rounded-[2px] border border-white/20 text-white font-bebas text-[23px] tracking-[1.6px] leading-none disabled:opacity-70"
        style={{ background: 'linear-gradient(#1f1f1f, #080808)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.09)' }}
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M3.5 6l8.5 7 8.5-7" /></svg>
        Registrarme con mi email
      </button>

      {error && <p className="mt-3 text-center text-[12px] font-semibold text-[#ff7a2a]">{error}</p>}

      <p className="mt-4 text-center text-[12px] md:text-[13px] font-medium text-white/55">
        ¿Ya tenés cuenta?{' '}
        <button type="button" onClick={() => registrarConEmail('login')} className="font-semibold text-white underline underline-offset-4 decoration-white/30 hover:decoration-white">Iniciá sesión</button>
      </p>
    </>
  );

  const resta = ahora === null ? 0 : Math.max(0, Math.floor((FIN - ahora) / 1000));
  const cuenta = ahora === null ? '--:--:--' : `${dos(Math.floor(resta / 3600))}:${dos(Math.floor(resta / 60) % 60)}:${dos(resta % 60)}`;
  return (
    <div className="tt-fondo fixed inset-0 z-[400] flex items-center justify-center bg-black/60 md:bg-black/80 px-2 md:p-6 font-poppins text-white" onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
      {pantalla === 'elegir' ? (
        // En el celular es un cartel de oferta en el medio, con la tienda a la vista
        // alrededor; en la compu, la ventana grande. Las dos mitades siempre lado a lado.
        <div role="dialog" aria-modal="true" aria-label="¿Truco o trato?" className="tt-ventana relative flex flex-col w-full max-w-[460px] md:max-w-none md:w-[960px] md:h-[680px] max-h-[calc(100dvh-16px)] md:max-h-[calc(100dvh-48px)] overflow-y-auto md:overflow-hidden rounded-[4px] bg-[#0c0c0c] shadow-[0_30px_90px_rgba(0,0,0,0.75)]">

          <div className="shrink-0 flex items-center justify-between gap-2 md:gap-6 pl-4 pr-1 md:pl-9 md:pr-5 py-2.5 md:py-0 md:h-20 border-b border-white/10" style={{ background: 'linear-gradient(#141414, #0c0c0c)' }}>
            <div className="min-w-0">
              <p className="md:hidden flex items-center gap-1.5 text-[8.5px] font-semibold tracking-[0.2em] uppercase text-[#ff7a2a]"><CalabazaChica />Oferta de Halloween</p>
              <div className="md:flex md:items-baseline md:gap-[18px]">
                <h2 className="mt-0.5 md:mt-0 font-bebas text-[27px] md:text-[44px] leading-none tracking-[1px] whitespace-nowrap">¿Truco o trato?</h2>
                <p className="mt-0.5 md:mt-0 text-[11px] md:text-[16px] font-medium text-white/75 whitespace-nowrap">Elegí cómo querés tu descuento.</p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-[22px]">
              <div className="flex flex-col md:flex-row items-end md:items-baseline gap-0.5 md:gap-2.5 pr-2 md:pr-[22px] border-r border-white/10">
                <span className="text-[7.5px] md:text-[11px] font-semibold tracking-[0.2em] md:tracking-[0.24em] uppercase text-white/55 whitespace-nowrap">Termina en</span>
                <span className="font-bebas text-[19px] md:text-[28px] leading-none tracking-[1px] md:tracking-[1.5px] text-[#ff7a2a] tabular-nums">{cuenta}</span>
              </div>
              <Cerrar onClick={cerrar} />
            </div>
          </div>

          <div className="relative md:flex-1 min-h-0 flex flex-row">

            <button type="button" onClick={() => elegir('trato')} className="tt-mitad relative overflow-hidden flex-1 min-w-0 min-h-[300px] md:min-h-0 flex flex-col justify-between gap-3 md:gap-0 text-left text-[#0c0c0c] px-3.5 pt-3.5 pb-3.5 md:px-9 md:pt-[30px] md:pb-8" style={{ background: 'radial-gradient(95% 80% at 84% 16%, #ff9545 0%, #ff6b1a 46%, #e0500a 100%)' }}>
              <span aria-hidden="true" className="absolute -top-[70px] -right-[70px] w-[220px] h-[220px] md:w-[340px] md:h-[340px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(255,226,140,0.55), rgba(255,226,140,0))' }} />
              <span className="absolute top-2.5 right-2.5 md:top-4 md:right-[22px] pointer-events-none">
                <Calabaza className="w-[52px] h-[48px] md:w-[156px] md:h-[144px]" />
              </span>
              <span className="tt-e1 relative block">
                <span className="block font-bebas text-[26px] md:text-[40px] leading-[0.9] tracking-[1px]">Trato</span>
                <span className="tt-etiqueta mt-1.5 md:mt-2.5 inline-flex items-center gap-1.5 md:gap-2.5 text-[8.5px] md:text-[12px] font-semibold tracking-[0.14em] md:tracking-[0.18em] uppercase text-[#0c0c0c]/80 whitespace-nowrap">
                  <span className="md:hidden">Sin sorteo</span><span className="hidden md:inline">Descuento fijo · sin sorteo</span>
                </span>
              </span>
              <span className="tt-e2 relative flex items-end gap-1.5 md:gap-2.5 -ml-0.5 md:-ml-1.5">
                <span className="font-bebas text-[72px] md:text-[210px] leading-[0.78] tracking-[-1px] md:tracking-[-4px]" style={{ textShadow: '0 22px 44px rgba(110,30,0,0.28)' }}>5%</span>
                <span className="font-bebas text-[20px] md:text-[44px] leading-none pb-0.5 md:pb-1.5">Off</span>
              </span>
              <span className="tt-e3 relative block w-full">
                <span className="block font-bebas text-[26px] md:text-[36px] leading-[0.9]">Asegurado.</span>
                <span className="block mt-1.5 md:mt-2 max-w-[340px] text-[12px] md:text-[16px] leading-[1.4] md:leading-[1.45] font-medium text-[#0c0c0c]/80">
                  Lo elegís y ya es tuyo. 5% en toda la tienda, para una compra.
                </span>
                <span className="tt-cta tt-cta-oscuro mt-3 md:mt-[22px] flex items-center justify-center md:justify-between w-full h-11 md:h-14 px-2 md:px-[22px] rounded-[2px] font-bebas text-[18px] md:text-[25px] tracking-[1.2px] md:tracking-[1.6px] leading-none text-[#ff7a2a] whitespace-nowrap" style={{ background: 'linear-gradient(#1f1f1f, #080808)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.09), 0 16px 32px rgba(90,25,0,0.4)' }}>
                  Quiero mi 5%<span className="hidden md:block"><Flecha /></span>
                </span>
              </span>
            </button>

            <button type="button" onClick={() => elegir('truco')} className="tt-mitad relative overflow-hidden flex-1 min-w-0 min-h-[300px] md:min-h-0 flex flex-col justify-between gap-3 md:gap-0 text-left text-white px-3.5 pt-3.5 pb-3.5 md:px-9 md:pt-[30px] md:pb-8" style={{ background: 'radial-gradient(75% 60% at 82% 14%, #26231c 0%, #131210 45%, #0a0a0a 100%)' }}>
              <span aria-hidden="true" className="tt-niebla absolute -left-[20%] -right-[20%] -bottom-[60px] h-[200px] md:h-[260px] pointer-events-none" style={{ background: 'radial-gradient(50% 60% at 30% 100%, rgba(255,255,255,0.07), rgba(255,255,255,0) 70%), radial-gradient(45% 55% at 78% 100%, rgba(255,255,255,0.05), rgba(255,255,255,0) 70%)' }} />
              <span aria-hidden="true" className="tt-luz-neon absolute -left-[40px] md:-left-[60px] top-[30px] md:top-[110px] w-[280px] md:w-[520px] h-[200px] md:h-[320px] pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(252,219,0,0.14), rgba(252,219,0,0))' }} />
              <span aria-hidden="true" className="absolute -top-[50px] -right-[50px] w-[180px] h-[180px] md:w-[300px] md:h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(239,227,189,0.16), rgba(239,227,189,0))' }} />
              <span className="absolute top-3 right-3 md:top-6 md:right-9 pointer-events-none">
                <Luna className="w-[42px] h-[42px] md:w-[116px] md:h-[116px]" />
              </span>
              <Murcielago ancho={64} className="hidden md:block text-[#0c0c0c] top-[66px] right-[58px]" style={{ '--r': '-8deg' }} />
              <Murcielago ancho={26} className="md:hidden text-[#0c0c0c] top-[24px] right-[11px]" style={{ '--r': '-8deg' }} />
              <Murcielago ancho={34} className="hidden md:block text-[#4a4a4a] top-[170px] right-[116px]" style={{ '--r': '10deg', animationDelay: '-1.6s' }} />
              <Murcielago ancho={24} className="md:hidden text-[#5a5a5a] top-[70px] right-[18px]" style={{ '--r': '10deg', animationDelay: '-1.6s' }} />
              <Murcielago ancho={22} className="hidden md:block text-[#6a6a6a] top-[214px] right-[40px]" style={{ '--r': '-12deg', animationDelay: '-2.8s', opacity: 0.6, filter: 'blur(0.7px)' }} />
              <Murcielago ancho={16} className="md:hidden text-[#6a6a6a] top-[98px] right-[52px]" style={{ '--r': '-12deg', animationDelay: '-2.8s', opacity: 0.6, filter: 'blur(0.5px)' }} />
              <Arana hilo={94} className="hidden md:flex right-[216px]" />
              <Arana hilo={16} tamano={26} className="md:hidden right-[64px]" />

              <span className="tt-e1 relative block">
                <span className="block font-bebas text-[26px] md:text-[40px] leading-[0.9] tracking-[1px]">Truco</span>
                <span className="tt-etiqueta mt-1.5 md:mt-2.5 inline-flex items-center gap-1.5 md:gap-2.5 text-[8.5px] md:text-[12px] font-semibold tracking-[0.14em] md:tracking-[0.18em] uppercase text-white/70 whitespace-nowrap">
                  <span className="md:hidden">Por sorteo</span><span className="hidden md:inline">Descuento por sorteo</span>
                </span>
              </span>
              <span className="tt-e2 relative flex items-end gap-1.5 md:gap-2.5 -ml-0.5 md:-ml-1.5">
                <span className="tt-contorno font-bebas text-[72px] md:text-[210px] leading-[0.78] tracking-[-1px] md:tracking-[-4px]">10%</span>
                <span className="tt-neon-off font-bebas text-[20px] md:text-[44px] leading-none pb-0.5 md:pb-1.5">Off</span>
              </span>
              <span className="tt-e3 relative block w-full">
                <span className="block font-bebas text-[26px] md:text-[36px] leading-[0.9]">O nada.</span>
                <span className="block mt-1.5 md:mt-2 max-w-[360px] text-[12px] md:text-[16px] leading-[1.4] md:leading-[1.45] font-medium text-white/75">
                  Girás y la suerte decide: 1 de cada 5 gana el 10%. Si no sale, te quedás sin descuento.
                </span>
                <span className="tt-cta tt-cta-claro mt-3 md:mt-[22px] flex items-center justify-center md:justify-between w-full h-11 md:h-14 px-2 md:px-[22px] rounded-[2px] font-bebas text-[18px] md:text-[25px] tracking-[1.2px] md:tracking-[1.6px] leading-none text-[#0c0c0c] whitespace-nowrap" style={ESTILO_AMARILLO}>
                  Girar por el 10%<span className="hidden md:block"><Flecha /></span>
                </span>
              </span>
            </button>
          </div>

          <div className="shrink-0 h-8 md:h-11 flex items-center justify-center md:justify-between px-3 md:px-9 border-t border-white/10 text-[8px] md:text-[12px] font-semibold tracking-[0.14em] md:tracking-[0.16em] uppercase text-white/60">
            <span className="hidden md:flex items-center gap-2.5"><CalabazaChica />Halloween 31.10 · 028 Import</span>
            <span className="whitespace-nowrap">Un intento por cuenta · Una compra · No acumulable</span>
          </div>
          <span aria-hidden="true" className="tt-grano" />
        </div>
      ) : (
        <div role="dialog" aria-modal="true" aria-label="¿Truco o trato?" className="tt-ventana relative w-full max-w-[460px] md:max-w-[560px] max-h-[calc(100dvh-16px)] overflow-y-auto overflow-x-hidden rounded-[4px] bg-[#0c0c0c] shadow-[0_40px_120px_rgba(0,0,0,0.75)]">
          {/* Fondo: luz de luna en el truco, luz de calabaza en el trato. */}
          <span aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: (pantalla === 'truco' || (pantalla === 'registro' && pendiente === 'truco') || (pantalla === 'ya' && yaJugado?.eleccion === 'truco'))
            ? 'radial-gradient(70% 45% at 88% 8%, #27231b 0%, #121110 50%, #0a0a0a 100%)'
            : 'radial-gradient(70% 45% at 88% 8%, #3a1c08 0%, #160c06 50%, #0a0a0a 100%)' }} />

          <div className="relative flex items-center justify-between gap-3 h-12 md:h-14 pl-5 md:pl-9 pr-1.5 md:pr-3 border-b border-white/10">
            <p className="flex items-center gap-2.5 text-[9.5px] md:text-[10.5px] font-semibold tracking-[0.28em] uppercase text-white/60 whitespace-nowrap"><CalabazaChica />Halloween 31.10 · 028 Import</p>
            <Cerrar onClick={cerrar} className="text-white/55" />
          </div>

          {pantalla === 'registro' && (
            <div className="relative px-5 md:px-9 pt-6 md:pt-8 pb-6 md:pb-8">
              <span className="tt-e1 tt-etiqueta relative inline-flex items-center gap-2 text-[10px] md:text-[11px] font-semibold tracking-[0.22em] uppercase text-[#ff7a2a]">Último paso</span>
              <h2 className="tt-e1 relative mt-2 font-bebas text-[56px] md:text-[76px] leading-[0.86] tracking-[0.5px]">Registrate y<br />es tuyo.</h2>
              <p className="tt-e2 relative mt-3 mb-5 md:mb-6 max-w-[420px] text-[14px] md:text-[16px] leading-relaxed font-medium text-white/75">
                Para que cada persona juegue una sola vez, el descuento queda guardado en tu cuenta. Es gratis y tarda unos segundos.
              </p>

              <div className="tt-e3 relative">
                <div className="flex items-center justify-between gap-4 px-4 md:px-5 py-3.5 rounded-[4px] border border-white/12" style={{ background: 'linear-gradient(120deg, #1a1a1a, #0e0e0e)' }}>
                  <span>
                    <span className="block text-[9.5px] md:text-[10px] font-semibold tracking-[0.26em] uppercase text-white/45">Elegiste</span>
                    <span className="block mt-1 font-bebas text-[28px] md:text-[32px] leading-none tracking-[1px]">{pendiente === 'truco' ? 'Truco' : 'Trato'}</span>
                  </span>
                  <span className="text-right">
                    <span className={`block font-bebas text-[32px] md:text-[38px] leading-none tracking-[1px] ${pendiente === 'truco' ? 'tt-neon-fila' : 'text-[#ff7a2a]'}`}>{pendiente === 'truco' ? '10% OFF' : '5% OFF'}</span>
                    <span className="block mt-1 text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-white/45">{pendiente === 'truco' ? 'O nada · 1 de 5' : 'Asegurado'}</span>
                  </span>
                </div>

                {botonesRegistro('mt-5')}
                <button type="button" onClick={() => { setPendiente(null); setError(''); setPantalla('elegir'); }} className="mt-2 w-full h-10 text-[10px] md:text-[11px] font-semibold tracking-[0.22em] uppercase text-white/40 hover:text-white/70 transition-colors">
                  Cambiar de opción
                </button>
              </div>
            </div>
          )}

          {pantalla === 'ya' && yaJugado && (
            <div className="relative px-5 md:px-9 pt-6 md:pt-8 pb-6 md:pb-8">
              <span className="tt-e1 tt-etiqueta relative inline-flex items-center gap-2 text-[10px] md:text-[11px] font-semibold tracking-[0.22em] uppercase text-[#ff7a2a]">Ya participaste</span>
              <h2 className="tt-e1 relative mt-2 font-bebas text-[60px] md:text-[80px] leading-[0.85] tracking-[0.5px]">
                {yaJugado.gano ? (yaJugado.usado ? 'Ya lo usaste.' : 'Ya es tuyo.') : 'Ya jugaste.'}
              </h2>
              <p className="tt-e2 relative mt-3 mb-6 max-w-[420px] text-[14px] md:text-[16px] leading-relaxed font-medium text-white/75">
                {yaJugado.gano
                  ? (yaJugado.usado
                    ? 'Esta cuenta ya usó su descuento de Halloween en una compra. Es uno por persona.'
                    : `Esta cuenta ya participó y le tocó ${yaJugado.descuento}% OFF. Tu código sigue disponible para una compra.`)
                  : 'Esta cuenta ya jugó el truco y esta vez no salió premio. Es un intento por persona.'}
              </p>
              <div className="tt-e3 relative">
                {yaJugado.gano && !yaJugado.usado && (
                  <div className="mb-5"><Codigo codigo={yaJugado.codigo} descuento={yaJugado.descuento} /></div>
                )}
                <button type="button" onClick={cerrar} className={BOTON_AMARILLO} style={ESTILO_AMARILLO}>
                  {yaJugado.gano && !yaJugado.usado ? 'Ir a comprar' : 'Seguir mirando la tienda'}<Flecha />
                </button>
              </div>
            </div>
          )}

          {pantalla === 'trato' && (
            <div className="relative px-5 md:px-9 pt-6 md:pt-8 pb-6 md:pb-8">
              <span aria-hidden="true" className="absolute -top-[40px] -right-[40px] w-[260px] h-[260px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(255,140,40,0.35), rgba(255,140,40,0))' }} />
              <span className="absolute top-4 right-4 md:top-6 md:right-8 pointer-events-none">
                <Calabaza className="w-[92px] h-[85px] md:w-[124px] md:h-[114px]" />
              </span>
              <span className="tt-e1 tt-etiqueta relative inline-flex items-center gap-2 text-[10px] md:text-[11px] font-semibold tracking-[0.22em] uppercase text-[#ff7a2a]">Elegiste trato</span>
              <h2 className="tt-e1 relative mt-2 font-bebas text-[60px] md:text-[80px] leading-[0.85] tracking-[0.5px] pr-[96px] md:pr-[120px]">Trato hecho.</h2>
              <p className="tt-e2 relative mt-3 mb-6 md:mb-7 max-w-[400px] text-[14px] md:text-[16px] leading-relaxed font-medium text-white/75">Tenés 5% OFF en toda la tienda para tu próxima compra. No tenés que hacer nada: ya queda aplicado en el carrito.</p>
              <div className="tt-e3 relative">
                <Codigo codigo={premio?.codigo} descuento={premio?.descuento} />
                <button type="button" onClick={cerrar} className={`mt-5 ${BOTON_AMARILLO}`} style={ESTILO_AMARILLO}>Ir a comprar<Flecha /></button>
                <p className="mt-3.5 text-center text-[9.5px] md:text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">Una compra · No acumulable</p>
              </div>
            </div>
          )}

          {pantalla === 'truco' && (
            <div className="relative px-5 md:px-9 pt-6 md:pt-8 pb-6 md:pb-8">
              <span aria-hidden="true" className="absolute -top-[60px] -right-[50px] w-[260px] h-[260px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(239,227,189,0.16), rgba(239,227,189,0))' }} />
              <span className="absolute top-4 right-5 md:top-6 md:right-9 pointer-events-none">
                <Luna className="w-[58px] h-[58px] md:w-[76px] md:h-[76px]" />
              </span>
              <Murcielago ancho={38} className="text-[#0c0c0c] top-[36px] right-[22px] md:top-[44px] md:right-[34px]" style={{ '--r': '-8deg' }} />
              <Murcielago ancho={22} className="text-[#5a5a5a] top-[86px] right-[88px] md:top-[100px] md:right-[120px]" style={{ '--r': '10deg', animationDelay: '-1.6s' }} />

              <span className="tt-e1 tt-etiqueta relative inline-flex items-center gap-2 text-[10px] md:text-[11px] font-semibold tracking-[0.22em] uppercase text-[#fcdb00]">
                {fase !== 'fin' ? 'Elegiste truco' : gano ? 'Salió el premio' : 'Sin premio'}
              </span>
              <h2 className="tt-e1 relative mt-2 font-bebas text-[60px] md:text-[80px] leading-[0.85] tracking-[0.5px] pr-[80px] md:pr-[100px]">
                {fase !== 'fin' ? 'Truco.' : gano ? 'Ganaste 10%.' : 'Te asustaste.'}
              </h2>
              <p className="tt-e2 relative mt-3 mb-5 md:mb-6 max-w-[420px] text-[14px] md:text-[16px] leading-relaxed font-medium text-white/75">
                {fase !== 'fin'
                  ? 'Un solo giro. Si el rodillo frena en 10% OFF, es tuyo. Si frena en otra cosa, te quedás sin descuento.'
                  : gano
                    ? 'Tenés 10% OFF en toda la tienda para tu próxima compra. Ya queda aplicado en el carrito.'
                    : 'Esta vez no hubo premio. El truco es así: a veces sale, a veces no.'}
              </p>

              <div className="tt-e3 relative">
                {/* La máquina: marco con relieve, rodillo con forma de cilindro y la ventana
                    del medio marcada con dos líneas de neón. */}
                <div className={`tt-marco relative rounded-[6px] p-[5px] ${fase === 'fin' ? (gano ? 'tt-marco-gano' : 'tt-marco-pierde') : ''}`} style={{ background: 'linear-gradient(#2c2c2c, #0e0e0e)' }}>
                  <div className="relative overflow-hidden rounded-[3px]" style={{ height: FILA * 3, background: 'linear-gradient(#040404 0%, #161616 50%, #040404 100%)', boxShadow: 'inset 0 12px 26px rgba(0,0,0,0.95), inset 0 -12px 26px rgba(0,0,0,0.95)' }} aria-live="polite">
                    <div className={`absolute inset-x-0 top-0 ${fase === 'girando' ? 'tt-girando' : ''}`} style={{ transform: `translateY(${rodillo.y}px)`, transition: rodillo.trans }}>
                      {filas.map((t, i) => {
                        const final = fase === 'fin' && i === META;
                        return (
                          <div key={i} className={`flex items-center justify-center font-bebas text-[38px] md:text-[44px] tracking-[2px] ${t === GANA ? 'tt-neon-fila' : 'text-[#ececec]'} ${final ? `tt-fila-final ${gano ? 'tt-fila-gana' : 'tt-fila-pierde'}` : ''}`} style={{ height: FILA }}>{t}</div>
                        );
                      })}
                    </div>
                    <div aria-hidden="true" className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: FILA, background: 'linear-gradient(rgba(4,4,4,0.97), rgba(4,4,4,0.55))' }} />
                    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: FILA, background: 'linear-gradient(rgba(4,4,4,0.55), rgba(4,4,4,0.97))' }} />
                    <div aria-hidden="true" className="absolute inset-x-0 pointer-events-none" style={{ top: FILA, height: FILA, background: 'linear-gradient(90deg, rgba(252,219,0,0) 0%, rgba(252,219,0,0.06) 50%, rgba(252,219,0,0) 100%)' }} />
                    <div aria-hidden="true" className="tt-linea-neon absolute left-0 right-0 h-[2px] pointer-events-none" style={{ top: FILA - 1 }} />
                    <div aria-hidden="true" className="tt-linea-neon absolute left-0 right-0 h-[2px] pointer-events-none" style={{ top: FILA * 2 - 1 }} />
                    <svg aria-hidden="true" className="absolute left-2 pointer-events-none" style={{ top: FILA * 1.5 - 9, filter: 'drop-shadow(0 0 6px rgba(252,219,0,0.8))' }} width="11" height="18" viewBox="0 0 11 18"><path d="M1 1l8 8-8 8" fill="none" stroke={fase === 'fin' && !gano ? '#ff6b1a' : '#fcdb00'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <svg aria-hidden="true" className="absolute right-2 pointer-events-none" style={{ top: FILA * 1.5 - 9, filter: 'drop-shadow(0 0 6px rgba(252,219,0,0.8))' }} width="11" height="18" viewBox="0 0 11 18"><path d="M10 1L2 9l8 8" fill="none" stroke={fase === 'fin' && !gano ? '#ff6b1a' : '#fcdb00'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1/2 pointer-events-none" style={{ background: 'linear-gradient(rgba(255,255,255,0.05), rgba(255,255,255,0))' }} />
                  </div>
                </div>

                {fase !== 'fin' && (
                  <div className="flex mt-4 md:mt-5 py-3 border-y border-white/10">
                    <Dato titulo="Premio" valor="10% OFF" primero />
                    <Dato titulo="Chances" valor="1 de 5" />
                    <Dato titulo="Intentos" valor="1 solo" />
                  </div>
                )}

                {fase === 'listo' && registrado && (
                  <>
                    <button type="button" onClick={girar} className={`mt-4 md:mt-5 ${BOTON_AMARILLO}`} style={ESTILO_AMARILLO}>
                      Girar el rodillo
                      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 4v5h-5" /></svg>
                    </button>
                    {error && <p className="mt-3 text-center text-[12px] font-semibold text-[#ff7a2a]">{error}</p>}
                  </>
                )}
                {fase === 'listo' && !registrado && (
                  <div className="mt-4 md:mt-5">
                    <p className="flex items-center justify-center gap-2 text-center text-[10px] md:text-[11px] font-semibold tracking-[0.22em] uppercase text-[#fcdb00]">
                      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="1.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                      Registrate para girar
                    </p>
                    <p className="mt-1.5 text-center text-[12px] md:text-[13px] font-medium text-white/55">Un giro por cuenta. Es gratis y tarda unos segundos.</p>
                    {botonesRegistro('mt-4')}
                  </div>
                )}
                {fase === 'girando' && (
                  <div className={`mt-4 md:mt-5 opacity-60 ${BOTON_AMARILLO}`} style={ESTILO_AMARILLO} aria-live="polite">
                    <span>Girando<span className="tt-puntos"><span>.</span><span>.</span><span>.</span></span></span>
                  </div>
                )}
                {fase === 'fin' && gano && (
                  <div className="mt-5">
                    <Codigo codigo={premio?.codigo} descuento={premio?.descuento} />
                    <button type="button" onClick={cerrar} className={`mt-5 ${BOTON_AMARILLO}`} style={ESTILO_AMARILLO}>Ir a comprar<Flecha /></button>
                    <p className="mt-3.5 text-center text-[9.5px] md:text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">Una compra · No acumulable</p>
                  </div>
                )}
                {fase === 'fin' && !gano && (
                  <div className="mt-5">
                    <button type="button" onClick={cerrar} className="tt-cta tt-cta-oscuro w-full h-14 px-5 md:px-[22px] flex items-center justify-between rounded-[2px] border border-white/20 font-bebas text-[24px] tracking-[1.8px] leading-none text-white" style={{ background: 'linear-gradient(#1f1f1f, #080808)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.09)' }}>
                      Seguir mirando la tienda<Flecha />
                    </button>
                    <p className="mt-3.5 text-center text-[11px] md:text-[12px] font-medium text-white/55">Igual se vienen ofertas: Cyber Monday del 02.11 al 04.11.</p>
                    {modoPrueba && (
                      <button type="button" onClick={irAlTruco} className="mt-3 w-full h-11 rounded-[2px] border border-dashed border-[#fcdb00]/50 text-[11px] font-bold tracking-[0.22em] uppercase text-[#fcdb00]">
                        Prueba: girar de nuevo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          <span aria-hidden="true" className="tt-grano rounded-[4px]" />
        </div>
      )}
      {modoPrueba && (
        <span className="absolute top-2 left-2 z-20 px-2.5 py-1 rounded-[2px] bg-[#fcdb00] text-[#111111] text-[9px] font-bold tracking-[0.2em] uppercase pointer-events-none">Modo prueba · siempre pierde</span>
      )}
    </div>
  );
}
