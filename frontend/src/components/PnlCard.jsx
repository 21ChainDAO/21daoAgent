import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * PnL share card. Pure DOM/SVG so it can be exported via html-to-image.
 * Dimensions: 1080 x 1080 (Instagram/X friendly square).
 * Props:
 *   pair, side, leverage, pnlPct (number, e.g. -100 or +247.5),
 *   pnlUsd (number), entryPrice, liqPrice, closedAt (ISO), handle (string with @),
 *   shareUrl (string for QR)
 */
export default function PnlCard({
  pair, side, leverage, pnlPct, pnlUsd,
  entryPrice, liqPrice, closedAt, handle, shareUrl,
}) {
  const isWin = pnlPct >= 0;
  const accent = isWin ? '#00FF29' : '#ff3838';
  const sideUpper = (side || 'LONG').toUpperCase();
  const sideArrow = sideUpper === 'LONG' ? '\u2191' : '\u2193';
  const sideColor = sideUpper === 'LONG' ? '#00FF29' : '#ff3838';
  const base = (pair || '').split('/')[0] || 'TOKEN';
  const closed = closedAt ? new Date(closedAt) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const closedFmt = `${closed.getUTCFullYear()}-${pad(closed.getUTCMonth() + 1)}-${pad(closed.getUTCDate())} ${pad(closed.getUTCHours())}:${pad(closed.getUTCMinutes())}`;

  const pctStr = `${pnlPct >= 0 ? '+' : ''}${Number(pnlPct).toFixed(0)}%`;
  const usdStr = `${pnlUsd >= 0 ? '+' : '-'}$${Math.abs(Number(pnlUsd)).toFixed(2)}`;
  const handleStr = handle ? (handle.startsWith('@') ? handle : `@${handle}`) : '@degen';
  const safeShare = shareUrl || 'https://degens.bet';

  return (
    <div
      id="pnl-card-export"
      style={{
        width: 1080,
        height: 1080,
        background: '#050505',
        position: 'relative',
        fontFamily: '"Press Start 2P", monospace',
        color: '#F5F5F5',
        overflow: 'hidden',
      }}
    >
      {/* grid background */}
      <svg width="1080" height="1080" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 108} y1="0" x2={i * 108} y2="1080" stroke="#1f2a1f" strokeWidth="1" />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`h${i}`} y1={i * 108} x1="0" y2={i * 108} x2="1080" stroke="#1f2a1f" strokeWidth="1" />
        ))}
      </svg>

      {/* Scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.06,
        backgroundImage: 'repeating-linear-gradient(0deg, #00FF29 0 1px, transparent 1px 4px)',
      }} />

      {/* Logo */}
      <div style={{ position: 'absolute', top: 60, left: 70, display: 'flex', alignItems: 'baseline' }}>
        <span style={{ color: '#00FF29', fontSize: 72, letterSpacing: 2, textShadow: '0 0 18px #00FF29' }}>DEGENS</span>
        <span style={{ color: '#F5F5F5', fontSize: 72, letterSpacing: 2 }}>BET</span>
      </div>

      {/* Position header */}
      <div style={{ position: 'absolute', top: 320, left: 80, display: 'flex', alignItems: 'center', gap: 22 }}>
        <TokenBadge symbol={base} />
        <span style={{ color: sideColor, fontSize: 26 }}>{sideArrow} {sideUpper}</span>
        <span style={{ color: '#8a8a8a', fontSize: 26 }}>/ {leverage}X LEVERAGE</span>
        <span style={{ color: '#F5F5F5', fontSize: 26 }}>({pair})</span>
      </div>

      {/* Big PnL number */}
      <div style={{ position: 'absolute', top: 430, left: 80, display: 'flex', alignItems: 'flex-end', gap: 18 }}>
        <span style={{ color: accent, fontSize: 150, lineHeight: 1, textShadow: `0 0 22px ${accent}` }}>{pctStr}</span>
        <span style={{ color: accent, fontSize: 44, marginBottom: 22 }}>({usdStr})</span>
      </div>

      {/* Entry / Liq prices */}
      <div style={{ position: 'absolute', top: 640, left: 80, display: 'flex', gap: 0 }}>
        <PriceBlock label="ENTRY PRICE" value={fmtP(entryPrice)} />
        <div style={{ width: 1, height: 90, background: '#2a2a2a', margin: '0 36px' }} />
        <PriceBlock label="LIQ. PRICE" value={fmtP(liqPrice)} />
      </div>

      {/* PnL Artwork (right side) */}
      <div style={{ position: 'absolute', right: 60, top: 260, width: 480, height: 620 }}>
        {isWin ? <MoneyBagArt /> : <CoffinArt />}
      </div>

      {/* QR + closed + handle (bottom left) */}
      <div style={{ position: 'absolute', bottom: 70, left: 80, display: 'flex', alignItems: 'flex-end', gap: 28 }}>
        <div style={{ background: '#fff', padding: 12, border: '4px solid #fff' }}>
          <QRCodeSVG value={safeShare} size={150} bgColor="#fff" fgColor="#000" level="M" />
        </div>
        <div style={{ paddingBottom: 6 }}>
          <div style={{ color: '#808080', fontSize: 22, marginBottom: 14 }}>
            CLOSED AT: <span style={{ color: '#F5F5F5' }}>{closedFmt}</span>
          </div>
          <div style={{ color: '#F5F5F5', fontSize: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              width: 26, height: 22, background: '#00FF29',
              boxShadow: 'inset -3px -3px 0 #0a8a22, inset 3px 3px 0 #38ff5d',
              display: 'inline-block',
            }} />
            {handleStr}
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div style={{ position: 'absolute', bottom: 70, right: 80, color: '#3a3a3a', fontSize: 16 }}>
        DEGENS.BET // RECEIPT v1
      </div>
    </div>
  );
}

