import React from 'react';
import PixelLogo from './PixelLogo';
import { Twitter, Github, MessageCircle, Send } from 'lucide-react';

const cols = [
  { title: 'PRODUCT', links: ['Trade', 'Markets', 'Leaderboard', 'API'] },
  { title: 'COMMUNITY', links: ['Twitter', 'Discord', 'Telegram', 'Blog'] },
  { title: 'RESOURCES', links: ['Docs', 'Whitepaper', 'Audits', 'Brand'] },
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t-2 border-[#1f1f1f] bg-[#050505]">
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <PixelLogo size={5} />
            <div className="font-pixel text-[10px] text-white mt-4">DEGENSBET</div>
            <p className="font-mono text-[18px] text-[#808080] mt-4 max-w-sm">
              An on-chain casino for the screen-burned. Built by degens, for degens.
            </p>
            <div className="flex gap-3 mt-6">
              {[Twitter, Github, MessageCircle, Send].map((Icon, i) => (
                <a key={i} href="#" onClick={(e)=>e.preventDefault()}
                  className="w-10 h-10 flex items-center justify-center border-2 border-[#1f1f1f] text-[#808080] hover:text-[#00FF29] hover:border-[#00FF29] transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title} className="md:col-span-2">
              <div className="font-pixel text-[9px] text-[#00FF29] mb-4 tracking-[0.2em]">{c.title}</div>
              <ul className="space-y-3">
                {c.links.map(l => (
                  <li key={l}>
                    <a href="#" onClick={(e)=>e.preventDefault()}
                      className="font-mono text-[18px] text-[#808080] hover:text-[#F5F5F5] hover:underline decoration-[#00FF29]">
                      {l}
                    </a>
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
            © {new Date().getFullYear()} DEGENSBET // ALL RIGHTS RESERVED
          </div>
          <div className="font-pixel text-[8px] text-[#808080]">
            BUILD 0x4A2F · <span className="text-[#00FF29] flicker">MAINNET ONLINE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
