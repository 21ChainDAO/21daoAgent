import React from 'react';

// Pixel Degen mascot - a trader with cap, shades, holding a tablet with green candles.
// Built as a CSS grid of colored pixels for crisp pixel-art aesthetic.
const K = '#0a0a0a';   // outline
const S = '#f1c27d';   // skin
const SD = '#c98e5a';  // skin shadow
const H = '#101010';   // hat / hoodie
const HD = '#1a1a1a';  // hoodie shadow
const W = '#F5F5F5';   // white
const G = '#00FF29';   // green
const DG = '#0f7a2e';  // dark green
const R = '#ff3838';   // red candle
const Y = '#ffe93d';   // accent
const T = null;        // transparent

// 24x24 sprite
const sprite = [
  // row 0
  [T,T,T,T,T,T,K,K,K,K,K,K,K,K,K,K,K,K,T,T,T,T,T,T],
  [T,T,T,T,T,K,H,H,H,H,H,H,H,H,H,H,H,H,K,T,T,T,T,T],
  [T,T,T,T,K,H,H,G,G,H,H,H,H,H,H,H,H,H,H,K,T,T,T,T],
  [T,T,T,K,H,H,G,G,G,G,H,H,H,H,H,H,H,H,H,H,K,T,T,T],
  [T,T,K,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,K,T,T],
  [T,K,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,K,T],
  [T,K,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,K,T],
  [T,T,K,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,K,T,T],
  [T,T,K,S,S,K,K,K,K,K,S,S,S,K,K,K,K,K,S,S,S,K,T,T],
  [T,T,K,S,S,K,W,W,W,K,S,S,S,K,W,W,W,K,S,S,S,K,T,T],
  [T,T,K,S,S,K,K,K,K,K,S,S,S,K,K,K,K,K,S,S,S,K,T,T],
  [T,T,K,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,K,T,T],
  [T,T,K,S,S,S,S,SD,SD,SD,S,S,S,SD,SD,SD,S,S,S,S,S,K,T,T],
  [T,T,K,S,S,S,S,S,S,S,S,K,K,S,S,S,S,S,S,S,S,K,T,T],
  [T,T,T,K,S,S,S,S,S,S,K,W,W,K,S,S,S,S,S,S,K,T,T,T],
  [T,T,T,T,K,S,S,S,S,S,K,K,K,K,S,S,S,S,S,K,T,T,T,T],
  [T,T,K,K,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,K,K,T,T],
  [T,K,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,HD,K,T],
  [K,HD,HD,HD,HD,K,K,K,K,K,K,K,K,K,K,K,K,K,K,HD,HD,HD,HD,K],
  [K,HD,HD,HD,K,W,W,W,W,W,W,W,W,W,W,W,W,W,W,K,HD,HD,HD,K],
  [K,HD,HD,HD,K,W,DG,G,W,W,R,R,W,W,DG,G,W,W,W,K,HD,HD,HD,K],
  [K,HD,HD,HD,K,W,G,G,W,W,R,R,W,W,G,G,W,W,W,K,HD,HD,HD,K],
  [K,HD,HD,HD,K,W,G,G,W,W,R,W,W,W,G,W,W,W,W,K,HD,HD,HD,K],
  [T,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,T],
];

export default function PixelDegen({ scale = 12 }) {
  return (
    <div className="float-idle pulse-glow" style={{ display: 'inline-block' }}>
      <div
        className="pixelated"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${sprite[0].length}, ${scale}px)`,
          gridAutoRows: `${scale}px`,
        }}
      >
        {sprite.flat().map((c, i) => (
          <span key={i} style={{ background: c || 'transparent' }} />
        ))}
      </div>
      {/* Yellow accent coins around */}
      <span style={{
        position: 'absolute', marginLeft: -40, marginTop: -200,
        width: 12, height: 12, background: Y, boxShadow: '0 0 12px #ffe93d',
        animation: 'floatIdle 3s ease-in-out infinite',
      }} />
    </div>
  );
}
