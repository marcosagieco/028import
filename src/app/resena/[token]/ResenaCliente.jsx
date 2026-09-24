'use client';

import { useEffect, useState } from 'react';

const Estrella = ({ activa, onClick, onMouseEnter, onMouseLeave }) => (
  <button
    type="button"
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className="p-1"
    aria-label="Calificar"
  >
    <i className={`${activa ? 'fas' : 'far'} fa-star text-3xl ${activa ? 'text-[#fcdb00]' : 'text-gray-300'} transition-colors`}></i>
  </button>
);

function FormularioProducto({ token, item, onEnviado }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const enviar = async () => {
    if (!rating) { setError('Elegí una calificación.'); return; }
    setEnviando(true);
    setError('');
    try {
      const r = await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, productId: item.productId, rating, name, text }),
      });
      const datos = await r.json();
      if (!r.ok || !datos.ok) { setError(datos.error || 'No se pudo enviar, probá de nuevo.'); setEnviando(false); return; }
      onEnviado();
    } catch {
      setError('No se pudo conectar, probá de nuevo.');
      setEnviando(false);
    }
  };

  return (
    <div className="bg-white rounded-[1.75rem] shadow-sm border border-gray-100 p-6 md:p-8">
      <h3 className="font-bebas text-2xl uppercase tracking-wide text-[#111111] mb-4">{item.name}</h3>
      <div className="flex gap-1 mb-5">
        {[1, 2, 3, 4, 5].map(n => (
          <Estrella
            key={n}
            activa={n <= (hover || rating)}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
          />
        ))}
      </div>
      <input
        type="text"
        placeholder="Tu nombre"
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={60}
        className="w-full p-4 rounded-xl bg-[#f2f2f2] outline-none font-bold text-sm mb-3 focus:ring-2 focus:ring-[#fcdb00] transition-all"
      />
      <textarea
        rows={3}
        placeholder="Contanos qué te pareció (opcional)"
        value={text}
        onChange={e => setText(e.target.value)}
        maxLength={600}
        className="w-full p-4 rounded-xl bg-[#f2f2f2] outline-none font-medium text-sm mb-3 resize-none focus:ring-2 focus:ring-[#fcdb00] transition-all"
      />
      {error && <p className="text-red-500 text-xs font-bold mb-3">{error}</p>}
      <button
        onClick={enviar}
        disabled={enviando}
        className="w-full bg-[#111111] text-[#fcdb00] font-bebas py-3.5 rounded-xl uppercase tracking-wider text-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
      >
        {enviando ? 'Enviando...' : 'Enviar reseña'}
      </button>
    </div>
  );
}

export default function ResenaCliente({ token }) {
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error
  const [datos, setDatos] = useState(null);
  const [enviados, setEnviados] = useState([]);

  useEffect(() => {
    fetch(`/api/resenas?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => {
        if (!d.ok) { setEstado('error'); return; }
        setDatos(d);
        setEstado('ok');
      })
      .catch(() => setEstado('error'));
  }, [token]);

  const pendientes = (datos?.items || []).filter(i => !i.yaReseñado && !enviados.includes(i.productId));

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-start md:items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-bebas text-4xl uppercase tracking-wide text-[#111111]">¿Qué te pareció tu pedido?</h1>
          <p className="text-gray-500 text-sm mt-2">Tu opinión ayuda a otros a elegir mejor.</p>
        </div>

        {estado === 'cargando' && (
          <p className="text-center text-gray-400 text-sm font-bold uppercase tracking-widest">Cargando...</p>
        )}

        {estado === 'error' && (
          <div className="bg-white rounded-[1.75rem] shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500 text-sm">Este enlace no es válido o ya venció.</p>
          </div>
        )}

        {estado === 'ok' && pendientes.length === 0 && (
          <div className="bg-white rounded-[1.75rem] shadow-sm border border-gray-100 p-8 text-center">
            <img src="https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png" alt="028 Import" className="h-12 w-auto object-contain mx-auto mb-3" />
            <p className="text-[#111111] font-bold text-sm">¡Gracias por tu reseña!</p>
          </div>
        )}

        {estado === 'ok' && pendientes.length > 0 && (
          <div className="flex flex-col gap-5">
            {pendientes.map(item => (
              <FormularioProducto
                key={item.productId}
                token={token}
                item={item}
                onEnviado={() => setEnviados(prev => [...prev, item.productId])}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
