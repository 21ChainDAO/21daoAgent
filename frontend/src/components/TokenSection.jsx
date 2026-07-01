import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Coins, Lock, Gift, Swords, Rocket, Check, Copy } from 'lucide-react';
import { copyText } from '../lib/clipboard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ICONS = {
  'LOCKED': Lock,
  'REAL REWARDS': Swords,
  'PAPER REWARDS': Swords,
  'PUBLIC LAUNCH': Rocket,
};

function formatN(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(0) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toString();
}

export default function TokenSection() {
  const [info, setInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios.get(`${API}/token`).then(r => setInfo(r.data)).catch(() => {});
  }, []);

  const copy = async () => {
    if (!info?.contract || info.contract === 'TBA') return;
    const ok = await copyText(info.contract);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!info) return null;

  return (
    <section id="token" className="relative z-10 py-28">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center mb-12">
          <div className="section-label mb-4 inline-flex">// $DBET.TOKEN</div>
          <h2 className="font-pixel text-white text-[24px] md:text-[40px] leading-tight">
            POWERED BY <span className="glow-green">$dBET</span>
          </h2>
          <p className="font-mono text-[20px] text-[#808080] mt-4 max-w-2xl mx-auto">
            One billion tokens. Fair launch. Built to reward the degens who built the arcade with us.
          </p>
        </div>

        {/* Contract address */}
        <div className="max-w-3xl mx-auto pixel-card p-5 mb-12">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-pixel text-[8px] text-[#808080] mb-1">CONTRACT ADDRESS · SOLANA</div>
              <div className="font-mono text-[18px] text-[#00FF29] break-all">
                {info.contract === 'TBA' ? <span className="text-[#ffe93d] flicker">TBA — LAUNCHING SOON</span> : info.contract}
              </div>
            </div>
            {info.contract !== 'TBA' && (
              <button onClick={copy} className="pixel-btn pixel-btn-secondary !py-2 !px-3 !text-[9px]">
                {copied ? <><Check size={12} className="mr-2"/>COPIED</> : <><Copy size={12} className="mr-2"/>COPY</>}
              </button>
            )}
          </div>
        </div>

        {/* Tokenomics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {info.tokenomics.map(t => {
            const Icon = ICONS[t.label] || Coins;
            return (
              <div key={t.label} className="pixel-card p-5 text-center" style={{ borderColor: t.color }}>
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 flex items-center justify-center bg-[#0d0d0d] border-2" style={{ borderColor: t.color }}>
                    <Icon size={20} style={{ color: t.color }} />
                  </div>
                </div>
                <div className="font-pixel text-[22px]" style={{ color: t.color }}>{t.pct}%</div>
                <div className="font-pixel text-[9px] text-white mt-2">{t.label}</div>
                <div className="font-mono text-[14px] text-[#808080] mt-2">{formatN(t.amount)} dBET</div>
              </div>
            );
          })}
        </div>

        {/* Stacked bar visualization */}
        <div className="max-w-4xl mx-auto">
          <div className="font-pixel text-[8px] text-[#808080] mb-2 tracking-[0.15em]">SUPPLY DISTRIBUTION · 1,000,000,000 dBET</div>
          <div className="flex h-8 border-2 border-[#1f1f1f]">
            {info.tokenomics.map(t => (
              <div key={t.label} style={{ width: `${t.pct}%`, background: t.color }}
                className="relative group" title={`${t.label}: ${t.pct}%`}>
                <div className="absolute inset-0 flex items-center justify-center font-pixel text-[8px] text-[#050505] opacity-0 group-hover:opacity-100">
                  {t.pct}%
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 justify-center">
            {info.tokenomics.map(t => (
              <div key={t.label} className="flex items-center gap-2">
                <span className="w-3 h-3" style={{ background: t.color }} />
                <span className="font-pixel text-[8px] text-[#808080]">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
