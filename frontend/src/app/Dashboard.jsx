import React, { useEffect, useState } from 'react';
import { useAppUser } from './UserSync';
import { useAccount } from './AccountContext';
import { api, fmtUsd, formatPrice } from '../lib/api';
import { usePrices } from './PricesProvider';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Swords, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

export default function Dashboard() {
  const { dbUser } = useAppUser();
  const { account, setAccount } = useAccount();
  const { prices } = usePrices();
  const [openPos, setOpenPos] = useState([]);
  const [history, setHistory] = useState([]);
  const [otherOpenPos, setOtherOpenPos] = useState([]);

  const loadPositions = async () => {
    try {
      const o = await api.get(`/positions/me?account_type=${account}&status=open`);
      setOpenPos(o.data.positions);
      const h = await api.get(`/positions/me?account_type=${account}`);
      setHistory(h.data.positions.filter(p => p.status !== 'open').slice(0, 8));
      const otherAcct = account === 'real' ? 'paper' : 'real';
      const oo = await api.get(`/positions/me?account_type=${otherAcct}&status=open`);
      setOtherOpenPos(oo.data.positions);
    } catch (e) { /* noop */ }
  };

  useEffect(() => {
    loadPositions();
    const id = setInterval(loadPositions, 6000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  if (!dbUser) return <div className="font-pixel text-[#808080] text-[10px]">LOADING...</div>;
  const acct = dbUser[account] || { balance: 0, total_pnl: 0, trades_count: 0, wins: 0 };

  const winRate = acct.trades_count ? ((acct.wins / acct.trades_count) * 100).toFixed(1) : '0.0';
  const unreal = openPos.reduce((s, p) => s + (p.unrealized_pnl || 0), 0);
  const otherUnreal = otherOpenPos.reduce((s, p) => s + (p.unrealized_pnl || 0), 0);
  const isReal = account === 'real';

  // Balances + equity for BOTH accounts (top banner)
  const paperBal  = (dbUser.paper?.balance) || 0;
  const realBal   = (dbUser.real?.balance) || 0;
  const paperUnr  = isReal ? otherUnreal : unreal;
  const realUnr   = isReal ? unreal : otherUnreal;
  const paperEq   = paperBal + paperUnr;
  const realEq    = realBal + realUnr;
  const depositedSol = Number(dbUser?.total_sol_deposited || 0);
  const hasDeposited = depositedSol > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="section-label mb-3">// DASHBOARD.SYS</div>
          <h1 className="font-pixel text-white text-[22px]">
            GM, DEGEN. <span className={isReal ? 'text-[#ff3838]' : 'text-[#00FF29]'}>[{account.toUpperCase()}]</span>
          </h1>
        </div>
        <Link to="/app/competitions" className="pixel-btn pixel-btn-primary !py-2 !px-4 !text-[9px]">
          <Swords size={12} className="mr-2" /> JOIN COMPETITION
        </Link>
      </div>

      {/* ─── BALANCE HERO ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BalancePanel
          testId="balance-panel-paper"
          accountKey="paper"
          active={account === 'paper'}
          onClick={() => setAccount('paper')}
          accent="#00FF29"
          shadow="#0a8a22"
          label="PAPER BALANCE"
          balance={paperBal}
          unreal={paperUnr}
          equity={paperEq}
          subline="Practice with virtual funds"
          cta={null}
        />
        <BalancePanel
          testId="balance-panel-real"
          accountKey="real"
          active={account === 'real'}
          onClick={() => setAccount('real')}
          accent="#ff3838"
          shadow="#7a1717"
          label="REAL BALANCE"
          balance={realBal}
          unreal={realUnr}
          equity={realEq}
          subline={hasDeposited
            ? `+${depositedSol.toFixed(4)} SOL deposited \u2022 powered by Helius`
            : 'No SOL deposited yet'}
          cta={realBal < 1 && !hasDeposited
            ? { to: '/app/wallet', text: 'DEPOSIT SOL \u2192' }
            : { to: '/app/wallet', text: 'WALLET \u2192' }}
        />
      </div>

      {isReal && (acct.balance || 0) < 1 && hasDeposited && (
        <div className="pixel-card p-4 border-[#ffe93d]" style={{ borderColor: '#ffe93d' }}>
          <div className="font-pixel text-[9px] text-[#ffe93d]">! REAL BALANCE LOW</div>
          <div className="font-mono text-[16px] text-[#808080] mt-1">
            Your deposit was credited but balance is low. Top up to keep trading.
            <Link to="/app/wallet" className="text-[#00FF29] hover:underline ml-1">WALLET \u2192</Link>
          </div>
        </div>
      )}
      {isReal && (acct.balance || 0) < 1 && !hasDeposited && (
        <div className="pixel-card p-4 border-[#ffe93d]" style={{ borderColor: '#ffe93d' }}>
          <div className="font-pixel text-[9px] text-[#ffe93d]">! REAL ACCOUNT EMPTY</div>
          <div className="font-mono text-[16px] text-[#808080] mt-1">
            Send SOL to your deposit address and it will be credited automatically.
            <Link to="/app/wallet" className="text-[#00FF29] hover:underline ml-1">GO TO WALLET \u2192</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={`${account.toUpperCase()} BALANCE`} value={fmtUsd(acct.balance || 0)} color="#F5F5F5" />
        <StatCard label="UNREALIZED PNL" value={fmtUsd(unreal, { sign: true })} color={unreal >= 0 ? '#00FF29' : '#ff3838'} />
        <StatCard label="REALIZED PNL" value={fmtUsd(acct.total_pnl || 0, { sign: true })} color={(acct.total_pnl || 0) >= 0 ? '#00FF29' : '#ff3838'} />
        <StatCard label="WIN RATE" value={`${winRate}%`} sub={`${acct.wins || 0}/${acct.trades_count || 0}`} color="#F5F5F5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                      <td className={p.side === 'long' ? 'text-[#00FF29]' : 'text-[#ff3838]'}>{p.side.toUpperCase()} {p.leverage}x</td>
                      <td className="text-right text-[#808080]">{fmtUsd(p.size)}</td>
                      <td className="text-right text-[#808080]">{formatPrice(p.entry_price)}</td>
                      <td className="text-right text-white">{formatPrice(p.mark_price)}</td>
                      <td className={`text-right ${(p.unrealized_pnl || 0) >= 0 ? 'text-[#00FF29]' : 'text-[#ff3838]'}`}>{fmtUsd(p.unrealized_pnl || 0, { sign: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
                  {p.change_24h >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {p.change_24h.toFixed(2)}%
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="pixel-card p-5">
        <div className="font-pixel text-[10px] text-[#00FF29] mb-4">// RECENT HISTORY [{account.toUpperCase()}]</div>
        {history.length === 0 ? (
          <div className="font-mono text-[#808080] text-[16px] py-6 text-center">NO TRADES YET</div>
        ) : (
          <table className="w-full font-mono text-[15px]">
            <thead>
              <tr className="font-pixel text-[7px] text-[#808080] border-b border-[#1f1f1f]">
                <th className="text-left py-2">PAIR</th>
                <th className="text-left">SIDE</th>
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

function BalancePanel({
  testId, label, balance, unreal, equity, accent, shadow, active, onClick, subline, cta,
}) {
  const unrealUp = unreal >= 0;
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className="text-left pixel-card p-5 transition-transform hover:-translate-y-0.5 relative"
      style={{
        borderColor: active ? accent : '#1f1f1f',
        boxShadow: active ? `0 6px 0 0 ${shadow}` : 'none',
        background: active ? '#0a0a0a' : '#070707',
      }}
    >
      {active && (
        <span
          className="absolute top-2 right-2 font-pixel text-[7px] px-2 py-1"
          style={{ background: accent, color: '#050505' }}
        >ACTIVE</span>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Wallet size={14} style={{ color: accent }} />
        <span className="font-pixel text-[8px] tracking-[0.18em]" style={{ color: accent }}>
          // {label}
        </span>
      </div>

      <div className="font-pixel text-[34px] sm:text-[42px] text-white leading-none mb-2"
           style={{ textShadow: active ? `0 0 14px ${accent}55` : 'none' }}>
        {fmtUsd(balance)}
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-3">
        <span className={`font-pixel text-[9px] flex items-center gap-1 ${unrealUp ? 'text-[#00FF29]' : 'text-[#ff3838]'}`}>
          {unrealUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {fmtUsd(unreal, { sign: true })}
          <span className="text-[#808080] ml-1">unreal</span>
        </span>
        <span className="font-pixel text-[9px] text-[#808080]">
          EQUITY <span className="text-white">{fmtUsd(equity)}</span>
        </span>
      </div>

      <div className="font-mono text-[13px] text-[#808080] mb-1">{subline}</div>

      {cta && (
        <span
          className="font-pixel text-[8px] mt-2 inline-flex items-center gap-1 hover:underline"
          style={{ color: accent }}
          onClick={(e) => { e.stopPropagation(); window.location.href = cta.to; }}
        >
          {cta.text}
        </span>
      )}
    </button>
  );
}
