"use client";

import { Suspense, useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';

const MODEL_URL = '/models/pinkvapedevice3dmodel-v1.glb';

const SPECS = [
  { icon: 'fa-candy-cane', label: 'Sabor',            value: 'Cherry Straz', desc: null },
  { icon: 'fa-fire',       label: 'Puffs',            value: '40.000',       desc: '40.000 puffs — equivalen a un uso aproximado de 2 a 3 semanas, según la frecuencia de consumo.' },
  { icon: 'fa-flask',      label: 'Nicotina',         value: '5 mg',         desc: '5 MG — concentración estándar, la más elegida por nuestros clientes.' },
  { icon: 'fa-plug',       label: 'Carga',            value: 'USB-C',        desc: 'USB-C — conector de carga rápida.' },
  { icon: 'fa-tv',         label: 'Pantalla Digital', value: 'Sí',           desc: 'Sí — indicador visual de batería y líquido restante.' },
];

function StaticVape({ rotation, isMobile }) {
  const { scene } = useGLTF(MODEL_URL);
  const rotRef = useRef();

  const center = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    return box.getCenter(new THREE.Vector3());
  }, [scene]);

  useFrame(() => {
    if (!rotRef.current) return;
    rotRef.current.rotation.x += (rotation.current.x - rotRef.current.rotation.x) * 0.04;
    rotRef.current.rotation.y += (rotation.current.y - rotRef.current.rotation.y) * 0.04;
  });

  const posX  = isMobile ? 0 : -1;
  const scale = isMobile ? 9.5 : 7.5;

  return (
    <group position={[posX, 0, -3.5]} scale={[scale, scale, scale]}>
      <group position={[center.x, center.y, center.z]}>
        <group ref={rotRef}>
          <group position={[-center.x, -center.y, -center.z]}>
            <primitive object={scene} />
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URL);

