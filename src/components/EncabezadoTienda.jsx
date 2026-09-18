"use client";

// Barra superior para las páginas que no son la home. La home tiene la suya propia,
// con el menú completo de departamentos; esta es la versión compacta: volver, logo y
// carrito. Se reutiliza en las páginas de producto, departamento y marca.

import Link from 'next/link';
import { useCarrito } from '@/components/CarritoProvider';

const LOGO = 'https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png';

export default function EncabezadoTienda({ volverA = '/', textoVolver = 'Seguir comprando' }) {
  const { unidadesEnCarrito } = useCarrito();

  return (
    <header className="sticky top-0 z-50 bg-[#111111] text-white border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <Link
          href={volverA}
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-300 hover:text-[#fcdb00] transition-colors"
        >
          <i className="fas fa-arrow-left text-xs" aria-hidden="true"></i>
          <span className="hidden sm:inline">{textoVolver}</span>
        </Link>

        <Link href="/" aria-label="Ir al inicio" className="absolute left-1/2 -translate-x-1/2">
          <img src={LOGO} alt="028 Import" className="h-9 w-auto object-contain" />
        </Link>

        <Link
          href="/?carrito=1"
          className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 transition-colors"
          aria-label={`Abrir carrito${unidadesEnCarrito ? ` (${unidadesEnCarrito})` : ''}`}
        >
          <i className="fas fa-shopping-bag text-xl" aria-hidden="true"></i>
          {unidadesEnCarrito > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#fcdb00] text-[#111111] text-[10px] font-bold flex items-center justify-center">
              {unidadesEnCarrito}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
