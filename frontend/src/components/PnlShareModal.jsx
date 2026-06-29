import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { X, Download, Twitter, Copy, Check } from 'lucide-react';
import PnlCard from './PnlCard';

/**
 * Modal that wraps PnlCard and provides Download PNG / Share to X / Copy link.
 * Props: open, onClose, position (closed position object), handle (string), shareUrl
 */
export default function PnlShareModal({ open, onClose, position, handle, shareUrl }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!open || !position) return null;

  const pnl = Number(position.pnl || 0);
  const margin = Number(position.margin || 1);
  const pnlPct = (pnl / margin) * 100;

  // Liquidation estimate (back-computed from leverage)
  const lev = Number(position.leverage || 1);
  const entry = Number(position.entry_price || 0);
  const liqDelta = entry / lev;
  const liq = position.side === 'long' ? entry - liqDelta : entry + liqDelta;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current.querySelector('#pnl-card-export'), {
        cacheBust: true,
        pixelRatio: 1,
        width: 1080,
        height: 1080,
        style: { transform: 'none' },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `degensbet-pnl-${position.id || Date.now()}.png`;
      a.click();
    } catch (e) {
      console.error('export failed', e);
    } finally { setDownloading(false); }
  };

  const tweetText = () => {
    const symbol = (position.pair || '').split('/')[0];
    const sideUp = (position.side || '').toUpperCase();
    const pctTxt = `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(0)}%`;
    const usdTxt = `${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toFixed(2)}`;
    return `Just closed ${sideUp} ${lev}x on $${symbol}: ${pctTxt} (${usdTxt})\n\nTrade 1000x at ${shareUrl}`;
  };

  const handleTweet = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText())}`;
    window.open(url, '_blank', 'noopener');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tweetText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { /* noop */ }
  };

  return (
    <div
      data-testid="pnl-share-modal"
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, overflow: 'auto',
      }}
    >
      <div style={{ position: 'relative', maxWidth: 600, width: '100%' }}>
        {/* Close */}
        <button
          data-testid="pnl-modal-close"
          onClick={onClose}
          style={{
            position: 'absolute', top: -44, right: 0, zIndex: 2,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#F5F5F5', display: 'flex', alignItems: 'center', gap: 6,
          }}
          className="font-pixel text-[10px] hover:text-[#00FF29]"
        >
          <X size={14} /> CLOSE
        </button>

        {/* Header */}
        <div className="font-pixel text-[10px] text-[#00FF29] mb-3 tracking-[0.18em]">
          // POSITION CLOSED · SHARE YOUR PNL
        </div>

        {/* Card preview — capped at 540px for a compact share preview */}
        <div ref={cardRef} style={{
          width: '100%', maxWidth: 540, margin: '0 auto', aspectRatio: '1 / 1', position: 'relative',
          border: '2px solid #1f1f1f', overflow: 'hidden', background: '#050505',
        }}>
          <div style={{
            transform: 'scale(0.5)',
            transformOrigin: 'top left',
            position: 'absolute', top: 0, left: 0,
            width: 1080, height: 1080,
          }}>
            <PnlCard
              pair={position.pair}
              side={position.side}
              leverage={position.leverage}
              pnlPct={pnlPct}
              pnlUsd={pnl}
              entryPrice={position.entry_price}
              liqPrice={liq}
              closedAt={position.closed_at}
              handle={handle}
              shareUrl={shareUrl}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            data-testid="pnl-download-btn"
            onClick={handleDownload}
            disabled={downloading}
            className="pixel-btn pixel-btn-secondary !text-[9px] !py-3 flex items-center justify-center gap-2"
          >
            <Download size={14} /> {downloading ? 'RENDERING\u2026' : 'DOWNLOAD PNG'}
          </button>
          <button
            data-testid="pnl-tweet-btn"
            onClick={handleTweet}
            className="pixel-btn pixel-btn-primary !text-[9px] !py-3 flex items-center justify-center gap-2"
          >
            <Twitter size={14} /> POST TO X
          </button>
          <button
            data-testid="pnl-copy-btn"
            onClick={handleCopy}
            className="pixel-btn pixel-btn-secondary !text-[9px] !py-3 flex items-center justify-center gap-2"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'COPIED' : 'COPY CAPTION'}
          </button>
        </div>

        <p className="font-mono text-[12px] text-[#808080] mt-3 leading-snug">
          Tip: Download the PNG and attach it when posting to X for the full pixel-art receipt.
        </p>
      </div>

      <style>{`
        @media (max-width: 700px) {
          [data-testid="pnl-share-modal"] [data-testid="pnl-card-preview"] > div {
            transform: scale(0.36) !important;
          }
        }
      `}</style>
    </div>
  );
}
