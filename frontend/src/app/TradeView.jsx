import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppUser } from './UserSync';
import { useAccount } from './AccountContext';
import { usePrices } from './PricesProvider';
import { api, PAIRS, fmtBalance, formatPrice } from '../lib/api';
import { ArrowUpRight, ArrowDownRight, Share2 } from 'lucide-react';
import PnlShareModal from '../components/PnlShareModal';

export default function TradeView() {
  const { dbUser, refresh } = useAppUser();
  const { account, displayCurrency, setDisplayCurrency } = useAccount();
  const { prices } = usePrices();
  const solPrice = prices['SOL/USD']?.price || 150;
  const fmt = (n, opts) => fmtBalance(n, displayCurrency, solPrice, opts);
  const [params, setParams] = useSearchParams();
  const [pair, setPair] = useState(params.get('pair') || 'ANSEM/USD');
  const [side, setSide] = useState('long');
  const [margin, setMargin] = useState(100);
  const [leverage, setLeverage] = useState(10);
  const [openPos, setOpenPos] = useState([]);
  const [hist, setHist] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [sharePos, setSharePos] = useState(null); // closed position to share

  const shareUrl = (typeof window !== 'undefined' ? window.location.origin : 'https://degens.bet') + '/app';

  const acct = dbUser?.[account] || { balance: 0 };
  const px = prices[pair];

  // pair fallback - if URL pair isn't in price feed, use first available
  useEffect(() => {
    if (!Object.keys(prices).length) return;
    if (!prices[pair]) {
      const fallback = PAIRS.find(p => prices[p]) || PAIRS[0];
      if (fallback !== pair) {
        setPair(fallback);
        setParams({ pair: fallback });
      }
    }
  }, [prices, pair, setParams]);

  // Fetch REAL historical candles from GeckoTerminal (via backend) on pair change.
  // Append live tick prices on top so the chart keeps growing every poll.
  useEffect(() => {
    let alive = true;
    setHistory([]);
    const fetchCandles = async () => {
      try {
        const r = await api.get(`/markets/candles/${encodeURIComponent(pair)}?limit=60`);
        if (!alive) return;
        const candles = (r.data?.candles || []).map(c => ({ t: c.t * 1000, p: c.c }));
        setHistory(candles);
      } catch (e) { /* noop */ }
    };
    fetchCandles();
  }, [pair]);

  useEffect(() => {
    if (!px) return;
    setHistory(h => {
      const lastTime = h.length ? h[h.length-1].t : 0;
      const t = Date.parse(px.updated_at);
      if (t === lastTime) return h;
      return [...h, { t, p: px.price }].slice(-180);
    });
  }, [px?.updated_at, pair]);

  const loadPositions = async () => {
    try {
      const o = await api.get(`/positions/me?account_type=${account}&status=open`);
      setOpenPos(o.data.positions);
      const h = await api.get(`/positions/me?account_type=${account}`);
      setHist(h.data.positions.filter(p => p.status !== 'open').slice(0, 10));
    } catch (e) { /* noop */ }
  };
  useEffect(() => {
    loadPositions();
    const id = setInterval(loadPositions, 5000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const openTrade = async () => {
    setErr(''); setBusy(true);
    try {
      await api.post('/positions/open', {
        pair, side,
        margin: Number(marginAsUsd),
        leverage: Number(leverage),
        account_type: account,
      });
      await refresh();
      await loadPositions();
    } catch (e) {
      setErr(e.response?.data?.detail || 'failed');
    } finally { setBusy(false); }
  };

  const closeTrade = async (id) => {
    setBusy(true);
    try {
      const r = await api.post('/positions/close', { position_id: id });
      await refresh();
      await loadPositions();
      // Auto-open share card for the closed position
      if (r?.data) setSharePos(r.data);
    } catch (e) {
      setErr(e.response?.data?.detail || 'failed');
    } finally { setBusy(false); }
  };

  const switchPair = (p) => { setPair(p); setParams({ pair: p }); };

  // Live PnL for any open position — recomputed every tick using current mark price.
  const livePnl = (p) => {
    const cur = prices[p.pair];
    if (!cur || !p.entry_price) return p.unrealized_pnl || 0;
    const dir = p.side === 'long' ? 1 : -1;
    const pct = ((cur.price - p.entry_price) / p.entry_price) * dir * p.leverage;
    return p.margin * pct;
  };
  const liveMark = (p) => prices[p.pair]?.price || p.mark_price;

  // Convert user-entered margin (in their chosen display currency) to USD for the request body.
  const marginAsUsd = displayCurrency === 'SOL' ? (Number(margin) || 0) * solPrice : (Number(margin) || 0);
  const sizeUsd = marginAsUsd * Number(leverage);
  const liqPrice = px ? (side === 'long'
    ? px.price * (1 - 1 / leverage)
    : px.price * (1 + 1 / leverage)) : 0;
  const quantity = px && px.price > 0 ? sizeUsd / px.price : 0;
  const availDisplay = displayCurrency === 'SOL'
    ? (acct.balance || 0) / solPrice
    : (acct.balance || 0);
  const marginUnit = displayCurrency === 'SOL' ? 'SOL' : 'USDC';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="section-label">// TERMINAL.EXE</div>
        <div className="flex items-center gap-3">
          <div className="flex border-2 border-[#1f1f1f] bg-[#0d0d0d]">
            {['USD', 'SOL'].map(c => {
              const active = displayCurrency === c;
              return (
                <button
                  key={c}
                  data-testid={`tv-currency-${c.toLowerCase()}`}
                  onClick={() => setDisplayCurrency(c)}
                  className={`px-3 py-1.5 font-pixel text-[8px] ${active ? 'bg-[#00FF29] text-[#050505]' : 'text-[#808080] hover:text-white'}`}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <div className={`font-pixel text-[9px] px-3 py-2 border-2 ${account==='real' ? 'border-[#ff3838] text-[#ff3838]' : 'border-[#00FF29] text-[#00FF29]'}`}>
            TRADING [{account.toUpperCase()}] \u00b7 BAL {fmt(acct.balance || 0)}
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {PAIRS.map(p => {
          const pr = prices[p];
          const active = p === pair;
          return (
            <button key={p} onClick={() => switchPair(p)}
              className={`px-3 py-2 border-2 ${active ? 'border-[#00FF29] bg-[#0d0d0d]' : 'border-[#1f1f1f] hover:border-[#808080]'} min-w-[140px]`}>
              <div className={`font-pixel text-[9px] ${active ? 'text-[#00FF29]' : 'text-white'}`}>{p}</div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="font-mono text-[14px] text-white">{pr ? formatPrice(pr.price) : '-'}</span>
                <span className={`font-pixel text-[8px] ${pr?.change_24h >= 0 ? 'text-[#00FF29]' : 'text-[#ff3838]'}`}>
                  {pr ? `${pr.change_24h >= 0 ? '+' : ''}${pr.change_24h.toFixed(2)}%` : ''}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 pixel-card p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="font-pixel text-[14px] text-white">{pair}</div>
              {px && (<>
                <div className="font-mono text-[20px] text-[#00FF29]">${formatPrice(px.price)}</div>
                <div className={`font-pixel text-[10px] flex items-center ${px.change_24h >= 0 ? 'text-[#00FF29]' : 'text-[#ff3838]'}`}>
                  {px.change_24h >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                  {px.change_24h.toFixed(2)}%
                </div>
              </>)}
            </div>
            <div className="font-pixel text-[8px] text-[#808080]">LIVE · COINGECKO</div>
          </div>
          <PriceChart data={history} />
        </div>

        <div className="lg:col-span-4 pixel-card p-4">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => setSide('long')}
              className={`pixel-btn !py-3 !text-[10px] ${side === 'long' ? 'pixel-btn-primary' : 'pixel-btn-secondary'}`}>
              LONG
            </button>
            <button onClick={() => setSide('short')}
              className={`pixel-btn !py-3 !text-[10px] ${side === 'short' ? '' : 'pixel-btn-secondary'}`}
              style={side === 'short' ? { background: '#ff3838', color: '#050505', boxShadow: '0 4px 0 0 #7a1717' } : {}}>
              SHORT
            </button>
          </div>

          <Label text={`MARGIN (${marginUnit})`} />
          <div className="flex gap-2 mb-3">
            <input type="number" value={margin} onChange={e => setMargin(e.target.value)}
              step={displayCurrency === 'SOL' ? '0.01' : '1'}
              className="flex-1 bg-[#0d0d0d] border-2 border-[#1f1f1f] focus:border-[#00FF29] outline-none px-3 py-2 font-mono text-[16px] text-white" />
            <div className="flex gap-1">
              {[25, 50, 100].map(pct => (
                <button key={pct} onClick={() => {
                  const target = (availDisplay * pct) / 100;
                  setMargin(displayCurrency === 'SOL' ? Number(target.toFixed(4)) : Math.floor(target));
                }}
                  className="px-2 py-2 bg-[#0d0d0d] border border-[#1f1f1f] hover:border-[#00FF29] font-pixel text-[8px] text-[#808080]">{pct}%</button>
              ))}
            </div>
          </div>

          <Label text={`LEVERAGE: ${leverage}x`} />
          <input type="range" min={1} max={1000} value={leverage} onChange={e => setLeverage(Number(e.target.value))}
            className="w-full accent-[#00FF29] mb-1" />
          <div className="flex gap-1 mb-4">
            {[1, 10, 25, 50, 100, 250, 500, 1000].map(v => (
              <button key={v} onClick={() => setLeverage(v)}
                className={`flex-1 py-1 font-pixel text-[8px] border ${leverage === v ? 'bg-[#00FF29] text-[#050505] border-[#00FF29]' : 'bg-[#0d0d0d] text-[#808080] border-[#1f1f1f]'}`}>
                {v}x
              </button>
            ))}
          </div>

          <div className="bg-[#0d0d0d] border border-[#1f1f1f] p-3 mb-4 space-y-1">
            <Row label="POSITION SIZE" value={fmt(sizeUsd)} />
            <Row label="QUANTITY" value={`${quantity.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${pair.split('/')[0]}`} />
            <Row label="ENTRY (EST)" value={px ? `$${formatPrice(px.price)}` : '-'} />
            <Row label="LIQ PRICE" value={px ? `$${formatPrice(liqPrice)} (${(100 / leverage).toFixed(2)}%)` : '\u2014'} color={'#ff3838'} />
            <Row label={`${account.toUpperCase()} AVAIL`} value={fmt(acct.balance || 0)} color={account==='real'?'#ff3838':'#00FF29'} />
          </div>

          {err && <div className="font-pixel text-[9px] text-[#ff3838] mb-2">! {err.toUpperCase()}</div>}

          <button onClick={openTrade} disabled={busy || !px}
            className="w-full pixel-btn !py-4"
            style={side === 'long'
              ? { background: '#00FF29', color: '#050505', boxShadow: '0 4px 0 0 #0a8a22' }
              : { background: '#ff3838', color: '#050505', boxShadow: '0 4px 0 0 #7a1717' }}>
            {busy ? 'EXECUTING...' : `${side === 'long' ? 'BUY / LONG' : 'SELL / SHORT'}`}
          </button>
        </div>
      </div>

      <div className="pixel-card p-4">
        <div className="font-pixel text-[10px] text-[#00FF29] mb-3">// OPEN POSITIONS [{openPos.length}]</div>
        {openPos.length === 0 ? (
          <div className="font-mono text-[#808080] text-center py-6 text-[16px]">NO OPEN POSITIONS</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[15px]">
              <thead>
                <tr className="font-pixel text-[7px] text-[#808080] border-b border-[#1f1f1f]">
                  <th className="text-left py-2">PAIR</th>
                  <th className="text-left">SIDE</th>
                  <th className="text-right">MARGIN</th>
                  <th className="text-right">SIZE</th>
                  <th className="text-right">ENTRY</th>
                  <th className="text-right">MARK</th>
                  <th className="text-right">LIQ</th>
                  <th className="text-right">PNL</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {openPos.map(p => {
                  const pnl = livePnl(p);
                  const mark = liveMark(p);
                  const liq = p.liq_price ?? (p.side === 'long'
                    ? p.entry_price * (1 - 1 / p.leverage)
                    : p.entry_price * (1 + 1 / p.leverage));
                  const pnlPctLive = p.margin ? (pnl / p.margin) * 100 : 0;
                  return (
                    <tr key={p.id} className="border-b border-[#1f1f1f]/50">
                      <td className="py-3 text-white">{p.pair}</td>
                      <td className={p.side === 'long' ? 'text-[#00FF29]' : 'text-[#ff3838]'}>{p.side.toUpperCase()} {p.leverage}x</td>
                      <td className="text-right text-[#808080]">{fmt(p.margin)}</td>
                      <td className="text-right text-[#808080]">{fmt(p.size)}</td>
                      <td className="text-right text-[#808080]">{formatPrice(p.entry_price)}</td>
                      <td className="text-right text-white">{formatPrice(mark)}</td>
                      <td className="text-right text-[#ff3838]/80">{formatPrice(liq)}</td>
                      <td className={`text-right ${pnl >= 0 ? 'text-[#00FF29]' : 'text-[#ff3838]'}`}>
                        {fmt(pnl, { sign: true })}
                        <span className="font-pixel text-[7px] ml-1 opacity-70">({pnlPctLive >= 0 ? '+' : ''}{pnlPctLive.toFixed(0)}%)</span>
                      </td>
                      <td className="text-right">
                        <button onClick={() => closeTrade(p.id)} disabled={busy}
                          className="px-3 py-1 font-pixel text-[8px] bg-[#0d0d0d] border border-[#ff3838] text-[#ff3838] hover:bg-[#ff3838] hover:text-[#050505]">
                          CLOSE
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recently closed positions — share PnL card */}
      {hist.length > 0 && (
        <div className="pixel-card p-4">
          <div className="font-pixel text-[10px] text-[#808080] mb-3">// RECENTLY CLOSED [{hist.length}]</div>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[14px]">
              <thead>
                <tr className="font-pixel text-[7px] text-[#808080] border-b border-[#1f1f1f]">
                  <th className="text-left py-2">PAIR</th>
                  <th className="text-left">SIDE</th>
                  <th className="text-right">ENTRY \u2192 EXIT</th>
                  <th className="text-right">PNL</th>
                  <th className="text-right">STATUS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {hist.map(p => {
                  const pnlPct = p.margin ? (p.pnl / p.margin) * 100 : 0;
                  return (
                    <tr key={p.id} className="border-b border-[#1f1f1f]/50">
                      <td className="py-3 text-white">{p.pair}</td>
                      <td className={p.side === 'long' ? 'text-[#00FF29]' : 'text-[#ff3838]'}>{p.side.toUpperCase()} {p.leverage}x</td>
                      <td className="text-right text-[#808080]">{formatPrice(p.entry_price)} \u2192 {formatPrice(p.exit_price)}</td>
                      <td className={`text-right ${(p.pnl || 0) >= 0 ? 'text-[#00FF29]' : 'text-[#ff3838]'}`}>
                        {fmt(p.pnl || 0, { sign: true })}
                        <span className="font-pixel text-[7px] ml-1 opacity-70">
                          ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(0)}%)
                        </span>
                      </td>
                      <td className="text-right">
                        <span className={`font-pixel text-[7px] ${p.status === 'liquidated' ? 'text-[#ff3838]' : 'text-[#808080]'}`}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          data-testid={`share-pnl-${p.id}`}
                          onClick={() => setSharePos(p)}
                          className="px-3 py-1 font-pixel text-[8px] bg-[#0d0d0d] border border-[#00FF29] text-[#00FF29] hover:bg-[#00FF29] hover:text-[#050505] flex items-center gap-1 ml-auto"
                        >
                          <Share2 size={10} /> SHARE
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PnlShareModal
        open={!!sharePos}
        onClose={() => setSharePos(null)}
        position={sharePos}
        handle={dbUser?.x_handle}
        shareUrl={shareUrl}
      />
    </div>
  );
}

function Label({ text }) {
  return <div className="font-pixel text-[8px] text-[#808080] mb-2 tracking-[0.15em]">{text}</div>;
}
function Row({ label, value, color = '#F5F5F5' }) {
  return (
    <div className="flex justify-between">
      <span className="font-pixel text-[8px] text-[#808080]">{label}</span>
      <span className="font-mono text-[14px]" style={{ color }}>{value}</span>
    </div>
  );
}

function PriceChart({ data }) {
  const W = 800, H = 260;
  if (!data || data.length < 2) {
    return <div className="h-[260px] flex items-center justify-center font-pixel text-[9px] text-[#808080]">COLLECTING TICKS...</div>;
  }
  const min = Math.min(...data.map(d => d.p));
  const max = Math.max(...data.map(d => d.p));
  const range = (max - min) || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.p - min) / range) * (H - 20) - 10;
    return `${x},${y}`;
  }).join(' ');
  const last = data[data.length-1].p;
  const first = data[0].p;
  const up = last >= first;
  const color = up ? '#00FF29' : '#ff3838';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      {Array.from({length:5}).map((_,i)=>(
        <line key={i} x1="0" x2={W} y1={(i+1)*H/6} y2={(i+1)*H/6} stroke="#1f1f1f" strokeDasharray="2 4" />
      ))}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" />
      <polyline points={`0,${H} ${pts} ${W},${H}`} fill={color} opacity="0.12" stroke="none" />
    </svg>
  );
}
