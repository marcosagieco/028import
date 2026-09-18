"use client";

// La tarjeta de producto de las páginas de departamento y de marca.
//
// Es la misma idea que la tarjeta de la home: la foto y el nombre llevan a la página
// del producto, y el botón de compra agrega sin sacar a la persona de donde está.
// Va aparte de la home porque aquella vive dentro de HomeClient y depende de un
// montón de estado suyo; ésta sólo necesita el producto.

import Link from 'next/link';
import Image from 'next/image';
import { useCarrito } from '@/components/CarritoProvider';
import { rutaProducto } from '@/lib/slug';

const precioFormateado = (n) => Number(n || 0).toLocaleString('es-AR');

export default function TarjetaCatalogo({ producto, onAgregado }) {
  const { agregarAlCarrito, cambiarCantidad, cart } = useCarrito();

  const enCarrito = cart.find(i => String(i.id) === String(producto.id));
  const sinStock = producto.inStock === false;
  const conOferta = producto.offerPrice > 0 && producto.offerPrice < producto.price;
  const precio = conOferta ? producto.offerPrice : producto.price;
  const moneda = producto.tag === 'USD' ? 'USD ' : '$';

  const agregar = () => {
    if (agregarAlCarrito(producto)) onAgregado?.(producto);
  };

  return (
    <div className={`bg-white rounded-[1.25rem] border border-gray-100 shadow-[0_6px_20px_rgb(0,0,0,0.06)] hover:shadow-[0_18px_36px_rgb(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group ${sinStock ? 'opacity-60' : ''}`}>
      <Link
        href={rutaProducto(producto)}
        prefetch={false}
        aria-label={`Ver ${producto.name}`}
        className="relative block aspect-square bg-[#fafafa]"
      >
        {producto.image && (
          <Image
            src={producto.image}
            alt={producto.name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 260px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {sinStock ? (
          <div className="absolute inset-0 bg-[#111111]/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-600 text-white font-bebas text-xs px-3 py-1 rounded-sm uppercase tracking-wider">Sin stock</span>
          </div>
        ) : conOferta ? (
          <span className="absolute top-3 left-3 bg-[#fcdb00] text-[#111111] font-bebas text-[11px] px-2.5 py-1 uppercase rounded-sm tracking-wider">
            {Math.round((1 - precio / producto.price) * 100)}% OFF
          </span>
        ) : producto.tag ? (
          <span className="absolute top-3 left-3 bg-[#111111] text-[#fcdb00] font-bebas text-[11px] px-2.5 py-1 uppercase rounded-sm tracking-wider">
            {producto.tag}
          </span>
        ) : null}
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1.5">{producto.category}</p>
        <h3 className="font-bebas text-[15px] md:text-[17px] uppercase tracking-wide leading-tight text-[#111111] line-clamp-2 mb-2">
          <Link href={rutaProducto(producto)} prefetch={false} className="hover:underline decoration-2 underline-offset-2">
            {producto.name}
          </Link>
        </h3>

        <div className="mt-auto pt-2">
          {conOferta && (
            <p className="text-gray-400 font-bebas text-sm line-through leading-none">
              {moneda}{precioFormateado(producto.price)}
            </p>
          )}
          <p className="font-bebas text-2xl text-[#111111] tracking-wide mb-3 leading-tight">
            {moneda}{precioFormateado(precio)}
          </p>

          {sinStock ? (
            <button disabled className="w-full bg-gray-100 text-gray-500 h-11 font-bebas text-[14px] uppercase tracking-wider rounded-xl cursor-not-allowed">
              Agotado
            </button>
          ) : enCarrito ? (
            <div className="flex items-center justify-between bg-[#fcdb00] text-[#111111] h-11 rounded-xl font-bold px-1.5">
              <button
                onClick={() => cambiarCantidad(producto.id, -1)}
                aria-label="Quitar una unidad"
                className="w-11 h-full flex items-center justify-center"
              >
                <i className="fas fa-minus text-xs" aria-hidden="true"></i>
              </button>
              <span className="font-bebas text-xl">{enCarrito.qty}</span>
              <button
                onClick={() => cambiarCantidad(producto.id, 1)}
                aria-label="Agregar una unidad"
                className="w-11 h-full flex items-center justify-center"
              >
                <i className="fas fa-plus text-xs" aria-hidden="true"></i>
              </button>
            </div>
          ) : (
            <button
              onClick={agregar}
              className="w-full bg-[#111111] text-white hover:bg-[#fcdb00] hover:text-[#111111] h-11 font-bebas text-[14px] uppercase tracking-wider rounded-xl transition-colors"
            >
              Comprar ahora
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
