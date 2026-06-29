import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { whyDegens } from '../mock';
import { Zap, Shield, Droplet, Link as LinkIcon } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const iconMap = { zap: Zap, shield: Shield, droplet: Droplet, link: LinkIcon };

function useCount(target, start) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf, t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1600);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [start, target]);
  return v;
}

export default function WhyAndNumbers() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [live, setLive] = useState({ total_volume: 0, users: 0 });
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.25 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    axios.get(`${API}/stats/landing`).then(r => setLive(r.data)).catch(() => {});
  }, []);

  // total volume in billions, fallback to 5B
  const volB = Math.max(5, Math.round((live.total_volume || 0) / 1e9));
  // users in thousands, fallback to 120k
  const usersK = Math.max(120, Math.round((live.users || 0) / 1000));
  const vol = useCount(volB, inView);
  const traders = useCount(usersK, inView);
  const uptime = useCount(9998, inView);
  const lev = useCount(1000, inView);

  return (
    <section ref={ref} className="relative z-10 py-28">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Why */}
        <div className="text-center mb-16">
          <div className="section-label mb-4 inline-flex">// WHY.DEGENS</div>
          <h2 className="font-pixel text-white text-[22px] md:text-[36px] leading-tight">
            BECAUSE THE HOUSE<br/>SHOULDN&apos;T <span className="glow-green">ALWAYS WIN.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-28">
          {whyDegens.map((w, i) => {
            const Icon = iconMap[w.icon];
            return (
              <div key={w.title} className="pixel-card p-6 text-center hover:border-[#00FF29] transition-colors">
                <div className="flex items-center justify-center mb-5">
                  <div className="relative w-14 h-14 flex items-center justify-center" style={{ background:'#0d0d0d', border:'2px solid #1f1f1f' }}>
                    <Icon size={22} className="text-[#00FF29]" strokeWidth={2.4} />
                  </div>
                </div>
                <div className="font-pixel text-[10px] text-white mb-3">{w.title}</div>
                <div className="font-mono text-[16px] text-[#808080]">{w.desc}</div>
                <div className="divider-pixel mt-5" />
                <div className="font-pixel text-[7px] text-[#808080] mt-3">[0x{(i+1).toString(16).padStart(2,'0')}] OK</div>
              </div>
            );
          })}
        </div>

        {/* Numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { label: 'TRADING VOLUME', value: `$${vol}B+` },
            { label: 'TRADERS', value: `${traders}k+` },
            { label: 'UPTIME', value: `${(uptime/100).toFixed(2)}%` },
            { label: 'MAX LEVERAGE', value: `${lev}x` },
          ].map((n) => (
            <div key={n.label} className="pixel-card py-8">
              <div className="font-pixel text-white text-[22px] md:text-[36px] glow-green">{n.value}</div>
              <div className="font-pixel text-[9px] text-[#808080] mt-3">{n.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