function fmtP(v) {
  const n = Number(v) || 0;
  if (n === 0) return '—';
  if (n >= 1000) return n.toFixed(2);
  if (n >= 1) return n.toFixed(4);
  return n.toPrecision(4);
}

function PriceBlock({ label, value }) {
  return (
    <div>
      <div style={{ color: '#808080', fontSize: 18, letterSpacing: 1, marginBottom: 18 }}>{label}</div>
      <div style={{ color: '#F5F5F5', fontSize: 40, fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

function TokenBadge({ symbol }) {
  // First letter only, pixel circle
  const ch = (symbol || '?').slice(0, 1);
  return (
    <div style={{
      width: 56, height: 56, borderRadius: '50%', border: '3px solid #F5F5F5',
      background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color: '#F5F5F5', fontSize: 22 }}>{ch}</span>
    </div>
  );
}

/* ---------- Pixel art: Money Bag on pedestal (WIN) ---------- */
function MoneyBagArt() {
  // 16x20 sprite — money bag w/ $ sign
  const O = '#0a0a0a';   // outline
  const Y = '#f0a040';   // bag body
  const YD = '#c97720';  // bag shadow
  const YL = '#ffd07a';  // bag highlight
  const W = '#1a1a1a';   // dollar dark
  const D = '#0a0a0a';
  const T = null;
  const s = [
    [T,T,T,T,T,T,O,O,O,O,T,T,T,T,T,T],
    [T,T,T,T,T,O,YD,Y,Y,YD,O,T,T,T,T,T],
    [T,T,T,T,T,O,YD,Y,Y,YD,O,T,T,T,T,T],
    [T,T,T,T,O,Y,YD,YD,YD,YD,Y,O,T,T,T,T],
    [T,T,T,O,Y,Y,YD,YD,YD,YD,Y,Y,O,T,T,T],
    [T,T,O,Y,YL,Y,Y,YD,YD,Y,Y,YL,Y,O,T,T],
    [T,O,Y,YL,Y,Y,Y,Y,Y,Y,Y,Y,YL,Y,O,T],
    [O,Y,YL,Y,Y,Y,Y,D,D,Y,Y,Y,Y,YL,Y,O],
    [O,Y,Y,Y,Y,D,D,D,D,D,D,Y,Y,Y,Y,O],
    [O,Y,Y,Y,D,D,Y,D,D,Y,D,D,Y,Y,Y,O],
    [O,Y,Y,Y,Y,Y,Y,D,D,Y,Y,Y,Y,Y,Y,O],
    [O,Y,Y,Y,Y,D,D,D,D,D,D,Y,Y,Y,Y,O],
    [O,Y,YL,Y,Y,D,D,Y,D,D,D,Y,Y,YL,Y,O],
    [O,Y,YL,Y,Y,D,D,Y,D,D,D,Y,Y,YL,Y,O],
    [O,Y,Y,Y,Y,D,D,D,D,D,D,Y,Y,Y,Y,O],
    [O,Y,Y,Y,Y,YD,YD,YD,YD,YD,YD,Y,Y,Y,Y,O],
    [O,Y,Y,YD,YD,YD,YD,YD,YD,YD,YD,YD,YD,Y,Y,O],
    [T,O,Y,YD,YD,YD,YD,YD,YD,YD,YD,YD,YD,Y,O,T],
    [T,T,O,O,YD,YD,YD,YD,YD,YD,YD,YD,O,O,T,T],
    [T,T,T,T,O,O,O,O,O,O,O,O,T,T,T,T],
  ];
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Candle blips (ascending - win) */}
      <svg style={{ position: 'absolute', top: 0, right: 0, width: 280, height: 200 }}>
        {[0,1,2,3,4,5].map(i => (
          <rect key={i} x={20 + i*40} y={140 - i*22}
                width={18} height={10 + i*22} fill="#00FF29" />
        ))}
      </svg>
      <PixelGrid grid={s} scale={22} style={{ position: 'absolute', top: 100, left: 60 }} />
      {/* Pedestal */}
      <Pedestal color="#ffd07a" />
    </div>
  );
}

/* ---------- Pixel art: Coffin on pedestal (LOSS) ---------- */
function CoffinArt() {
  const O = '#0a0a0a';
  const D = '#1a0a0a';
  const M = '#3a1212';
  const L = '#5a1818';
  const W = '#F5F5F5';
  const T = null;
  const s = [
    [T,T,T,T,T,O,O,O,O,O,O,T,T,T,T,T],
    [T,T,T,T,O,L,L,M,M,L,L,O,T,T,T,T],
    [T,T,T,O,L,L,M,M,M,M,L,L,O,T,T,T],
    [T,T,O,L,L,M,M,W,W,M,M,L,L,O,T,T],
    [T,O,L,L,M,M,M,W,W,M,M,M,L,L,O,T],
    [T,O,L,M,M,W,W,W,W,W,W,M,M,L,O,T],
    [T,O,L,M,M,M,M,W,W,M,M,M,M,L,O,T],
    [T,O,L,M,M,M,M,W,W,M,M,M,M,L,O,T],
    [T,O,L,M,M,M,M,M,M,M,M,M,M,L,O,T],
    [T,O,L,M,M,M,M,M,M,M,M,M,M,L,O,T],
    [T,O,L,M,M,M,M,M,M,M,M,M,M,L,O,T],
    [T,O,L,M,M,M,M,M,M,M,M,M,M,L,O,T],
    [T,O,L,M,M,M,M,M,M,M,M,M,M,L,O,T],
    [T,O,L,M,M,M,M,M,M,M,M,M,M,L,O,T],
    [T,O,L,M,M,M,M,M,M,M,M,M,M,L,O,T],
    [T,O,L,M,M,M,M,M,M,M,M,M,M,L,O,T],
    [T,O,L,M,M,M,M,M,M,M,M,M,M,L,O,T],
    [T,O,L,M,M,M,M,M,M,M,M,M,M,L,O,T],
    [T,O,L,L,M,M,M,M,M,M,M,M,L,L,O,T],
    [T,T,O,O,O,O,O,O,O,O,O,O,O,O,T,T],
  ];
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Candle blips (descending - loss) */}
      <svg style={{ position: 'absolute', top: 0, right: 0, width: 280, height: 200 }}>
        {[0,1,2,3,4,5].map(i => (
          <rect key={i} x={20 + i*40} y={20 + i*22}
                width={18} height={140 - i*22} fill="#ff3838" />
        ))}
      </svg>
      <PixelGrid grid={s} scale={22} style={{ position: 'absolute', top: 60, left: 60 }} />
      <Pedestal color="#5a1818" />
    </div>
  );
}

function Pedestal({ color = '#ffd07a' }) {
  return (
    <svg viewBox="0 0 480 120" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%' }}>
      <polygon points="120,0 360,0 440,120 40,120" fill="#050505" stroke={color} strokeWidth="2" />
      <line x1="120" y1="0" x2="360" y2="0" stroke={color} strokeWidth="3" />
    </svg>
  );
}

function PixelGrid({ grid, scale = 20, style = {} }) {
  const cols = grid[0].length;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${scale}px)`,
        gridAutoRows: `${scale}px`,
        imageRendering: 'pixelated',
        ...style,
      }}
    >
      {grid.flat().map((c, i) => (
        <span key={i} style={{ background: c || 'transparent' }} />
      ))}
    </div>
  );
}
