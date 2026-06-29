import React, { useEffect, useState } from 'react';
import { api, fmtUsd } from '../lib/api';
import { Trophy, Crown, Swords, Users } from 'lucide-react';

const TABS = [
  { id: 'global-paper', label: 'GLOBAL PAPER', kind: 'global', account: 'paper', accent: '#00FF29' },
  { id: 'global-real',  label: 'GLOBAL REAL',  kind: 'global', account: 'real',  accent: '#ff3838' },
  { id: 'comp-paper',   label: 'PAPER ARCADE', kind: 'comp',   account: 'paper', accent: '#00FF29', compId: 'paper-main' },
  { id: 'comp-real',    label: 'REAL ARENA',   kind: 'comp',   account: 'real',  accent: '#ff3838', compId: 'real-main'  },
];

export default function Leaderboard() {
  const [tabId, setTabId] = useState('global-paper');
  const tab = TABS.find(t => t.id === tabId);
  const [rows, setRows] = useState([]);
  const [comp, setComp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        if (tab.kind === 'global') {
          const r = await api.get(`/leaderboard/${tab.account}`);
          if (!alive) return;
          setRows(r.data.leaderboard);
          setComp(null);
        } else {
          const [lb, comps] = await Promise.all([
            api.get(`/competitions/${tab.compId}/leaderboard`),
            api.get('/competitions'),
          ]);
          if (!alive) return;
          setRows(lb.data.leaderboard);
          setComp((comps.data.competitions || []).find(c => c.id === tab.compId) || null);
        }
      } catch (e) { /* noop */ }
      finally { setLoading(false); }
    };
    load();
    const id = setInterval(load, 10000);
    return () => { alive = false; clearInterval(id); };
  }, [tabId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <div className="section-label">// LEADERBOARD.SYS</div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-pixel text-white text-[22px] flex items-center gap-3">
          <Trophy className="text-[#00FF29]" /> RANKINGS
        </h1>
      </div>

      {/* Tab strip */}
      <div className="flex flex-wrap border-2 border-[#1f1f1f] bg-[#0d0d0d]">
        {TABS.map(t => {
          const active = t.id === tabId;
          return (
            <button
              key={t.id}
              data-testid={`leaderboard-tab-${t.id}`}
              onClick={() => setTabId(t.id)}
              className={`px-4 sm:px-5 py-2 font-pixel text-[9px] transition-colors flex items-center gap-2 ${
                active ? 'text-[#050505]' : 'text-[#808080] hover:text-white'
              }`}
              style={active ? { background: t.accent } : {}}
            >
              {t.kind === 'comp' ? <Swords size={11} /> : <Trophy size={11} />}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Competition meta strip */}
      {tab.kind === 'comp' && comp && (
        <div className="pixel-card p-4 flex flex-wrap items-center justify-between gap-4"
             style={{ borderColor: tab.accent }}>
          <div>
            <div className="font-pixel text-[8px]" style={{ color: tab.accent }}>// {comp.name}</div>
            <div className="font-mono text-[14px] text-[#808080] mt-1">
              Standings reflect PnL since each player joined — opt-in only.
            </div>
          </div>
          <div className="flex gap-5">
            <div>
              <div className="font-pixel text-[7px] text-[#808080]">ENTRY</div>
              <div className="font-pixel text-[12px] text-white">{comp.entry_fee_sol} SOL</div>
            </div>
            <div>
              <div className="font-pixel text-[7px] text-[#808080]">PRIZE POOL</div>
              <div className="font-pixel text-[12px] glow-green">{fmtUsd(comp.prize_pool_usd)}</div>
            </div>
            <div>
              <div className="font-pixel text-[7px] text-[#808080]">PLAYERS</div>
              <div className="font-pixel text-[12px] text-white flex items-center gap-1">
                <Users size={10} />{comp.participants_count}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="pixel-card p-0 overflow-hidden">
        {tab.kind === 'global' ? (
          <div className="grid grid-cols-12 font-pixel text-[8px] text-[#808080] px-4 py-3 border-b-2 border-[#1f1f1f] bg-[#0a0a0a]">
            <div className="col-span-1">RANK</div>
            <div className="col-span-4">TRADER</div>
            <div className="col-span-2 text-right">PNL</div>
            <div className="col-span-2 text-right">BALANCE</div>
            <div className="col-span-2 text-right">TRADES</div>
            <div className="col-span-1 text-right">WIN%</div>
          </div>
        ) : (
          <div className="grid grid-cols-12 font-pixel text-[8px] text-[#808080] px-4 py-3 border-b-2 border-[#1f1f1f] bg-[#0a0a0a]">
            <div className="col-span-1">RANK</div>
            <div className="col-span-5">TRADER</div>
            <div className="col-span-3 text-right">COMP PNL</div>
            <div className="col-span-2 text-right">TRADES</div>
            <div className="col-span-1 text-right">FEE</div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center font-pixel text-[9px] text-[#808080]">LOADING...</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center font-pixel text-[9px] text-[#808080]">
            {tab.kind === 'comp'
              ? 'NO ENTRIES YET // JOIN THE COMPETITION TO APPEAR HERE'
              : `NO ${tab.account.toUpperCase()} TRADERS YET // BE THE FIRST`}
          </div>
        ) : tab.kind === 'global' ? (
          rows.map((r) => (
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
          ))
        ) : (
          rows.map((r) => (
            <div key={r.rank} className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#1f1f1f]/60 hover:bg-[#0d0d0d]">
              <div className="col-span-1">
                {r.rank === 1 ? <Crown className="text-[#ffe93d]" size={18} /> :
                  <span className="font-pixel text-[10px] text-[#808080]">#{r.rank}</span>}
              </div>
              <div className="col-span-5 flex items-center gap-3">
                {r.x_avatar ? (
                  <img src={r.x_avatar} alt="" className="w-8 h-8 border-2 border-[#1f1f1f]" />
                ) : (
                  <div className="w-8 h-8 bg-[#0d0d0d] border-2 border-[#1f1f1f] flex items-center justify-center font-pixel text-[7px]" style={{ color: tab.accent }}>DG</div>
                )}
                <div>
                  <div className="font-pixel text-[9px] text-white">@{r.x_handle || 'anon'}</div>
                  <div className="font-mono text-[13px] text-[#808080]">{r.x_name || 'Degen'}</div>
                </div>
              </div>
              <div className={`col-span-3 text-right font-pixel text-[12px] ${r.comp_pnl >= 0 ? 'text-[#00FF29]' : 'text-[#ff3838]'}`}>
                {fmtUsd(r.comp_pnl, { sign: true })}
              </div>
              <div className="col-span-2 text-right font-mono text-[15px] text-[#808080]">{r.trades_count}</div>
              <div className="col-span-1 text-right font-pixel text-[9px]" style={{ color: tab.accent }}>
                {r.fee_sol_paid} SOL
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
