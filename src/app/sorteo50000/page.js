import Image from 'next/image';
import Link from 'next/link';
import { getSSRProducts } from '@/lib/getProducts';
import HomeClient from '@/app/HomeClient';
import { LINK_COMUNIDAD } from '@/lib/cyber';

// Las bases del sorteo de $50.000 del CYBER 028, en una página propia para poder
// pasar el link por Instagram, TikTok y la comunidad. Mismo lenguaje que la campaña:
// negro y amarillo, tipografía gigante, líneas finas, nada de tarjetas.

const SITIO = 'https://028import.com';
const DESCRIPCION = 'Comprá en la web durante el CYBER 028, sumate a la comunidad de WhatsApp y participá por $50.000 para gastar en 028import.com. Sorteo en vivo el jueves 5 de noviembre.';

export const metadata = {
  title: 'Sorteo $50.000 · CYBER 028',
  description: DESCRIPCION,
  alternates: { canonical: '/sorteo50000' },
  openGraph: {
    type: 'article',
    locale: 'es_AR',
    url: `${SITIO}/sorteo50000`,
    siteName: '028 Import',
    title: 'Sorteo $50.000 · CYBER 028',
    description: DESCRIPCION,
  },
};

const GRANO = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";

const PASOS = [
  ['Comprá en la web', 'Del lunes 02 al miércoles 04 de noviembre, en 028import.com. Cualquier monto: no hay mínimo de compra.'],
  ['Sumate a la comunidad', 'La comunidad de WhatsApp de 028 Import. Ahí se publica el video del sorteo y se anuncia quién ganó.'],
  ['Mirá el sorteo en vivo', 'El jueves 05 de noviembre, en vivo por Instagram en @028.import.'],
];

const BASES = [
  ['Quién participa', 'Cualquier persona mayor de 18 años que haga un pedido en 028import.com durante el CYBER 028 y esté en la comunidad de WhatsApp de 028 Import.'],
  ['Período', 'Pedidos hechos desde las 00:00 del lunes 02/11/2026 hasta las 23:59 del miércoles 04/11/2026, hora de Argentina.'],
  ['Chances', 'Cada pedido confirmado es una chance. Los pedidos cancelados o que no se pagaron no participan.'],
  ['Cómo se elige', 'Al azar, en vivo por Instagram (@028.import) el jueves 05/11/2026. El video queda en la comunidad.'],
  ['Aviso al ganador', 'Le escribimos al WhatsApp que dejó en el pedido, y lo anunciamos en la comunidad.'],
  ['Premio', '$50.000 de saldo para gastar en 028import.com, en una compra dentro de las 48 horas siguientes al anuncio. No se cambia por dinero en efectivo ni se transfiere a otra persona.'],
];

function Eyebrow({ children, className = '' }) {
  return <p className={`text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.32em] font-poppins ${className}`}>{children}</p>;
}

function BotonComunidad({ claro = false }) {
  const clases = `inline-flex items-center justify-center gap-3 h-14 px-8 font-bebas text-[22px] tracking-[0.08em] uppercase rounded-[10px] transition-colors ${claro ? 'bg-[#0a0a0a] text-[#fcdb00] hover:bg-black/85' : 'bg-[#fcdb00] text-[#0a0a0a] hover:bg-white'}`;
  if (LINK_COMUNIDAD) {
    return <a href={LINK_COMUNIDAD} target="_blank" rel="noopener noreferrer" className={clases}>Sumarme a la comunidad <i className="fab fa-whatsapp text-[18px]"></i></a>;
  }
  return <Link href="/catalogo" className={clases}>Ir a la tienda <i className="fas fa-arrow-right text-[14px]"></i></Link>;
}

