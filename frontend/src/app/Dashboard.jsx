import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppUser } from './UserSync';
import { usePrices } from './PricesProvider';
import { api, fmtUsd, formatPrice } from '../lib/api';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity } from 'lucide-react';

export default function Dashboard() {
  const { dbUser } = useAppUser();
  const { prices } = usePrices();
  const [openPos, setOpenPos] = useState([]);
  const [history, setHistory] = useState([]);

  const loadPositions = async () => {
    try {
      const o = await api.get('/positions/me?status=open');
      setOpenPos(o.data.positions);
      const h = await api.get('/positions/me');
      setHistory(h.data.positions.filter(p => p.status !== 'open').slice(0, 8));
    } catch (e) { /* noop */ }
  };

  useEffect(() => {
    loadPositions();
    const id = setInterval(loadPositions, 6000);
    return () => clearInterval(id);
  }, []);

  if (!dbUser) return <div className="font-pixel text-[#808080] text-[10px]">LOADING...</div>;

  const winRate = dbUser.trades_count ? ((dbUser.wins / dbUser.trades_count) * 100).toFixed(1) : '0.0';
  const unreal = openPos.reduce((s, p) => s + (p.unrealized_pnl || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="section-label mb-3">// DASHBOARD.SYS</div>
        <h1 className="font-pixel text-white text-[22px]">GM, DEGEN.</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="BALANCE" value={fmtUsd(dbUser.balance)} color="#F5F5F5" />
        <StatCard label="UNREALIZED PNL" value={fmtUsd(unreal, { sign: true })} color={unreal >= 0 ? '#00FF29' : '#ff3838'} />
        <StatCard label="REALIZED PNL" value={fmtUsd(dbUser.total_pnl, { sign: true })} color={dbUser.total_pnl >= 0 ? '#00FF29' : '#ff3838'} />
        <StatCard label="WIN RATE" value={`${winRate}%`} sub={`${dbUser.wins}/${dbUser.trades_count} trades`} color="#F5F5F5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Open positions */}
        <div className="lg:col-span-2 pixel-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-pixel text-[10px] text-[#00FF29]">// OPEN POSITIONS [{openPos.length}]</div>
            <Link to="/app/trade" className="font-pixel text-[8px] text-[#808080] hover:text-[#00FF29]">OPEN TRADE +</Link>
          </div>
          {openPos.length === 0 ? (
            <div className="text-center py-10 font-mono text-[#808080] text-[18px]">
              NO OPEN POSITIONS<br/>
              <Link to="/app/trade" className="text-[#00FF29] hover:underline">[ START TRADING ]</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-[15px]">
                <thead>
                  <tr className="font-pixel text-[7px] text-[#808080] border-b border-[#1f1f1f]">
                    <th className="text-left py-2">PAIR</th>
                    <th className="text-left">SIDE</th>
                    <th className="text-right">SIZE</th>
                    <th className="text-right">ENTRY</th>
                    <th className="text-right">MARK</th>
                    <th className="text-right">PNL</th>
                  </tr>
                </thead>
                <tbody>
                  {openPos.map(p => (
                    <tr key={p.id} className="border-b border-[#1f1f1f]/50">
                      <td className="py-3 text-white">{p.pair}</td>
                      <td className={p.side === 'long' ? 'text-[#00FF29]' : 'text-[#ff3838]'}>
                        {p.side.toUpperCase()} {p.leverage}x
                      </td>
                      <td className="text-right text-[#808080]">{fmtUsd(p.size)}</td>
                      <td className="text-right text-[#808080]">{formatPrice(p.entry_price)}</td>
                      <td className="text-right text-white">{formatPrice(p.mark_price)}</td>
                      <td className={`text-right ${(p.unrealized_pnl||0) >= 0 ? 'text-[#00FF29]' : 'text-[#ff3838]'}`}>
                        {fmtUsd(p.unrealized_pnl || 0, { sign: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Markets */}
        <div className="pixel-card p-5">
          <div className="font-pixel text-[10px] text-[#00FF29] mb-4">// MARKETS</div>
          <div className="space-y-2">
            {Object.values(prices).map(p => (
              <Link key={p.pair} to={`/app/trade?pair=${encodeURIComponent(p.pair)}`}
                className="flex items-center justify-between py-2 px-2 hover:bg-[#0d0d0d] border border-transparent hover:border-[#1f1f1f]">
                <div>
                  <div className="font-pixel text-[9px] text-white">{p.pair}</div>
                  <div className="font-mono text-[14px] text-[#808080]">{formatPrice(p.price)}</div>
                </div>
                <div className={`font-pixel text-[9px] flex items-center ${p.change_24h >= 0 ? 'text-[#00FF29]' : 'text-[#ff3838]'}`}>
                  {p.change_24h >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                  {p.change_24h.toFixed(2)}%
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="pixel-card p-5">
        <div className="font-pixel text-[10px] text-[#00FF29] mb-4">// RECENT HISTORY</div>
        {history.length === 0 ? (
          <div className="font-mono text-[#808080] text-[16px] py-6 text-center">NO TRADES YET</div>
        ) : (
          <table className="w-full font-mono text-[15px]">
            <thead>
              <tr className="font-pixel text-[7px] text-[#808080] border-b border-[#1f1f1f]">
                <th className="text-left py-2">PAIR</th>
                <th className="text-left">SIDE</th>
                <th className="text-right">SIZE</th>
                <th className="text-right">ENTRY</th>
                <th className="text-right">EXIT</th>
                <th className="text-right">PNL</th>
                <th className="text-right">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {history.map(p => (
                <tr key={p.id} className="border-b border-[#1f1f1f]/50">
                  <td className="py-3 text-white">{p.pair}</td>
                  <td className={p.side === 'long' ? 'text-[#00FF29]' : 'text-[#ff3838]'}>{p.side.toUpperCase()} {p.leverage}x</td>
                  <td className="text-right text-[#808080]">{fmtUsd(p.size)}</td>
                  <td className="text-right text-[#808080]">{formatPrice(p.entry_price)}</td>
                  <td className="text-right text-[#808080]">{formatPrice(p.exit_price)}</td>
                  <td className={`text-right ${p.pnl >= 0 ? 'text-[#00FF29]' : 'text-[#ff3838]'}`}>{fmtUsd(p.pnl, { sign: true })}</td>
                  <td className="text-right">
                    <span className={`font-pixel text-[7px] px-2 py-1 ${p.status === 'liquidated' ? 'bg-[#ff3838] text-[#050505]' : 'bg-[#0d0d0d] text-[#00FF29] border border-[#1f1f1f]'}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="pixel-card p-4">
      <div className="font-pixel text-[7px] text-[#808080] tracking-[0.15em] mb-2">{label}</div>
      <div className="font-pixel text-[18px]" style={{ color }}>{value}</div>
      {sub && <div className="font-mono text-[13px] text-[#808080] mt-1">{sub}</div>}
    </div>
  );
}
