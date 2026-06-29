import React from 'react';

// Pixel grid logo "DB" mark made of squares
export default function PixelLogo({ size = 18, gap = 2 }) {
  const G = '#00FF29';
  const W = '#F5F5F5';
  // 5x5 D and 5x5 B pixel maps
  const D = [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
  ];
  const B = [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,1,1,1,0],
  ];
  const render = (grid, color) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(5, ${size}px)`, gap }}>
      {grid.flat().map((v, i) => (
        <span key={i} style={{ width: size, height: size, background: v ? color : 'transparent' }} />
      ))}
    </div>
  );
  return (
    <div className="flex items-center gap-3">
      {render(D, G)}
      {render(B, W)}
    </div>
  );
}
