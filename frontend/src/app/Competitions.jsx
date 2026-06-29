import React, { useEffect, useState } from 'react';
import { api, fmtUsd } from '../lib/api';
import { useAppUser } from './UserSync';
import { Swords, Crown, Trophy, Users } from 'lucide-react';

function formatDbet(n) {
  if (!n) return '0';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toLocaleString();
}

export default function Competitions() {
  const { dbUser, refresh } = useAppUser();
  const [comps, setComps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [board, setBoard] = useState({}); // compId -> rows

  const load = async () => {
    try {
      const r = await api.get('/competitions');
      setComps(r.data.competitions);
      for (const c of r.data.competitions) {
        const lb = await api.get(`/competitions/${c.id}/leaderboard`);
        setBoard(b => ({ ...b, [c.id]: lb.data.leaderboard }));
      }
    } catch (e) { /* noop */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, []);

  const join = async (c) => {
    setBusy(c.id); setMsg('');
    try {
      await api.post('/competitions/join', { competition_id: c.id });
      setMsg(`JOINED ${c.name}`);
      await refresh();
      await load();
    } catch (e) {
      setMsg(e.response?.data?.detail || 'failed');
    } finally {
      setBusy('');
      setTimeout(() => setMsg(''), 4000);
    }
  };

  if (loading) return <div className="font-pixel text-[10px] text-[#808080]">LOADING...</div>;

  return (
    <div className="space-y-6">
      <div className="section-label">// COMPETITIONS.SYS</div>
      <h1 className="font-pixel text-white text-[22px] flex items-center gap-3">
        <Swords className="text-[#00FF29]" /> TOURNAMENTS
      </h1>
      {msg && <div className="font-pixel text-[9px] text-[#00FF29] flicker">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {comps.map(c => (
          <CompCard key={c.id} comp={c} board={board[c.id] || []}
            onJoin={() => join(c)} busy={busy === c.id}
            realBalance={dbUser?.real?.balance || 0} />
        ))}
      </div>
    </div>
  );
}

function CompCard({ comp, board, onJoin, busy, realBalance }) {
  const isReal = comp.account_type === 'real';
  const accent = isReal ? '#ff3838' : '#00FF29';
  return (
    <div className="pixel-card p-6" style={{ borderColor: isReal ? '#ff3838' : '#13b84d' }}>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="font-pixel text-[8px]" style={{ color: accent }}>// {comp.account_type.toUpperCase()} TOURNAMENT</div>
          <div className="font-pixel text-[18px] text-white mt-2">{comp.name}</div>
        </div>
        <div className="text-right">
          <div className="font-pixel text-[7px] text-[#808080]">ENTRY FEE</div>
          <div className="font-pixel text-[14px] text-white">{comp.entry_fee_sol} SOL</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] p-3">
          <div className="font-pixel text-[7px] text-[#808080]">PRIZE POOL</div>
          <div className="font-pixel text-[18px] glow-green">{fmtUsd(comp.prize_pool_usd)}</div>
          {comp.prize_pool_dbet && (
            <div className="font-pixel text-[10px] text-[#ffe93d] mt-1">+ {formatDbet(comp.prize_pool_dbet)} dBET</div>
          )}
        </div>
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] p-3">
          <div className="font-pixel text-[7px] text-[#808080]">PARTICIPANTS</div>
          <div className="font-pixel text-[20px] text-white flex items-center gap-2">
            <Users size={14} />{comp.participants_count}
          </div>
        </div>
      </div>

      <div className="mb-5">
        <div className="font-pixel text-[8px] text-[#808080] mb-2">// PRIZE STRUCTURE</div>
        <div className="space-y-1">
          {comp.prize_structure.map((p, i) => (
            <div key={i} className="flex justify-between font-mono text-[14px] gap-2">
              <span className="text-[#808080] shrink-0">#{p.rank}</span>
              <span className="text-right">
                <span className="text-white">
                  {p.amount_each ? `${fmtUsd(p.amount_each)} each` : fmtUsd(p.amount)}
                </span>
                {(p.dbet || p.dbet_each) && (
                  <span className="text-[#ffe93d] ml-2">
                    + {formatDbet(p.dbet_each || p.dbet)} dBET{p.dbet_each ? ' ea' : ''}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <div className="font-pixel text-[8px] text-[#808080] mb-2 flex items-center gap-2">
          <Trophy size={10} /> // STANDINGS
        </div>
        {board.length === 0 ? (
          <div className="font-mono text-[14px] text-[#808080] py-3 text-center bg-[#0d0d0d] border border-[#1f1f1f]">
            NO ENTRIES YET
          </div>
        ) : (
          <div className="space-y-1 max-h-[180px] overflow-y-auto">
            {board.slice(0, 8).map(r => (
              <div key={r.rank} className="grid grid-cols-12 items-center px-2 py-1 bg-[#0d0d0d] border border-[#1f1f1f]">
                <div className="col-span-1">
                  {r.rank === 1 ? <Crown className="text-[#ffe93d]" size={14}/> :
                    <span className="font-pixel text-[8px] text-[#808080]">#{r.rank}</span>}
                </div>
                <div className="col-span-7 font-pixel text-[8px] text-white truncate">@{r.x_handle || 'anon'}</div>
                <div className={`col-span-4 text-right font-pixel text-[9px] ${r.comp_pnl >= 0 ? 'text-[#00FF29]' : 'text-[#ff3838]'}`}>
                  {fmtUsd(r.comp_pnl, { sign: true })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {comp.is_joined ? (
        <button disabled className="w-full pixel-btn pixel-btn-secondary !py-3">
          ✓ ENTERED
        </button>
      ) : (
        <>
          <button onClick={onJoin} disabled={busy}
            className="w-full pixel-btn !py-3"
            style={{ background: accent, color: '#050505', boxShadow: `0 4px 0 0 ${isReal?'#7a1717':'#0a8a22'}` }}>
            {busy ? 'JOINING...' : `JOIN • ${comp.entry_fee_sol} SOL`}
          </button>
          <div className="font-pixel text-[7px] text-[#808080] text-center mt-2">
            Entry deducted from REAL balance • You have {fmtUsd(realBalance)}
          </div>
        </>
      )}
    </div>
  );
}
