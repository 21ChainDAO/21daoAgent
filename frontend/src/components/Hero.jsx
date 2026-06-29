import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PixelDegen from './PixelDegen';
import { ArrowRight, Terminal } from 'lucide-react';

const greenWords = ['1000X', 'NO SLIPPAGE.', 'NO CUSTODY.'];

function Typewriter({ text, delay = 0, className = '' }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    let i = 0;
    const start = setTimeout(() => {
      const id = setInterval(() => {
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) clearInterval(id);
      }, 55);
    }, delay);
    return () => clearTimeout(start);
  }, [text, delay]);
  return <span className={className}>{shown}</span>;
}

export default function Hero() {
  return (
    <section className="relative z-10 pt-6 pb-24">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col items-center text-center">
          <div className="tag-line mb-8 flicker">
            <span className="opacity-70">&gt;</span> SYSTEM ONLINE :: MAINNET LIVE
          </div>

          <h1 className="font-pixel text-white leading-[1.15] text-[36px] sm:text-[56px] md:text-[84px] lg:text-[110px] tracking-[0.02em]">
            <div><Typewriter text="TRADE" /></div>
            <div className="glow-green"><Typewriter text="1000X" delay={500} /></div>
            <div><Typewriter text="FUTURES" delay={1100} /></div>
          </h1>

          <p className="font-mono text-[22px] md:text-[26px] text-[#F5F5F5] mt-10 max-w-2xl leading-snug">
            <span className="glow-green">1000X</span> ON-CHAIN FUTURES.{' '}
            <span className="glow-green">NO SLIPPAGE.</span>{' '}
            <span className="glow-green">NO CUSTODY.</span>
          </p>

          <p className="font-mono text-[18px] text-[#808080] mt-4 max-w-md">
            Trade any market. One click. Built for degens.<br/>Powered by blockchain.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Link to="/app" className="pixel-btn pixel-btn-primary">
              LAUNCH APP <ArrowRight className="ml-2" size={14} />
            </Link>
            <button className="pixel-btn pixel-btn-secondary">
              <Terminal size={14} className="mr-2" /> READ DOCS
            </button>
          </div>
        </div>

        {/* Mascot */}
        <div className="relative mt-16 flex items-center justify-center">
          <div className="absolute w-[460px] h-[460px] rounded-full" style={{
            background: 'radial-gradient(circle, rgba(0,255,41,0.18) 0%, rgba(0,255,41,0) 70%)',
          }} />
          {/* Floating pixel emojis around */}
          <FloatingDecor />
          <PixelDegen scale={11} />
        </div>
      </div>
    </section>
  );
}

function FloatingDecor() {
  const items = [
    { left: '8%', top: '10%', label: '$', color: '#00FF29' },
    { left: '88%', top: '14%', label: '↑', color: '#00FF29' },
    { left: '4%', top: '70%', label: ':)', color: '#F5F5F5' },
    { left: '90%', top: '76%', label: '*', color: '#ffe93d' },
    { left: '22%', top: '4%', label: '+', color: '#00FF29' },
    { left: '78%', top: '46%', label: '/\\', color: '#F5F5F5' },
  ];
  return (
    <>
      {items.map((it, i) => (
        <span
          key={i}
          className="absolute font-pixel float-idle"
          style={{
            left: it.left, top: it.top,
            color: it.color,
            fontSize: 14,
            opacity: 0.55,
            textShadow: `0 0 10px ${it.color}`,
            animationDelay: `${i * 0.3}s`,
          }}
        >
          {it.label}
        </span>
      ))}
    </>
  );
}