export default function VapeSpecs3D() {
  const rotation     = useRef({ x: 0, y: -1.4 });
  const isDragging   = useRef(false);
  const lastMouse    = useRef({ x: 0, y: 0 });
  const canvasWrapRef = useRef(null);
  const [cursor, setCursor] = useState('grab');
  const [openSpec, setOpenSpec] = useState(null);
  const [flavors, setFlavors] = useState([]);
  const [showFlavors, setShowFlavors] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const firebaseConfig = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID };
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      const elfbarFlavors = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.category === 'Elfbar Ice King' && p.inStock !== false)
        .map(p => p.name);
      setFlavors(elfbarFlavors);
    });
    return () => unsub();
  }, []);

  const applyDelta = useCallback((dx, dy) => {
    const limitX  = 20 * (Math.PI / 180);
    const limitYL = 6  * (Math.PI / 180);
    const limitYR = 30 * (Math.PI / 180);
    const baseY = -1.4;
    const baseX = 0;
    rotation.current.y = Math.max(baseY - limitYL, Math.min(baseY + limitYR, rotation.current.y + dx * 0.004));
    rotation.current.x = Math.max(baseX - limitX,  Math.min(baseX + limitX,  rotation.current.x + dy * 0.004));
  }, []);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setCursor('grabbing');
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    applyDelta(dx, dy);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setCursor('grab');
  };

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    isDragging.current = true;
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - lastMouse.current.x;
    const dy = e.touches[0].clientY - lastMouse.current.y;
    applyDelta(dx, dy);
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, [applyDelta]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove',  handleTouchMove,  { passive: false });
    el.addEventListener('touchend',   handleTouchEnd,   { passive: false });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove',  handleTouchMove);
      el.removeEventListener('touchend',   handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <section className="w-full bg-white border-b border-gray-100 mb-16 md:mb-0">
      <div className="w-full px-4 md:pl-64 md:pr-16 pt-0 pb-8 md:py-0 flex flex-col md:flex-row items-center justify-between gap-0 md:gap-0">

        {/* Specs — izquierda en desktop, abajo en mobile */}
        <div className="w-full md:w-96 flex-shrink-0 flex flex-col gap-4 md:gap-6 order-2 md:order-1 pt-4 md:pt-0">
          <div className="mb-1 md:mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#fcdb00] font-poppins mb-1">Especificaciones</p>
            <h2 className="font-bebas text-4xl md:text-7xl text-[#111111] uppercase tracking-wide leading-none">Elfbar Ice King</h2>
          </div>

          {SPECS.map((spec) => {
            const isOpen = openSpec === spec.label;
            return (
              <div key={spec.label} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <button
                  onClick={() => setOpenSpec(isOpen ? null : spec.label)}
                  className="flex items-center gap-3 w-full text-left group"
                >
                  <div className="w-7 h-7 rounded-full border-2 border-[#111111] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-[#111111]">
                    <span
                      className="font-bold text-[16px] leading-none text-[#111111] group-hover:text-white transition-all duration-300 inline-block"
                      style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                    >
                      +
                    </span>
                  </div>
                  <span className="text-[14px] font-bold uppercase tracking-widest text-[#111111] font-poppins">{spec.label}</span>
                </button>

                {/* contenido expandible */}
                <div
                  className="overflow-hidden transition-all duration-500 ease-in-out"
                  style={{ maxHeight: isOpen ? (spec.label === 'Sabor' ? (showFlavors ? `${32 + flavors.length * 28}px` : '60px') : spec.desc ? '100px' : '60px') : '0px' }}
                >
                  <div
                    className="pt-3 pl-1 transition-all duration-500 ease-in-out"
                    style={{ opacity: isOpen ? 1 : 0, transform: isOpen ? 'translateY(0)' : 'translateY(-8px)' }}
                  >
                    {spec.label === 'Sabor' ? (
                      <>
                        <button
                          onClick={() => setShowFlavors(v => !v)}
                          className="flex items-center justify-between w-full group"
                        >
                          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 font-poppins">{spec.label}</span>
                          <span className="flex items-center gap-1 font-bebas text-2xl text-[#111111] tracking-wide group-hover:text-[#fcdb00] transition-colors duration-200">
                            {spec.value}
                            <i className={`fas fa-chevron-down text-[12px] transition-transform duration-300 ${showFlavors ? 'rotate-180' : ''}`}></i>
                          </span>
                        </button>
                        <div
                          className="overflow-hidden transition-all duration-400 ease-in-out"
                          style={{ maxHeight: showFlavors ? `${flavors.length * 30}px` : '0px', opacity: showFlavors ? 1 : 0 }}
                        >
                          <div className="mt-2 flex flex-col gap-1">
                            {flavors.map(f => (
                              <button
                                key={f}
                                onClick={() => window.dispatchEvent(new CustomEvent('openProduct', { detail: { name: f } }))}
                                className="text-left text-[11px] font-poppins text-gray-500 uppercase tracking-wide pl-2 border-l-2 border-[#fcdb00] hover:text-[#111111] hover:border-[#111111] hover:scale-[1.04] hover:pl-3 hover:font-bold transition-all duration-200 ease-out py-0.5 origin-left"
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-[13px] text-gray-700 font-poppins leading-relaxed">{spec.desc || spec.value}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3D Model — arriba en mobile, derecha en desktop */}
        <div
          className="w-full h-[420px] md:flex-1 md:h-[740px] flex items-center justify-center order-1 md:order-2"
          ref={canvasWrapRef}
          style={{ cursor }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <Canvas
            camera={{ position: [0, 0, 5], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'transparent', width: '100%', height: '100%' }}
          >
            <ambientLight intensity={0.35} />
            <pointLight position={[5, 5, 5]}   intensity={38} color="#ffffff" />
            <pointLight position={[-5, 3, 3]}  intensity={28} color="#ffffff" />
            <pointLight position={[0, -5, 5]}  intensity={14} color="#ffffff" />
            <pointLight position={[8, 0, 2]}   intensity={16} color="#ffffff" />
            <pointLight position={[-8, 0, 2]}  intensity={16} color="#ffffff" />
            <Suspense fallback={null}>
              <StaticVape rotation={rotation} isMobile={isMobile} />
              <Environment preset="city" />
            </Suspense>
          </Canvas>
        </div>

      </div>
    </section>
  );
}
