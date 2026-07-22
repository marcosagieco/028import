"use client";

import { useEffect, useState } from "react";
import Snowfall from "./Snowfall";

const TRANSITION_MS = 280;

export default function WinterOfferModal({ onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, TRANSITION_MS);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 z-0 bg-black/75 backdrop-blur-xl transition-opacity ease-out"
        style={{ opacity: visible ? 1 : 0, transitionDuration: `${TRANSITION_MS}ms` }}
        onClick={handleClose}
      />
      <Snowfall zIndex={5} />
      <div
        className="relative z-10 w-full max-w-sm sm:max-w-lg rounded-[2rem] border border-white/15 bg-[#0c1a2e] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden transition-all ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.95)",
          transitionDuration: `${TRANSITION_MS}ms`,
        }}
      >
        <button
          onClick={handleClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 border border-white/15 text-white flex items-center justify-center transition-all"
        >
          <i className="fas fa-times"></i>
        </button>

        <img
          src="/winter-offer.webp"
          alt="028 Import — Temporada de invierno"
          className="w-full h-auto block"
        />
      </div>
    </div>
  );
}
