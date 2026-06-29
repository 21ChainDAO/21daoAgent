import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PixelLogo from './PixelLogo';
import { Menu, X } from 'lucide-react';

const links = ['TRADE', 'MARKETS', 'LEADERBOARD', 'DOCS', 'COMMUNITY'];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-40">
      <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/img/degens-logo.png" alt="DegensBet" className="h-7 md:h-8 pixelated" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a
              key={l}
              href="#"
              className="font-pixel text-[10px] text-[#808080] hover:text-[#00FF29] transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              {l}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/app" className="pixel-btn pixel-btn-secondary !py-2 !px-4 !text-[9px]">CONNECT</Link>
          <Link to="/app" className="pixel-btn pixel-btn-primary !py-2 !px-4 !text-[9px]">LAUNCH APP</Link>
        </div>

        <button className="md:hidden text-[#00FF29]" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#1f1f1f] bg-[#050505] px-6 py-4 flex flex-col gap-4">
          {links.map(l => (
            <a key={l} href="#" className="font-pixel text-[10px] text-[#808080]" onClick={(e)=>e.preventDefault()}>{l}</a>
          ))}
          <div className="flex gap-3 mt-2">
            <Link to="/app" className="pixel-btn pixel-btn-secondary !py-2 !px-4 !text-[9px]">CONNECT</Link>
            <Link to="/app" className="pixel-btn pixel-btn-primary !py-2 !px-4 !text-[9px]">LAUNCH</Link>
          </div>
        </div>
      )}
    </header>
  );
}
