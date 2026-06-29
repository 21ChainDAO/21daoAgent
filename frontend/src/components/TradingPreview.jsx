import React from 'react';
import { sidebarLinks, markets, orderBookAsks, orderBookBids } from '../mock';
import { LayoutDashboard, BarChart3, TrendingUp, Wallet, Trophy, Settings, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const iconMap = {
  dashboard: LayoutDashboard,
  markets: BarChart3,
  futures: TrendingUp,
  wallet: Wallet,
  trophy: Trophy,
  settings: Settings,
};

function MiniChart() {
  // SVG candle chart
  const candles = Array.from({ length: 30 }, (_, i) => {
    const base = 40 + Math.sin(i * 0.4) * 20;
    const o = base + (Math.random() - 0.5) * 6;
    const c = base + (Math.random() - 0.5) * 6;
    const h = Math.max(o, c) + Math.random() * 4;
    const l = Math.min(o, c) - Math.random() * 4;
    return { o, c, h, l, up: c >= o };
  });
  const W = 460, H = 220;
  const cw = W / candles.length;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block">
      {/* grid */}
      {Array.from({length:6}).map((_,i)=>(
        <line key={i} x1="0" x2={W} y1={(i+1)*H/7} y2={(i+1)*H/7} stroke="#1f1f1f" strokeDasharray="2 4" />
      ))}
      {candles.map((k, i) => {
        const x = i * cw + cw/2;
        const color = k.up ? '#00FF29' : '#ff3838';
        const yH = H - k.h * 1.6;
        const yL = H - k.l * 1.6;
        const yO = H - k.o * 1.6;
        const yC = H - k.c * 1.6;
        const top = Math.min(yO, yC);
        const bh = Math.max(1, Math.abs(yC - yO));
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={yH} y2={yL} stroke={color} strokeWidth="1" />
            <rect x={x - cw/2 + 2} y={top} width={cw - 4} height={bh} fill={color} />
          </g>
        );
      })}
      {/* dashed price line */}
      <line x1="0" x2={W} y1="80" y2="80" stroke="#00FF29" strokeDasharray="3 4" opacity="0.6" />
    </svg>
  );
}

export default function TradingPreview() {
  return (
    <section className="relative z-10 py-28">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-4">
          <div className="section-label mb-4">// TERMINAL.EXE</div>
          <h2 className="font-pixel text-white text-[24px] md:text-[40px] leading-tight">
            YOUR FAVORITE<br/>
            <span className="glow-green">INFLUENCER PAIRS</span><br/>
            AT <span className="glow-green">1000X</span>
          </h2>
          <p className="font-mono text-[#808080] text-[20px] mt-6">
            Spin up a position on any market with a single keystroke. The arcade is open 24/7.
          </p>
          <div className="flex gap-4 mt-8">
            <button className="pixel-btn pixel-btn-primary">OPEN TERMINAL</button>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="tilt-right pixel-card pixel-card-green p-0 overflow-hidden" style={{ boxShadow: '0 30px 80px rgba(0,255,41,0.10), 0 0 0 1px #13b84d' }}>
            {/* window bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d0d] border-b-2 border-[#1f1f1f]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#00FF29]" />
                <span className="w-3 h-3 bg-[#ffe93d]" />
                <span className="w-3 h-3 bg-[#ff3838]" />
              </div>
              <span className="font-pixel text-[8px] text-[#808080]">DEGENS://TERMINAL/BTC-USD</span>
              <span className="font-pixel text-[8px] text-[#00FF29] flicker">LIVE</span>
            </div>

            <div className="grid grid-cols-12">
              {/* Sidebar */}
              <div className="col-span-2 bg-[#0d0d0d] border-r-2 border-[#1f1f1f] p-3 flex flex-col gap-1">
                {sidebarLinks.map((s, i) => {
                  const Icon = iconMap[s.icon];
                  const active = i === 2;
                  return (
                    <div key={s.label}
                      className={`flex items-center gap-2 px-2 py-2 cursor-crosshair ${active ? 'bg-[#111] border border-[#00FF29]' : 'hover:bg-[#111]'}`}>
                      <Icon size={14} className={active ? 'text-[#00FF29]' : 'text-[#808080]'} />
                      <span className={`font-pixel text-[7px] hidden md:inline ${active ? 'text-[#00FF29]' : 'text-[#808080]'}`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Main */}
              <div className="col-span-10 p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-pixel text-[12px] text-white">BTC/USD</span>
                    <span className="font-pixel text-[10px] text-[#00FF29]">+2.31%</span>
                    <span className="font-pixel text-[10px] text-[#808080]">1000x</span>
                  </div>
                  <div className="flex gap-1">
                    {['1m','5m','15m','1H','4H','1D'].map((t,i)=>(
                      <span key={t} className={`font-pixel text-[8px] px-2 py-1 ${i===3?'bg-[#00FF29] text-[#050505]':'bg-[#0d0d0d] text-[#808080] border border-[#1f1f1f]'}`}>{t}</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 md:col-span-8 bg-[#0d0d0d] border border-[#1f1f1f] p-2">
                    <MiniChart />
                  </div>
                  <div className="col-span-12 md:col-span-4 bg-[#0d0d0d] border border-[#1f1f1f] p-2">
                    <div className="font-pixel text-[8px] text-[#808080] mb-2">ORDER BOOK</div>
                    <div className="space-y-[2px]">
                      {orderBookAsks.map((a,i)=>(
                        <div key={i} className="flex justify-between font-mono text-[14px] text-[#ff3838]">
                          <span>{a.p}</span><span>{a.s}</span>
                        </div>
                      ))}
                      <div className="font-mono text-[16px] text-white text-center my-1">67,420.18</div>
                      {orderBookBids.map((b,i)=>(
                        <div key={i} className="flex justify-between font-mono text-[14px] text-[#00FF29]">
                          <span>{b.p}</span><span>{b.s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Markets ticker */}
                <div className="mt-3 bg-[#0d0d0d] border border-[#1f1f1f] p-2 overflow-hidden">
                  <div className="marquee font-pixel text-[9px]">
                    {[...markets, ...markets].map((m, i) => (
                      <span key={i} className="flex items-center gap-2">
                        <span className="text-white">{m.sym}</span>
                        <span className="text-[#808080]">{m.price}</span>
                        <span className={m.up ? 'text-[#00FF29]' : 'text-[#ff3838]'}>
                          {m.up ? <ArrowUpRight size={10} className="inline" /> : <ArrowDownRight size={10} className="inline" />} {m.chg}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Buy/Sell */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="pixel-btn pixel-btn-primary !py-3 !text-[10px]">BUY / LONG</button>
                  <button className="pixel-btn !py-3 !text-[10px]" style={{ background: '#ff3838', color: '#050505', boxShadow: '0 4px 0 0 #7a1717' }}>SELL / SHORT</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
