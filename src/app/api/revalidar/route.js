import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { paseValido } from '@/lib/paseAdmin';
import { slugProducto, aSlug } from '@/lib/slug';
import { listadosDeProducto } from '@/lib/catalogo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// El panel avisa por acá cada vez que guardás algo, y el sitio rehace en el momento
// las páginas que ese cambio toca. Sin esto, las páginas se revisan solas cada tanto
// y el cambio tarda; con esto se ve al instante y además el sitio consulta la base
// muchas menos veces, porque ya no necesita revisarse seguido "por las dudas".

// Un freno por si el pase se filtra: rehacer páginas cuesta lecturas de la base.
const pedidos = new Map();
const VENTANA_MS = 60 * 1000;
const MAX_POR_MINUTO = 60;

function demasiados(ip) {
  const ahora = Date.now();
  const r = pedidos.get(ip);
  if (!r || ahora - r.desde > VENTANA_MS) {
    pedidos.set(ip, { desde: ahora, cuantos: 1 });
    return false;
  }
  r.cuantos += 1;
  return r.cuantos > MAX_POR_MINUTO;
}

/**
 * Las direcciones que un producto afecta: su ficha, las secciones donde aparece,
 * la portada, el catálogo y el mapa del sitio.
 *
 * Se calculan acá y no las manda el panel: así, aunque alguien consiguiera un pase,
 * no puede pedir que se rehaga cualquier cosa, sólo lo que corresponde a un producto.
 */
function direccionesAfectadas(producto) {
  const rutas = new Set(['/', '/catalogo', '/sitemap.xml']);

  const slug = slugProducto(producto);
  if (slug) rutas.add(`/producto/${slug}`);

  for (const { departamento, marca } of listadosDeProducto(producto)) {
    const d = aSlug(departamento);
    if (!d) continue;
    rutas.add(`/${d}`);
    const m = aSlug(marca);
    if (m) rutas.add(`/${d}/${m}`);
  }
  return [...rutas];
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (demasiados(ip)) {
    return NextResponse.json({ error: 'Demasiados pedidos.' }, { status: 429 });
  }

  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  if (!paseValido(cuerpo?.pase)) {
    return NextResponse.json({ error: 'Pase inválido o vencido.' }, { status: 401 });
  }

  // El panel puede mandar varios cambios juntos (si tocaste varias cosas seguidas).
  const productos = Array.isArray(cuerpo?.productos) ? cuerpo.productos.slice(0, 50) : [];

  const rutas = new Set();
  for (const p of productos) {
    if (p && typeof p === 'object') direccionesAfectadas(p).forEach(r => rutas.add(r));
  }
  // Si no vino ningún producto reconocible, igual conviene refrescar lo general:
  // pudo ser un borrado, o un cambio de los que no cuelgan de un producto.
  if (!rutas.size) ['/', '/catalogo', '/sitemap.xml'].forEach(r => rutas.add(r));

  for (const ruta of rutas) {
    try {
      revalidatePath(ruta);
    } catch (err) {
      console.error('[revalidar] no se pudo rehacer', ruta, err?.message);
    }
  }

  return NextResponse.json({ ok: true, rehechas: [...rutas] });
}
