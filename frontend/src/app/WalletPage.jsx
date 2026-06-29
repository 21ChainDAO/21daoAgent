import React, { useEffect, useState, useCallback } from 'react';
import { useAppUser } from './UserSync';
import { Copy, Check, AlertTriangle, RefreshCw, ExternalLink, ArrowDownToLine, ArrowUpFromLine, Gift, X, Info, ShieldCheck, Clock } from 'lucide-react';
import { api, fmtUsd } from '../lib/api';

export default function WalletPage() {
  const { dbUser, refresh } = useAppUser();
  const [copied, setCopied] = useState(false);
  const [onchain, setOnchain] = useState({ sol: 0, usdc: 0 });
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const [loadingBal, setLoadingBal] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [wdAddr, setWdAddr] = useState('');
  const [wdAmount, setWdAmount] = useState('');
  const [wdBusy, setWdBusy] = useState(false);
  const [wdMsg, setWdMsg] = useState('');
  const [bonus, setBonus] = useState(null);
  const [bonusBusy, setBonusBusy] = useState(false);

  const addr = dbUser?.custodial_address;

  const loadOnchain = useCallback(async () => {
    if (!addr) return;
    setLoadingBal(true);
    try {
      const r = await api.get(`/wallet/balance/${addr}`);
      setOnchain({ sol: r.data.sol || 0, usdc: r.data.usdc || 0 });
    } catch (e) { /* noop */ }
    finally { setLoadingBal(false); }
  }, [addr]);

  const loadWithdrawals = async () => {
    try {
      const r = await api.get('/wallet/withdrawals/me');
      setWithdrawals(r.data.withdrawals || []);
    } catch (e) { /* noop */ }
  };

  const loadBonus = async () => {
    try {
      const r = await api.get('/wallet/bonus_status');
      setBonus(r.data);
    } catch (e) { /* noop */ }
  };

  useEffect(() => {
    loadOnchain();
    loadWithdrawals();
    loadBonus();
    const id = setInterval(() => { loadOnchain(); loadBonus(); }, 12000);
    return () => clearInterval(id);
  }, [loadOnchain]);

  const copy = async () => {
    if (!addr) return;
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const sweepNow = async () => {
    setScanning(true); setScanMsg('');
    try {
      const r = await api.post('/wallet/sweep', {});
      const sol = r.data.swept_sol || 0;
      setScanMsg(sol > 0 ? `\u2713 SWEPT ${sol.toFixed(4)} SOL` : 'NO DEPOSITS TO SWEEP');
      await refresh(); await loadOnchain(); await loadBonus();
    } catch (e) {
      setScanMsg(e.response?.data?.detail || 'SWEEP FAILED');
    } finally {
      setScanning(false);
      setTimeout(() => setScanMsg(''), 4000);
    }
  };

  const toggleBonus = async () => {
    setBonusBusy(true);
    try {
      await api.post('/wallet/bonus_optin', {});
      await loadBonus();
    } catch (e) {
      setWdMsg(e.response?.data?.detail || 'failed');
      setTimeout(() => setWdMsg(''), 4000);
    } finally { setBonusBusy(false); }
  };

  const requestWithdrawal = async () => {
    setWdMsg(''); setWdBusy(true);
    try {
      const r = await api.post('/wallet/withdraw_request', { to_address: wdAddr, amount_sol: Number(wdAmount) });
      const auto = r.data.auto_sol || 0;
      const manual = r.data.manual_sol || 0;
      const parts = [];
      if (auto > 0) parts.push(`AUTO-SENT ${auto.toFixed(4)} SOL`);
      if (manual > 0) parts.push(`${manual.toFixed(4)} SOL UNDER REVIEW (1-3H)`);
      setWdMsg('\u2713 ' + parts.join(' \u00b7 '));
      setWdAddr(''); setWdAmount('');
      await refresh(); await loadWithdrawals();
    } catch (e) {
      setWdMsg(e.response?.data?.detail || 'REQUEST FAILED');
    } finally {
      setWdBusy(false);
      setTimeout(() => setWdMsg(''), 9000);
    }
  };

  const cancelWithdrawal = async (wid) => {
    try {
      const r = await api.post(`/wallet/withdraw/cancel/${wid}`, {});
      setWdMsg(`\u2713 CANCELLED \u00b7 ${fmtUsd(r.data?.refunded_usd || 0)} REFUNDED`);
      await refresh(); await loadWithdrawals();
    } catch (e) {
      setWdMsg(e.response?.data?.detail || 'CANCEL FAILED');
    }
    setTimeout(() => setWdMsg(''), 6000);
  };

  // Preview math
  const requestedSol = Number(wdAmount) || 0;
  const depositedSol = Number(dbUser?.total_sol_deposited || 0);
  const autoWithdrawnSol = Number(dbUser?.total_sol_withdrawn_auto || 0);
  const allowance = Math.max(0, depositedSol - autoWithdrawnSol);
  const previewAuto = Math.min(requestedSol, allowance);
  const previewManual = Math.max(0, requestedSol - previewAuto);

  const rolloverActive = bonus && bonus.rollover_required_usd > 0 && bonus.rollover_progress_usd < bonus.rollover_required_usd;
  const canShowOptIn = bonus && !bonus.first_deposit_complete;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="section-label">// WALLET.SYS</div>
      <h1 className="font-pixel text-white text-[22px]">WALLET</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="PAPER BALANCE" value={fmtUsd(dbUser?.paper?.balance || 0)} color="#00FF29" />
        <Stat label="REAL BALANCE" value={fmtUsd(dbUser?.real?.balance || 0)} color="#ff3838" />
        <Stat label="DEPOSIT ALLOWANCE" value={`${allowance.toFixed(4)} SOL`} color="#F5F5F5" sub="INSTANT WITHDRAW" />
        <Stat label="ON-CHAIN SOL" value={onchain.sol.toFixed(4)} color="#F5F5F5" sub={loadingBal?'\u2026':'HELIUS LIVE'} />
      </div>

      {/* BONUS BANNER */}
      {canShowOptIn && (
        <div className="pixel-card p-5" style={{ borderColor: bonus?.opted_in ? '#00FF29' : '#ffe93d' }}>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-12 h-12 flex items-center justify-center bg-[#0d0d0d] border-2"
                 style={{ borderColor: bonus?.opted_in ? '#00FF29' : '#ffe93d' }}>
              <Gift size={20} style={{ color: bonus?.opted_in ? '#00FF29' : '#ffe93d' }} />
            </div>
            <div className="flex-1 min-w-[260px]">
              <div className="font-pixel text-[11px]" style={{ color: bonus?.opted_in ? '#00FF29' : '#ffe93d' }}>
                +50% FIRST DEPOSIT BONUS
              </div>
              <p className="font-mono text-[16px] text-[#808080] mt-2">
                Toggle this <strong className="text-white">before your first deposit</strong> and we&apos;ll credit a <strong className="text-white">+50% bonus</strong> on top of your deposit amount.
                <br/><br/>
                <strong className="text-[#ffe93d]">Catch:</strong> while the bonus is active, <strong className="text-white">ALL withdrawals are locked</strong> (including your original deposit) until you trade <strong className="text-white">35\u00d7 the total credited amount</strong> in REAL-account volume.
                <br/><br/>
                <strong className="text-[#00FF29]">Skip the bonus</strong> = your deposit amount is withdrawable <strong className="text-white">instantly</strong>. Profits above that still need 1\u20133h review.
              </p>
              <button onClick={toggleBonus} disabled={bonusBusy}
                className={`mt-4 pixel-btn !text-[9px] !py-2 ${bonus?.opted_in ? 'pixel-btn-primary' : 'pixel-btn-secondary'}`}>
                {bonus?.opted_in ? '\u2713 BONUS OPTED IN \u2022 CLICK TO REMOVE' : 'OPT IN TO 50% BONUS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROLLOVER PROGRESS (if bonus active) */}
      {bonus?.active && bonus?.rollover_required_usd > 0 && (
        <div className="pixel-card p-5" style={{ borderColor: rolloverActive ? '#ffe93d' : '#00FF29' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-pixel text-[10px]" style={{ color: rolloverActive ? '#ffe93d' : '#00FF29' }}>
              {rolloverActive ? '// ROLLOVER IN PROGRESS' : '// ROLLOVER COMPLETE \u2713'}
            </div>
            <div className="font-pixel text-[10px] text-white">
              {bonus.rollover_pct.toFixed(1)}%
            </div>
          </div>
          <div className="h-3 bg-[#0d0d0d] border border-[#1f1f1f] overflow-hidden">
            <div style={{ width: `${Math.min(100, bonus.rollover_pct)}%`,
                          background: rolloverActive ? '#ffe93d' : '#00FF29' }} className="h-full" />
          </div>
          <div className="flex justify-between mt-2 font-mono text-[14px] text-[#808080]">
            <span>{fmtUsd(bonus.rollover_progress_usd)} traded</span>
            <span>{fmtUsd(bonus.rollover_required_usd)} required</span>
          </div>
          {rolloverActive && (
            <div className="font-pixel text-[7px] text-[#ffe93d] mt-2">
              ! WITHDRAWALS LOCKED UNTIL ROLLOVER COMPLETE
            </div>
          )}
        </div>
      )}

      {/* DEPOSIT */}
      <div className="pixel-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <ArrowDownToLine size={16} className="text-[#00FF29]" />
          <div className="font-pixel text-[11px] text-[#00FF29]">DEPOSIT</div>
        </div>
        <div className="font-pixel text-[9px] text-[#808080] mb-2">YOUR SOLANA DEPOSIT ADDRESS</div>
        <div className="flex items-center gap-3 bg-[#0d0d0d] border-2 border-[#1f1f1f] p-4 mb-4 flex-wrap">
          <div className="font-mono text-[14px] text-[#00FF29] break-all flex-1 min-w-[200px]">
            {addr || 'PROVISIONING WALLET...'}
          </div>
          <button onClick={copy} disabled={!addr}
            className="pixel-btn pixel-btn-secondary !py-2 !px-3 !text-[9px]">
            {copied ? <><Check size={12} className="mr-2"/>COPIED</> : <><Copy size={12} className="mr-2"/>COPY</>}
          </button>
          {addr && (
            <a href={`https://solscan.io/account/${addr}`} target="_blank" rel="noreferrer"
              className="pixel-btn pixel-btn-secondary !py-2 !px-3 !text-[9px]">
              <ExternalLink size={12} className="mr-1" /> SOLSCAN
            </a>
          )}
        </div>
        <div className="flex items-start gap-3 p-4 bg-[#0d0d0d] border border-[#1f1f1f] mb-4">
          <AlertTriangle className="text-[#ffe93d] mt-1 shrink-0" size={16} />
          <div className="font-mono text-[15px] text-[#808080]">
            Send only <span className="text-white">SOL</span> on Solana mainnet. Deposits credit to your <span className="text-[#ff3838]">REAL</span> balance automatically (sweeps every 45s).
            {bonus?.opted_in && <> <span className="text-[#00FF29]">Bonus +50% will be applied on this deposit.</span></>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={sweepNow} disabled={scanning || !addr}
            className="pixel-btn pixel-btn-primary !py-3">
            <RefreshCw size={12} className={`mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'SCANNING CHAIN...' : 'FORCE SWEEP NOW'}
          </button>
          {scanMsg && <span className="font-pixel text-[9px] text-[#00FF29]">{scanMsg}</span>}
        </div>
      </div>

      {/* WITHDRAW */}
      <div className="pixel-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpFromLine size={16} className="text-[#ff3838]" />
          <div className="font-pixel text-[11px] text-[#ff3838]">WITHDRAW</div>
        </div>
        <div className="font-mono text-[15px] text-[#808080] mb-4">
          Withdraw up to your deposit allowance instantly. Profits above that require a 1-3h review.
        </div>

        {/* WITHDRAWAL POLICY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="bg-[#0d0d0d] border-l-4 border-l-[#00FF29] border border-[#1f1f1f] p-3 flex items-start gap-3">
            <ShieldCheck size={16} className="text-[#00FF29] mt-1 shrink-0" />
            <div>
              <div className="font-pixel text-[8px] text-[#00FF29] mb-1">INSTANT \u00b7 DEPOSIT AMOUNT</div>
              <div className="font-mono text-[13px] text-[#808080]">
                Up to <strong className="text-white">{allowance.toFixed(4)} SOL</strong>
                {' '}(your remaining initial deposit) is sent <strong className="text-white">automatically</strong> from treasury.
              </div>
            </div>
          </div>
          <div className="bg-[#0d0d0d] border-l-4 border-l-[#ffe93d] border border-[#1f1f1f] p-3 flex items-start gap-3">
            <Clock size={16} className="text-[#ffe93d] mt-1 shrink-0" />
            <div>
              <div className="font-pixel text-[8px] text-[#ffe93d] mb-1">MANUAL REVIEW \u00b7 PROFITS</div>
              <div className="font-mono text-[13px] text-[#808080]">
                Anything <strong className="text-white">above your deposit</strong> (profits) requires manual review (<strong className="text-white">1-3h</strong>). You can cancel it any time below.
              </div>
            </div>
          </div>
        </div>
        {bonus?.active && (
          <div className="bg-[#0d0d0d] border border-[#ffe93d] p-3 mb-4 flex items-start gap-3">
            <Info size={14} className="text-[#ffe93d] mt-1 shrink-0" />
            <div className="font-mono text-[13px] text-[#808080]">
              <strong className="text-[#ffe93d]">Bonus active:</strong> all withdrawals (including your deposit) are locked until 35x rollover is met.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
          <div className="md:col-span-8">
            <div className="font-pixel text-[8px] text-[#808080] mb-2">DESTINATION SOLANA ADDRESS</div>
            <input value={wdAddr} onChange={e => setWdAddr(e.target.value)}
              placeholder="Your Phantom / external wallet"
              className="w-full bg-[#0d0d0d] border-2 border-[#1f1f1f] focus:border-[#ff3838] outline-none px-3 py-2 font-mono text-[14px] text-white" />
          </div>
          <div className="md:col-span-4">
            <div className="font-pixel text-[8px] text-[#808080] mb-2 flex justify-between">
              <span>AMOUNT (SOL)</span>
              <button type="button" onClick={() => setWdAmount(allowance.toFixed(4))}
                className="text-[#00FF29] hover:underline">MAX AUTO</button>
            </div>
            <input type="number" step="0.0001" value={wdAmount} onChange={e => setWdAmount(e.target.value)}
              placeholder="0.0000"
              className="w-full bg-[#0d0d0d] border-2 border-[#1f1f1f] focus:border-[#ff3838] outline-none px-3 py-2 font-mono text-[14px] text-white" />
          </div>
        </div>

        {requestedSol > 0 && (
          <div className="bg-[#0d0d0d] border border-[#1f1f1f] p-3 mb-3 space-y-1">
            <div className="flex justify-between font-mono text-[14px]">
              <span className="text-[#808080]">ALLOWANCE LEFT</span>
              <span className="text-white">{allowance.toFixed(4)} SOL</span>
            </div>
            <div className="flex justify-between font-mono text-[14px]">
              <span className="text-[#808080]">INSTANT AUTO-PAYOUT</span>
              <span className="text-[#00FF29]">{previewAuto.toFixed(4)} SOL</span>
            </div>
            {previewManual > 0 && (
              <div className="flex justify-between font-mono text-[14px]">
                <span className="text-[#808080]">REVIEW (1-3H)</span>
                <span className="text-[#ffe93d]">{previewManual.toFixed(4)} SOL</span>
              </div>
            )}
          </div>
        )}

        <button onClick={requestWithdrawal} disabled={wdBusy || !wdAddr || !wdAmount || rolloverActive}
          className="pixel-btn !py-3"
          style={{ background: rolloverActive ? '#1f1f1f' : '#ff3838',
                   color: rolloverActive ? '#808080' : '#050505',
                   boxShadow: rolloverActive ? 'none' : '0 4px 0 0 #7a1717' }}>
          {rolloverActive ? 'LOCKED \u2022 ROLLOVER NOT MET' :
            wdBusy ? 'SUBMITTING...' : 'REQUEST WITHDRAWAL'}
        </button>
        {wdMsg && <div className="font-pixel text-[9px] text-[#00FF29] mt-3 break-words">{wdMsg}</div>}
      </div>

      {/* HISTORY */}
      {withdrawals.length > 0 && (
        <div className="pixel-card p-5">
          <div className="font-pixel text-[10px] text-[#00FF29] mb-3">// WITHDRAWAL HISTORY</div>
          <table className="w-full font-mono text-[14px]">
            <thead>
              <tr className="font-pixel text-[7px] text-[#808080] border-b border-[#1f1f1f]">
                <th className="text-left py-2">DATE</th>
                <th className="text-left">TO</th>
                <th className="text-right">AMOUNT</th>
                <th className="text-center">KIND</th>
                <th className="text-right">STATUS</th>
                <th className="text-right">TX / ACTION</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map(w => (
                <tr key={w.id} className="border-b border-[#1f1f1f]/50">
                  <td className="py-2 text-[#808080]">{new Date(w.requested_at).toLocaleDateString()}</td>
                  <td className="text-white">{w.to_address.slice(0,4)}...{w.to_address.slice(-4)}</td>
                  <td className="text-right text-white">{w.amount_sol.toFixed(4)} SOL</td>
                  <td className="text-center">
                    <span className={`font-pixel text-[7px] px-2 py-1 ${w.kind === 'auto' ? 'text-[#00FF29] border border-[#00FF29]' : 'text-[#ffe93d] border border-[#ffe93d]'}`}>
                      {(w.kind || 'manual').toUpperCase()}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`font-pixel text-[7px] px-2 py-1 ${
                      w.status === 'completed' ? 'bg-[#00FF29] text-[#050505]' :
                      w.status === 'pending' ? 'bg-[#0d0d0d] text-[#ffe93d] border border-[#ffe93d]' :
                      w.status === 'rejected' ? 'bg-[#ff3838] text-[#050505]' :
                      w.status === 'cancelled' ? 'bg-[#0d0d0d] text-[#808080] border border-[#808080]' :
                      'bg-[#0d0d0d] text-[#ff3838] border border-[#ff3838]'
                    }`}>{w.status.toUpperCase()}</span>
                  </td>
                  <td className="text-right">
                    {w.tx_signature ? (
                      <a href={`https://solscan.io/tx/${w.tx_signature}`} target="_blank" rel="noreferrer"
                        className="text-[#00FF29] hover:underline font-mono text-[12px]">
                        {w.tx_signature.slice(0,6)}...
                      </a>
                    ) : (w.status === 'pending' && w.kind === 'manual') ? (
                      <button
                        data-testid={`cancel-withdrawal-${w.id}`}
                        onClick={() => cancelWithdrawal(w.id)}
                        className="font-pixel text-[7px] px-2 py-1 border border-[#ff3838] text-[#ff3838] hover:bg-[#ff3838] hover:text-[#050505] inline-flex items-center gap-1"
                      >
                        <X size={10} /> CANCEL
                      </button>
                    ) : '\u2014'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color, sub }) {
  return (
    <div className="pixel-card p-4">
      <div className="font-pixel text-[7px] text-[#808080] tracking-[0.15em] mb-2">{label}</div>
      <div className="font-pixel text-[15px]" style={{ color }}>{value}</div>
      {sub && <div className="font-mono text-[12px] text-[#808080] mt-1">{sub}</div>}
    </div>
  );
}
