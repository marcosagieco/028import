"use client";

import Snowfall from "./Snowfall";

export default function WinterOfferModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0 bg-black/75 backdrop-blur-xl" onClick={onClose} />
      <Snowfall zIndex={5} />
      <div className="relative z-10 w-full max-w-sm sm:max-w-lg rounded-[2rem] border border-white/15 bg-[#0c1a2e] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 fade-in duration-500">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 border border-white/15 text-white flex items-center justify-center transition-all"
        >
          <i className="fas fa-times"></i>
        </button>

        <img
          src="https://i.ibb.co/vvCbcNQ6/image.png"
          alt="028 Import — Temporada de invierno"
          className="w-full h-auto block"
        />
      </div>
    </div>
  );
}
