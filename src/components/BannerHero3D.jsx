"use client";

import { Suspense, useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const MODELS = {
  center: '/models/vape%20device%203d%20model.glb',
  left:   '/models/vape%20device%203d%20model%20(1).glb',
  right:  '/models/pink%20vape%20device%203d%20model.glb',
};

const INTRO_DURATION = 0.85;
const INTRO_Z_OFFSET = -10;
const INTRO_SETTLE   = 1.2; // segundos tras compilación antes de animar

// Monta solo cuando todos los GLTF del Suspense cargaron.
// Usa performance.now() (reloj del browser, nunca se resetea) para que
// IntersectionObserver pausando el canvas no reinicie la intro.
function LoadedSignal({ introWallTimeRef }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    gl.compile(scene, camera);               // pre-compila shaders GPU
    introWallTimeRef.current = performance.now();
  }, []);
  return null;
}

function VapeModel({ url, position, rotation, scale, floatOffset, floatSpeed, introDelay = 0, introWallTimeRef }) {
  const { scene } = useGLTF(url);
  const ref       = useRef();
  const introDone = useRef(false);
  const baseY     = position[1];

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();

    // Animación completada — solo levitación, nunca más lógica de intro
    if (introDone.current) {
      ref.current.visible = true;
      ref.current.position.set(position[0], baseY + Math.sin(t * floatSpeed + floatOffset) * 0.1, position[2]);
      return;
    }

    const wallStart = introWallTimeRef.current;
    if (wallStart === null) {
      ref.current.visible = false;
      return;
    }

    // elapsed en segundos desde que cargaron los modelos, usando reloj del browser
    const elapsed = (performance.now() - wallStart) / 1000 - INTRO_SETTLE - introDelay;

    if (elapsed < 0) {
      ref.current.visible = false;
      return;
    }

    const levitation = baseY + Math.sin(t * floatSpeed + floatOffset) * 0.1;

    if (elapsed >= INTRO_DURATION) {
      introDone.current = true;
      ref.current.visible = true;
      ref.current.position.set(position[0], levitation, position[2]);
      return;
    }

    const p     = elapsed / INTRO_DURATION;
    const eased = 1 - Math.pow(1 - p, 3);
    ref.current.visible = true;
    ref.current.position.set(position[0], levitation, position[2] + INTRO_Z_OFFSET * (1 - eased));
  });

  return (
    <group ref={ref} visible={false} position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <primitive object={scene} />
    </group>
  );
}

// Optimizado: 7 capas en vez de 15
const SEGS        = 22;
const BLUR_LAYERS = 7;
const BLUR_SPREAD = 2.5;

// Optimizado: 55 wisps en vez de 155
const WISP_CONFIG = Array.from({ length: 55 }, (_, i) => ({
  x:           ((Math.random() - 0.5) + (Math.random() - 0.5)) * 90,
  z:           (Math.random() - 0.5) * 6,
  speed:       0.03 + Math.random() * 0.06,
  swayPhase:   Math.random() * Math.PI * 2,
  timeOffset:  Math.random() * 30,
  sway:        1.5 + Math.random() * 2.5,
  freq:        3 + Math.random() * 5,
  opacityMult: i < 40 ? 1 : 2.2,
  fadeOutStart: i < 40 ? 0.25 : 0.55,
}));

function SmokeWisp({ x, z, speed, swayPhase, timeOffset, sway, freq, opacityMult = 1, fadeOutStart = 0.25 }) {
  const layers = useMemo(() => Array.from({ length: BLUR_LAYERS }, (_, li) => {
    const positions   = new Float32Array(SEGS * 3);
    const geometry    = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const baseOpacity = li === 0 ? 0.18 : 0.04 + (BLUR_LAYERS - li) * 0.012;
    const material    = new THREE.LineBasicMaterial({ color: '#d0d0ee', transparent: true, opacity: baseOpacity, depthWrite: false });
    const line        = new THREE.Line(geometry, material);
    const ox = li === 0 ? 0 : (Math.random() - 0.5) * BLUR_SPREAD;
    const oz = li === 0 ? 0 : (Math.random() - 0.5) * BLUR_SPREAD;
    return { line, geometry, material, baseOpacity, ox, oz };
  }), []);

  useFrame(({ clock }) => {
    const t        = clock.getElapsedTime();
    const cycle    = (t * speed + timeOffset) % 50;
    const baseY    = -30 + cycle;
    const progress = cycle / 50;
    const fadeIn   = Math.min(1, progress / 0.05);
    const fadeOut  = Math.max(0, 1 - (progress - fadeOutStart) / 0.4);
    const fade     = Math.min(fadeIn, fadeOut);

    for (const { geometry, material, baseOpacity, ox, oz } of layers) {
      material.opacity = baseOpacity * fade * opacityMult;
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < SEGS; i++) {
        const p = i / (SEGS - 1);
        pos[i * 3]     = x + ox + Math.sin(p * freq - t * 0.12 + swayPhase) * sway + Math.sin(p * freq * 0.5 - t * 0.08) * sway * 0.5;
        pos[i * 3 + 1] = baseY + p * 22;
        pos[i * 3 + 2] = z + oz + Math.cos(p * freq * 0.8 - t * 0.1 + swayPhase) * sway * 0.5;
      }
      geometry.attributes.position.needsUpdate = true;
    }
  });

  return <>{layers.map((layer, i) => <primitive key={i} object={layer.line} />)}</>;
}

