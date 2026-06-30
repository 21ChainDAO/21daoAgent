import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyText } from '../lib/clipboard';

// Pre-launch placeholder until $DEGEN mints. Update this constant once the real CA exists.
const DEGEN_CA = 'db...pump';

/**
 * Fixed bottom-right pixel-card showing the $DEGEN contract address.
 * Styled like the Features cards (NO SLIPPAGE etc.) but smaller/thinner.
 * Permanently sits where the platform watermark would be.
 */
export default function CaBadge() {
  const [copied, setCopied] = useState(false);
  const isLive = DEGEN_CA && DEGEN_CA !== 'TBA';

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLive) return;
    const ok = await copyText(DEGEN_CA);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const short = !isLive
    ? 'TBA'
    : (DEGEN_CA.length <= 12
        ? DEGEN_CA
        : `${DEGEN_CA.slice(0, 4)}...${DEGEN_CA.slice(-4)}`);

  return (
    <button
      data-testid="ca-badge"
      onClick={handleCopy}
      title={isLive ? `Copy $DEGEN contract: ${DEGEN_CA}` : '$DEGEN contract address coming soon'}
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 2147483647,
        background: '#050505',
        border: '1px solid #1f1f1f',
        boxShadow: '4px 4px 0 0 #00FF29, 0 0 0 1px #050505',
        padding: '6px 10px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: isLive ? 'pointer' : 'default',
        textDecoration: 'none',
        fontFamily: "'Press Start 2P', monospace",
        color: '#F5F5F5',
        imageRendering: 'pixelated',
        transition: 'transform 120ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
    >
      <span style={{ fontSize: 7, color: '#00FF29', letterSpacing: 1 }}>$DEGEN</span>
      <span style={{
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#F5F5F5',
        letterSpacing: 0.5,
      }}>
        CA: {short}
      </span>
      <span
        aria-hidden
        style={{
          fontSize: 7,
          color: copied ? '#00FF29' : '#808080',
          marginLeft: 2,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {copied ? <Check size={10} /> : <Copy size={10} />}
      </span>
    </button>
  );
}
