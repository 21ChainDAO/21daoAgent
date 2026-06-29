import React, { useMemo } from 'react';

export default function BackgroundFX() {
  const particles = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 2 + Math.round(Math.random() * 3),
    delay: Math.random() * 12,
    duration: 14 + Math.random() * 14,
    color: Math.random() > 0.4 ? '#00FF29' : '#13b84d',
  })), []);

  const blinkers = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    delay: Math.random() * 6,
  })), []);

  return (
    <>
      {/* Grid */}
      <div className="fixed inset-0 grid-bg pointer-events-none" style={{ zIndex: 1 }} />
      {/* Vignette + scanlines applied via parent classes */}
      {/* Floating pixel particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
        {particles.map(p => (
          <span
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              bottom: '-10px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              boxShadow: `0 0 6px ${p.color}`,
              opacity: 0.7,
              animation: `driftUp ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
        {blinkers.map(b => (
          <span
            key={`b-${b.id}`}
            style={{
              position: 'absolute',
              top: `${b.top}%`,
              left: `${b.left}%`,
              width: '3px', height: '3px',
              background: '#00FF29',
              animation: `blink 2.4s steps(1) ${b.delay}s infinite`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>
    </>
  );
}
