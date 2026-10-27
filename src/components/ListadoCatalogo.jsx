"use client";

// El molde de las páginas de departamento y de marca: camino de migas, título,
// atajos a las marcas, orden y la grilla de productos.
//
// Las dos páginas usan esto mismo; lo único que cambia es qué le pasan. Así una
// mejora de diseño acá se ve en las dos.

import { useState, useMemo } from 'react';
import Link from 'next/link';
import TarjetaCatalogo from '@/components/TarjetaCatalogo';
import { rutaMarca } from '@/lib/catalogo';

const ORDENES = [
  { id: 'destacados', texto: 'Destacados' },
  { id: 'precio-asc', texto: 'Menor precio' },
  { id: 'precio-desc', texto: 'Mayor precio' },
  { id: 'nombre', texto: 'Nombre (A-Z)' },
];

const precioDe = (p) => (p.offerPrice > 0 && p.offerPrice < p.price ? p.offerPrice : p.price) || 0;

export default function ListadoCatalogo({
  titulo,
  bajada,
  migas = [],
  marcas = [],
  slugDepartamento,
  marcaActiva = null,
  productos = [],
}) {
  const [orden, setOrden] = useState('destacados');
  const [aviso, setAviso] = useState('');

  const ordenados = useMemo(() => {
    const lista = [...productos];
    if (orden === 'precio-asc') lista.sort((a, b) => precioDe(a) - precioDe(b));
    else if (orden === 'precio-desc') lista.sort((a, b) => precioDe(b) - precioDe(a));
    else if (orden === 'nombre') lista.sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'));
    // "Destacados" es el orden que ya viene: con stock primero.
    return lista;
  }, [productos, orden]);

  const mostrarAviso = (producto) => {
    setAviso(`Agregado: ${producto.name}`);
    setTimeout(() => setAviso(''), 2200);
  };

  return (
    <div className="bg-[#f7f7f7]">

      <main className="w-full px-4 md:px-10 lg:px-20 xl:px-32 py-6 md:py-10">
        {/* Camino de migas: siempre se sabe dónde se está y cómo volver */}
        <nav aria-label="Camino" className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 mb-5">
          <Link href="/" className="hover:text-[#111111]">Inicio</Link>
          {migas.map((m) => (
            <span key={m.href} className="flex items-center gap-1.5">
              <span aria-hidden="true">/</span>
              {m.href ? (
                <Link href={m.href} className="hover:text-[#111111]">{m.texto}</Link>
              ) : (
                <span className="text-[#111111] font-semibold">{m.texto}</span>
              )}
            </span>
          ))}
        </nav>

        <header className="mb-6">
          <h1 className="font-bebas text-4xl md:text-5xl uppercase tracking-wide text-[#111111] leading-none">
            {titulo}
          </h1>
          {bajada && <p className="text-gray-500 text-sm mt-2 max-w-2xl">{bajada}</p>}
        </header>

        {/* Atajos a las marcas del departamento */}
        {marcas.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-6 -mx-4 px-4 md:mx-0 md:px-0">
            <Link
              href={`/${slugDepartamento}`}
              className={`flex-shrink-0 px-4 h-9 flex items-center rounded-full text-[12px] font-bold uppercase tracking-wider transition-colors ${
                marcaActiva === null
                  ? 'bg-[#111111] text-white'
                  : 'bg-white text-[#111111] border border-gray-200 hover:border-gray-400'
              }`}
            >
              Todo
            </Link>
            {marcas.map(m => (
              <Link
                key={m.slug}
                href={rutaMarca(slugDepartamento, m.slug)}
                className={`flex-shrink-0 px-4 h-9 flex items-center gap-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-colors ${
                  marcaActiva === m.slug
                    ? 'bg-[#111111] text-white'
                    : 'bg-white text-[#111111] border border-gray-200 hover:border-gray-400'
                }`}
              >
                {m.nombre}
                <span className={marcaActiva === m.slug ? 'text-white/50' : 'text-gray-400'}>{m.cantidad}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-gray-500 text-[12px]">
            {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
          </p>
          <label className="flex items-center gap-2 text-[12px] text-gray-500">
            <span className="hidden sm:inline">Ordenar por</span>
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg h-9 px-3 text-[12px] text-[#111111] font-semibold focus:outline-none focus:border-gray-400"
            >
              {ORDENES.map(o => <option key={o.id} value={o.id}>{o.texto}</option>)}
            </select>
          </label>
        </div>

        {ordenados.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
            {ordenados.map(p => (
              <TarjetaCatalogo key={p.id} producto={p} onAgregado={mostrarAviso} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[1.25rem] border border-gray-100 p-10 text-center">
            <p className="font-bebas text-2xl uppercase tracking-wide text-[#111111] mb-2">Todavía no hay nada acá</p>
            <p className="text-gray-500 text-sm mb-5">Estamos reponiendo. Mientras tanto, mirá el resto de la tienda.</p>
            <Link href="/" className="inline-flex items-center h-11 px-6 bg-[#111111] text-white font-bebas uppercase tracking-wider rounded-xl hover:bg-[#fcdb00] hover:text-[#111111] transition-colors">
              Ver todo
            </Link>
          </div>
        )}
      </main>

      <div
        aria-live="polite"
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${aviso ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}
      >
        <div className="bg-[#111111] text-white text-sm font-semibold px-5 py-3 rounded-full shadow-xl">
          {aviso}
        </div>
      </div>
    </div>
  );
}
