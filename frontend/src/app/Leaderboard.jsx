import React, { useEffect, useState } from 'react';
import { api, fmtUsd } from '../lib/api';
import { Trophy, Crown } from 'lucide-react';

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await api.get('/leaderboard');
        if (!alive) return;
        setRows(r.data.leaderboard);
      } finally { setLoading(false); }
    };
    load();
    const id = setInterval(load, 10000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <div className="space-y-5">
      <div className="section-label">// LEADERBOARD.SYS</div>
      <h1 className="font-pixel text-white text-[22px] flex items-center gap-3">
        <Trophy className="text-[#00FF29]" /> GLOBAL RANKINGS
      </h1>

      <div className="pixel-card p-0 overflow-hidden">
        <div className="grid grid-cols-12 font-pixel text-[8px] text-[#808080] px-4 py-3 border-b-2 border-[#1f1f1f] bg-[#0a0a0a]">
          <div className="col-span-1">RANK</div>
          <div className="col-span-4">TRADER</div>
          <div className="col-span-2 text-right">PNL</div>
          <div className="col-span-2 text-right">BALANCE</div>
          <div className="col-span-2 text-right">TRADES</div>
          <div className="col-span-1 text-right">WIN%</div>
        </div>
        {loading ? (
          <div className="py-12 text-center font-pixel text-[9px] text-[#808080]">LOADING...</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center font-pixel text-[9px] text-[#808080]">NO TRADERS YET // BE THE FIRST</div>
        ) : rows.map((r) => (
          <div key={r.rank} className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#1f1f1f]/60 hover:bg-[#0d0d0d]">
            <div className="col-span-1">
              {r.rank === 1 ? <Crown className="text-[#ffe93d]" size={18} /> :
                <span className="font-pixel text-[10px] text-[#808080]">#{r.rank}</span>}
            </div>
            <div className="col-span-4 flex items-center gap-3">
              {r.x_avatar ? (
                <img src={r.x_avatar} alt="" className="w-8 h-8 border-2 border-[#1f1f1f]" />
              ) : (
                <div className="w-8 h-8 bg-[#0d0d0d] border-2 border-[#1f1f1f] flex items-center justify-center font-pixel text-[7px] text-[#00FF29]">DG</div>
              )}
              <div>
                <div className="font-pixel text-[9px] text-white">@{r.x_handle || 'anon'}</div>
                <div className="font-mono text-[13px] text-[#808080]">{r.x_name || 'Degen'}</div>
              </div>
            </div>
            <div className={`col-span-2 text-right font-pixel text-[11px] ${r.total_pnl >= 0 ? 'text-[#00FF29]' : 'text-[#ff3838]'}`}>
              {fmtUsd(r.total_pnl, { sign: true })}
            </div>
            <div className="col-span-2 text-right font-mono text-[15px] text-white">{fmtUsd(r.balance)}</div>
            <div className="col-span-2 text-right font-mono text-[15px] text-[#808080]">{r.trades_count}</div>
            <div className="col-span-1 text-right font-pixel text-[9px] text-[#00FF29]">{r.win_rate}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