function Smoke() {
  return <>{WISP_CONFIG.map((cfg, i) => <SmokeWisp key={i} {...cfg} />)}</>;
}

function Scene() {
  const introWallTimeRef = useRef(null);

  return (
    <>
      <fog attach="fog" args={['#111111', 18, 38]} />
      <ambientLight intensity={0.14} />
      <pointLight position={[0, 0, 20]}   intensity={3.5} color="#ffffff" />
      <pointLight position={[0, 0, -20]}  intensity={200} color="#ffffff" />
      <pointLight position={[-5, 3, -15]} intensity={150} color="#ffffff" />
      <pointLight position={[5, 3, -15]}  intensity={150} color="#ffffff" />
      <pointLight position={[0, 5, -20]}  intensity={150} color="#ffffff" />
      <pointLight position={[-10, 12, 5]} intensity={200} color="#ffffff" />
      <pointLight position={[0, 10, 8]}   intensity={80}  color="#ffffff" />
      <pointLight position={[-20, 15, 6]} intensity={220} color="#ffffff" />
      <pointLight position={[0, -10, 5]}  intensity={30}  color="#ffffff" />
      <pointLight position={[0, -6, 10]}  intensity={80}  color="#ffffff" />
      <pointLight position={[4, -8, 8]}   intensity={60}  color="#ffffff" />

      <Suspense fallback={null}>
        <VapeModel url={MODELS.center}   position={[7.4, 2, 9.5]}       rotation={[0., 16.85, 0.01]}   scale={9.6} floatOffset={0}   floatSpeed={0.8} introDelay={0}    introWallTimeRef={introWallTimeRef} />
        <VapeModel url={MODELS.left}     position={[-4.7, -1.94, 10.5]} rotation={[0.5, -1.4, 0.5]}    scale={5}   floatOffset={1.5} floatSpeed={0.8} introDelay={0.15} introWallTimeRef={introWallTimeRef} />
        <VapeModel url={MODELS.right}    position={[0.8, -0.1, 11]}     rotation={[-0.3, -1.4, -6.60]} scale={5}   floatOffset={2.9} floatSpeed={0.8} introDelay={0.3}  introWallTimeRef={introWallTimeRef} />
        <ContactShadows position={[3, -3.5, 10]} opacity={0.55} scale={28} blur={3} far={6} color="#000000" />
        <Environment preset="night" />
        <LoadedSignal introWallTimeRef={introWallTimeRef} />
      </Suspense>
    </>
  );
}

useGLTF.preload(MODELS.center);
useGLTF.preload(MODELS.left);
useGLTF.preload(MODELS.right);

export default function BannerHero3D() {
  const [isVisible, setIsVisible] = useState(true);
  const bannerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    if (bannerRef.current) observer.observe(bannerRef.current);
    return () => observer.disconnect();
  }, []);

  const frameloop = isVisible ? 'always' : 'never';

  return (
    <div
      ref={bannerRef}
      className="relative w-full h-[30vh] md:h-[48vh] bg-[#0d0d0d] overflow-hidden"
      style={{ isolation: 'isolate', maskImage: 'linear-gradient(to bottom, black 92%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 92%, transparent 100%)' }}
    >
      {/* Logo 028 semi-transparente de fondo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true">
        <img
          src="https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png"
          alt=""
          className="h-[100%] w-auto object-contain"
          style={{ opacity: 0.1, filter: 'brightness(10) saturate(0)' }}
        />
      </div>

      {/* Canvas humo */}
      <Canvas
        frameloop={frameloop}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, filter: 'blur(14px)', pointerEvents: 'none' }}
        camera={{ position: [0, 0.5, 16], fov: 65, near: 0.1, far: 200 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      >
        <Smoke />
      </Canvas>

      {/* Canvas vapes */}
      <Canvas
        frameloop={frameloop}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2 }}
        camera={{ position: [0, 0.5, 16], fov: 65, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      >
        <Scene />
      </Canvas>

      {/* degradé inferior */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '20%', zIndex: 10, pointerEvents: 'none', background: 'linear-gradient(to bottom, transparent 0%, rgba(13,13,13,0.6) 100%)' }} />
    </div>
  );
}
