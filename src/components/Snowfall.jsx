"use client";

import { useEffect, useState } from "react";

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export default function Snowfall({ count = 140, fading = false, fadeDuration = 3000, zIndex }) {
  const [flakes, setFlakes] = useState([]);

  useEffect(() => {
    setFlakes(
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: randomBetween(0, 100),
        size: randomBetween(6, 16),
        duration: randomBetween(8, 18),
        delay: randomBetween(-18, 0),
        drift: randomBetween(-40, 40),
        opacity: randomBetween(0.35, 0.9),
      }))
    );
  }, [count]);

  if (flakes.length === 0) return null;

  return (
    <div
      className="snowfall-container"
      aria-hidden="true"
      style={{
        opacity: fading ? 0 : 1,
        transition: `opacity ${fadeDuration}ms ease`,
        ...(zIndex !== undefined ? { zIndex } : {}),
      }}
    >
      {flakes.map((flake) => (
        <span
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.size}px`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            opacity: flake.opacity,
            "--drift": `${flake.drift}px`,
          }}
        >
          ❄
        </span>
      ))}
    </div>
  );
}