export default async function PaginaSorteo() {
  // El armazón (menú, carrito, pie) necesita el catálogo. Si la base no responde, la
  // página igual se muestra.
  let productos = [];
  try { productos = await getSSRProducts(); } catch {}

  return (
    <HomeClient ssrProducts={productos} modo="contenido" institucional>
      <div className="bg-[#070707] text-white font-poppins">

        {/* Apertura: el premio en grande, Humito a la derecha. */}
        <section className="relative overflow-hidden border-b border-white/10">
          {/* Sólo Humito: el texto del banner queda tapado por el fundido. */}
          <div className="absolute inset-y-0 right-0 w-full md:w-[46%] opacity-50 md:opacity-100">
            <Image src="/banner-original.webp" alt="" fill priority sizes="(min-width: 768px) 46vw, 100vw" className="object-cover object-[84%_center]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070707] via-[#070707]/60 via-30% to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-[#070707]/40" />
          </div>
          <span aria-hidden="true" className="pointer-events-none absolute -right-[0.04em] -bottom-[0.18em] font-bebas text-[46vw] md:text-[30vw] leading-none text-white/[0.04]">028</span>

          <div className="relative max-w-[1400px] mx-auto px-4 md:px-12 pt-16 pb-14 md:pt-28 md:pb-24">
            <Eyebrow className="text-[#fcdb00]">Sorteo CYBER 028</Eyebrow>
            <h1 className="font-bebas text-[120px] md:text-[240px] leading-[0.78] mt-5 tracking-[-0.01em]">
              <span className="text-[#fcdb00]">$50.000</span>
            </h1>
            <p className="font-bebas text-[38px] md:text-[64px] leading-[0.9] mt-3">para gastar<br className="md:hidden" /> en la web</p>
            <div className="mt-9 md:mt-12 grid grid-cols-3 md:flex border-t border-white/15 max-w-2xl">
              {[['Ganadores', 'Uno'], ['Compra mínima', 'No hay'], ['Sorteo', 'Jueves 05.11']].map(([etiqueta, valor], i) => (
                <div key={etiqueta} className={`pt-4 pr-3 md:pr-8 ${i > 0 ? 'pl-3 md:pl-8 border-l border-white/15' : ''}`}>
                  <span className="block text-[8px] md:text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">{etiqueta}</span>
                  <span className="block font-bebas text-[24px] md:text-[34px] leading-none mt-1.5">{valor}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo participar: tres pasos, separados por líneas, sobre amarillo. */}
        <section className="relative bg-[#fcdb00] text-[#0a0a0a] overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-multiply" style={{ backgroundImage: GRANO }} />
          <div className="relative max-w-[1400px] mx-auto px-4 md:px-12 py-14 md:py-24">
            <Eyebrow className="text-black/60">Cómo participar</Eyebrow>
            <h2 className="font-bebas text-[64px] md:text-[120px] leading-[0.82] mt-4">Tres pasos</h2>
            <div className="mt-10 md:mt-16 grid md:grid-cols-3 border-t border-black/20">
              {PASOS.map(([titulo, texto], i) => (
                <div key={titulo} className={`py-7 md:py-0 md:pt-8 md:pr-10 ${i > 0 ? 'border-t md:border-t-0 md:border-l border-black/15 md:pl-10' : ''}`}>
                  <span className="block font-bebas text-[56px] md:text-[88px] leading-[0.8] text-black/25">0{i + 1}</span>
                  <h3 className="font-bebas text-[32px] md:text-[40px] leading-none mt-3 md:mt-5">{titulo}</h3>
                  <p className="text-[14px] md:text-[15px] leading-relaxed text-black/70 mt-3 max-w-sm">{texto}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 md:mt-16">
              <BotonComunidad claro />
            </div>
          </div>
        </section>

        {/* Bases y condiciones, como lista tipográfica. */}
        <section className="max-w-[1400px] mx-auto px-4 md:px-12 py-14 md:py-24 grid md:grid-cols-[1fr_2fr] gap-10 md:gap-20">
          <div>
            <Eyebrow className="text-white/50">Letra chica</Eyebrow>
            <h2 className="font-bebas text-[56px] md:text-[96px] leading-[0.82] mt-4">Bases y<br />condiciones</h2>
          </div>
          <dl className="border-t border-white/15">
            {BASES.map(([termino, detalle]) => (
              <div key={termino} className="grid md:grid-cols-[200px_1fr] gap-2 md:gap-10 py-6 border-b border-white/10">
                <dt className="font-bebas text-[24px] md:text-[26px] leading-none text-[#fcdb00]">{termino}</dt>
                <dd className="text-[14px] md:text-[15px] leading-relaxed text-white/70">{detalle}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Cierre. */}
        <section className="border-t border-white/10">
          <div className="max-w-[1400px] mx-auto px-4 md:px-12 py-14 md:py-20 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <p className="font-bebas text-[48px] md:text-[88px] leading-[0.85]">Comprá, sumate<br /><span className="text-[#fcdb00]">y participá.</span></p>
            <div className="flex flex-wrap gap-3">
              {LINK_COMUNIDAD && <BotonComunidad />}
              <Link href="/catalogo" className="inline-flex items-center justify-center gap-3 h-14 px-8 font-bebas text-[22px] tracking-[0.08em] uppercase rounded-[10px] border border-white/25 text-white hover:border-white transition-colors">
                Ver las ofertas <i className="fas fa-arrow-right text-[14px]"></i>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </HomeClient>
  );
}
