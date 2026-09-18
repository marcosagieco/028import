import Link from 'next/link';
import { CONTENIDO_INSTITUCIONAL } from '@/lib/contenidoInstitucional';
import { getSSRProducts } from '@/lib/getProducts';
import HomeClient from '@/app/HomeClient';

// El molde de las seis páginas institucionales. Lo arma el servidor: es puro texto,
// así que llega ya escrito en el HTML y Google lo lee sin ejecutar nada.

const SITIO = 'https://028import.com';

/** Arma el título y la descripción de una de estas páginas. */
export function metadataDe(clave, ruta, descripcion) {
  const datos = CONTENIDO_INSTITUCIONAL[clave];
  if (!datos) return {};
  return {
    title: datos.title,
    description: descripcion,
    alternates: { canonical: ruta },
    openGraph: {
      type: 'article',
      locale: 'es_AR',
      url: `${SITIO}${ruta}`,
      siteName: '028 Import',
      title: `${datos.title} — 028 Import`,
      description: descripcion,
    },
  };
}

export default async function PaginaInstitucional({ clave }) {
  const datos = CONTENIDO_INSTITUCIONAL[clave];
  if (!datos) return null;

  // El armazón necesita el catálogo para la barra (departamentos y marcas) y el
  // carrito. Si la base no responde, la página igual se muestra.
  let productos = [];
  try { productos = await getSSRProducts(); } catch {}

  return (
    <HomeClient ssrProducts={productos} modo="contenido">
    <div className="bg-[#f7f7f7]">

      <main className="w-full px-4 md:px-10 lg:px-20 xl:px-32 py-10 md:py-16">
        <article className="max-w-4xl mx-auto bg-white p-7 md:p-14 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-100">
          <nav aria-label="Camino" className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-8">
            <Link href="/" className="hover:text-[#111111]">Inicio</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#111111] font-semibold">{datos.title}</span>
          </nav>

          <header className="text-center mb-12">
            <span className="text-[#8a6d00] font-bebas uppercase tracking-widest text-base mb-2 block">
              {datos.subtitle}
            </span>
            <h1 className="text-4xl md:text-5xl font-bebas text-[#111111] uppercase tracking-wide leading-none">
              {datos.title}
            </h1>
            <div className="w-24 h-1.5 bg-[#fcdb00] mx-auto mt-6 rounded-full"></div>
          </header>

          <div className="prose prose-gray max-w-none font-poppins">
            {datos.body}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <Link
              href="/"
              className="inline-flex items-center h-12 px-7 bg-[#111111] text-white font-bebas text-lg uppercase tracking-wider rounded-xl hover:bg-[#fcdb00] hover:text-[#111111] transition-colors"
            >
              Volver a la tienda
            </Link>
          </div>
        </article>
      </main>
    </div>
    </HomeClient>
  );
}
