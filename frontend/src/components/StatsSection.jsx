import React, { useEffect, useRef, useState } from 'react';
import { stats, chartBars } from '../mock';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

const months = ['JAN','FEB','MAR','APRIL','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function useCountUp(target, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return val;
}

export default function StatsSection() {
  const [idx, setIdx] = useState(months.indexOf(stats.month));
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const count = useCountUp(stats.monthlyVolume, 2200, inView);

  return (
    <section ref={ref} className="relative z-10 py-28">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-center gap-6 mb-6">
          <button onClick={() => setIdx((idx - 1 + 12) % 12)} className="text-[#808080] hover:text-[#00FF29]">
            <ChevronLeft />
          </button>
          <h2 className="font-pixel text-[#F5F5F5] text-[28px] md:text-[40px]">{months[idx]}</h2>
          <button onClick={() => setIdx((idx + 1) % 12)} className="text-[#808080] hover:text-[#00FF29]">
            <ChevronRight />
          </button>
        </div>

        <p className="text-center font-pixel text-[10px] text-[#808080] tracking-[0.2em] mb-6">
          MONTHLY TRADING VOLUME
        </p>

        <div className="text-center">
          <div className="font-pixel text-white text-[40px] sm:text-[64px] md:text-[96px] lg:text-[120px] leading-none">
            ${count.toLocaleString('en-US')}
          </div>
          <div className="mt-8 flex items-center justify-center">
            <PixelCheck />
          </div>
        </div>

        {/* Pixel chart bars */}
        <div className="mt-14 flex items-end justify-center gap-2 h-[120px] opacity-90">
          {chartBars.map((b, i) => (
            <div
              key={i}
              className="bar-grow"
              style={{
                width: 14,
                height: `${b.h}%`,
                background: b.up ? '#00FF29' : '#13b84d',
                boxShadow: b.up ? '0 0 10px rgba(0,255,41,0.6)' : 'none',
                animationDelay: `${i * 60}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PixelCheck() {
  // 7x7 pixel checkmark
  const grid = [
    [0,0,0,0,0,0,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,1,1,0],
    [1,0,0,1,1,0,0],
    [1,1,1,1,0,0,0],
    [0,1,1,0,0,0,0],
    [0,1,0,0,0,0,0],
  ];
  return (
    <div
      className="pixelated pulse-glow"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 8px)', gap: 1 }}
    >
      {grid.flat().map((v, i) => (
        <span key={i} style={{ width: 8, height: 8, background: v ? '#00FF29' : 'transparent' }} />
      ))}
    </div>
  );
}
