import React, { useEffect, useState, useCallback } from 'react';
import { useAppUser } from './UserSync';
import { Copy, Check, AlertTriangle, RefreshCw, ExternalLink, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
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

  const addr = dbUser?.custodial_address;

  const loadOnchain = useCallback(async () => {
    if (!addr) return;
    setLoadingBal(true);
    try {
      const r = await api.get(`/wallet/balance/${addr}`);
      setOnchain({ sol: r.data.sol || 0, usdc: r.data.usdc || 0 });
    } catch (e) {}
    finally { setLoadingBal(false); }
  }, [addr]);

  const loadWithdrawals = async () => {
    try {
      const r = await api.get('/wallet/withdrawals/me');
      setWithdrawals(r.data.withdrawals || []);
    } catch (e) {}
  };

  useEffect(() => {
    loadOnchain();
    loadWithdrawals();
    const id = setInterval(() => { loadOnchain(); }, 15000);
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
      setScanMsg(sol > 0 ? `✓ SWEPT ${sol.toFixed(4)} SOL` : 'NO DEPOSITS TO SWEEP');
      await refresh();
      await loadOnchain();
    } catch (e) {
      setScanMsg(e.response?.data?.detail || 'SWEEP FAILED');
    } finally {
      setScanning(false);
      setTimeout(() => setScanMsg(''), 4000);
    }
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
      setWdMsg('✓ ' + parts.join(' · '));
      setWdAddr(''); setWdAmount('');
      await refresh();
      await loadWithdrawals();
    } catch (e) {
      setWdMsg(e.response?.data?.detail || 'REQUEST FAILED');
    } finally {
      setWdBusy(false);
      setTimeout(() => setWdMsg(''), 8000);
    }
  };

  // compute auto/manual preview for current input
  const requestedSol = Number(wdAmount) || 0;
  const depositedSol = Number(dbUser?.total_sol_deposited || 0);
  const autoWithdrawnSol = Number(dbUser?.total_sol_withdrawn_auto || 0);
  const allowance = Math.max(0, depositedSol - autoWithdrawnSol);
  const previewAuto = Math.min(requestedSol, allowance);
  const previewManual = Math.max(0, requestedSol - previewAuto);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="section-label">// WALLET.SYS</div>
      <h1 className="font-pixel text-white text-[22px]">WALLET</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="PAPER BALANCE" value={fmtUsd(dbUser?.paper?.balance || 0)} color="#00FF29" />
        <Stat label="REAL BALANCE" value={fmtUsd(dbUser?.real?.balance || 0)} color="#ff3838" />
        <Stat label="ON-CHAIN SOL" value={`${onchain.sol.toFixed(4)}`} color="#F5F5F5" sub={loadingBal?'…':'HELIUS'} />
        <Stat label="DEPOSITED (TOTAL)" value={`${(dbUser?.total_sol_deposited || 0).toFixed(4)} SOL`} color="#F5F5F5" />
      </div>

      {/* Deposit */}
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
            Send only <span className="text-white">SOL</span> on Solana mainnet to this address.
            Deposits are auto-credited to your <span className="text-[#ff3838]">REAL</span> balance at current SOL price.
            Sweeps run automatically every 45s.
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

      {/* Withdraw */}
      <div className="pixel-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpFromLine size={16} className="text-[#ff3838]" />
          <div className="font-pixel text-[11px] text-[#ff3838]">WITHDRAW</div>
        </div>
        <div className="font-mono text-[15px] text-[#808080] mb-4">
          Request a SOL withdrawal from your REAL balance. Withdrawals are processed manually (within 24h).
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
          <div className="md:col-span-8">
            <div className="font-pixel text-[8px] text-[#808080] mb-2">DESTINATION SOLANA ADDRESS</div>
            <input value={wdAddr} onChange={e => setWdAddr(e.target.value)}
              placeholder="Your Phantom / external wallet"
              className="w-full bg-[#0d0d0d] border-2 border-[#1f1f1f] focus:border-[#ff3838] outline-none px-3 py-2 font-mono text-[14px] text-white" />
          </div>
          <div className="md:col-span-4">
            <div className="font-pixel text-[8px] text-[#808080] mb-2">AMOUNT (SOL)</div>
            <input type="number" step="0.01" value={wdAmount} onChange={e => setWdAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#0d0d0d] border-2 border-[#1f1f1f] focus:border-[#ff3838] outline-none px-3 py-2 font-mono text-[14px] text-white" />
          </div>
        </div>

        {requestedSol > 0 && (
          <div className="bg-[#0d0d0d] border border-[#1f1f1f] p-3 mb-3 space-y-1">
            <div className="flex justify-between font-mono text-[14px]">
              <span className="text-[#808080]">DEPOSIT ALLOWANCE LEFT</span>
              <span className="text-white">{allowance.toFixed(4)} SOL</span>
            </div>
            <div className="flex justify-between font-mono text-[14px]">
              <span className="text-[#808080]">INSTANT AUTO-PAYOUT</span>
              <span className="text-[#00FF29]">{previewAuto.toFixed(4)} SOL</span>
            </div>
            {previewManual > 0 && (
              <div className="flex justify-between font-mono text-[14px]">
                <span className="text-[#808080]">MANUAL REVIEW (1-3H)</span>
                <span className="text-[#ffe93d]">{previewManual.toFixed(4)} SOL</span>
              </div>
            )}
            <div className="font-pixel text-[7px] text-[#808080] mt-2">
              Withdrawals up to your deposited amount are paid instantly. Profits above that go through manual review.
            </div>
          </div>
        )}

        <button onClick={requestWithdrawal} disabled={wdBusy || !wdAddr || !wdAmount}
          className="pixel-btn !py-3"
          style={{ background: '#ff3838', color: '#050505', boxShadow: '0 4px 0 0 #7a1717' }}>
          {wdBusy ? 'SUBMITTING...' : 'REQUEST WITHDRAWAL'}
        </button>
        {wdMsg && <div className="font-pixel text-[9px] text-[#00FF29] mt-3">{wdMsg}</div>}
      </div>

      {/* Withdrawal history */}
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
                <th className="text-right">TX</th>
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
                      'bg-[#0d0d0d] text-[#ff3838] border border-[#ff3838]'
                    }`}>{w.status.toUpperCase()}</span>
                  </td>
                  <td className="text-right">
                    {w.tx_signature ? (
                      <a href={`https://solscan.io/tx/${w.tx_signature}`} target="_blank" rel="noreferrer"
                        className="text-[#00FF29] hover:underline font-mono text-[12px]">
                        {w.tx_signature.slice(0,6)}...
                      </a>
                    ) : '—'}
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
