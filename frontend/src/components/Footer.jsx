import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter } from 'lucide-react';

const cols = [
  { title: 'PRODUCT', links: [
    { label: 'Trade', to: '/app/trade' },
    { label: 'Competitions', to: '/app/competitions' },
    { label: 'Leaderboard', to: '/app/leaderboard' },
    { label: 'Launch App', to: '/app' },
  ]},
  { title: 'TOKEN', links: [
    { label: '$DEGEN', to: '/#token', external: false },
    { label: 'Tokenomics', to: '/#token', external: false },
  ]},
  { title: 'RESOURCES', links: [
    { label: 'How It Works', to: '/docs' },
    { label: 'Terms', to: '/terms' },
    { label: 'Privacy', to: '/privacy' },
  ]},
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t-2 border-[#1f1f1f] bg-[#050505]">
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <img src="/img/degens-logo.png" alt="DegensBet" className="h-12 pixelated" />
            <p className="font-mono text-[18px] text-[#808080] mt-4 max-w-sm">
              The pixel arcade for crypto degenerates. High stakes. Higher payouts.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="https://x.com/0xdegensbet" target="_blank" rel="noreferrer"
                className="w-10 h-10 flex items-center justify-center border-2 border-[#1f1f1f] text-[#808080] hover:text-[#00FF29] hover:border-[#00FF29] transition-colors">
                <Twitter size={16} />
              </a>
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title} className="md:col-span-2">
              <div className="font-pixel text-[9px] text-[#00FF29] mb-4 tracking-[0.2em]">{c.title}</div>
              <ul className="space-y-3">
                {c.links.map(l => (
                  <li key={l.label}>
                    <Link to={l.to}
                      className="font-mono text-[18px] text-[#808080] hover:text-[#F5F5F5] hover:underline decoration-[#00FF29]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-1" />
        </div>

        <div className="divider-pixel mt-14 mb-6" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-pixel text-[8px] text-[#808080]">
            &copy; {new Date().getFullYear()} DEGENSBET // ALL RIGHTS RESERVED
          </div>
          <div className="font-pixel text-[8px] text-[#808080]">
            <span className="text-[#00FF29] flicker">MAINNET ONLINE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
