import React from 'react';
import { features } from '../mock';
import { Rocket, MousePointer2, Vault, Zap } from 'lucide-react';

const iconMap = { rocket: Rocket, cursor: MousePointer2, vault: Vault, bolt: Zap };

// Pixel icon background
function PixelIconBox({ Icon }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <div className="absolute inset-0" style={{
        background: '#0d0d0d',
        border: '2px solid #1f1f1f',
        boxShadow: 'inset 0 0 0 2px #050505',
      }} />
      {/* corner pixels */}
      {[{t:0,l:0},{t:0,r:0},{b:0,l:0},{b:0,r:0}].map((c,i)=>(
        <span key={i} style={{
          position:'absolute', width:8, height:8, background:'#00FF29',
          ...(c.t!==undefined?{top:c.t}:{}),
          ...(c.b!==undefined?{bottom:c.b}:{}),
          ...(c.l!==undefined?{left:c.l}:{}),
          ...(c.r!==undefined?{right:c.r}:{}),
        }} />
      ))}
      <Icon className="relative text-[#00FF29]" size={28} strokeWidth={2.4} />
    </div>
  );
}

export default function Features() {
  return (
    <section className="relative z-10 py-24">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between mb-12 flex-wrap gap-6">
          <div>
            <div className="section-label mb-4">// FEATURES.SYS</div>
            <h2 className="font-pixel text-white text-[22px] md:text-[34px] leading-tight">
              BUILT DIFFERENT.<br/>BUILT FOR <span className="glow-green">DEGENS.</span>
            </h2>
          </div>
          <p className="font-mono text-[#808080] text-[20px] max-w-md">
            Every primitive in our stack is engineered for speed, sovereignty, and savage size.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = iconMap[f.icon];
            return (
              <div
                key={f.title}
                className="pixel-card p-6 transition-all duration-200 hover:border-[#00FF29] group"
                style={{ animationDelay: `${i*80}ms` }}
              >
                <PixelIconBox Icon={Icon} />
                <h3 className="font-pixel text-[#F5F5F5] text-[12px] mt-6 mb-3 group-hover:glow-green transition-colors">
                  {f.title}
                </h3>
                <p className="font-mono text-[#808080] text-[18px] leading-snug">
                  {f.desc}
                </p>
                <div className="divider-pixel mt-6" />
                <div className="mt-4 flex items-center justify-between font-pixel text-[8px] text-[#808080]">
                  <span>0x{(i+1).toString(16).padStart(4,'0').toUpperCase()}</span>
                  <span className="text-[#00FF29]">[ READY ]</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
