import React, { useEffect, useState, useCallback } from 'react';
import { useAppUser } from './UserSync';
import { Copy, Check, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { api, fmtUsd } from '../lib/api';

export default function WalletPage() {
  const { dbUser, refresh } = useAppUser();
  const [copied, setCopied] = useState(false);
  const [onchain, setOnchain] = useState({ sol: 0, usdc: 0 });
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const [loadingBal, setLoadingBal] = useState(false);

  const addr = dbUser?.wallet_address;

  const loadOnchain = useCallback(async () => {
    if (!addr) return;
    setLoadingBal(true);
    try {
      const r = await api.get(`/wallet/balance/${addr}`);
      setOnchain({ sol: r.data.sol || 0, usdc: r.data.usdc || 0 });
    } catch (e) { /* noop */ }
    finally { setLoadingBal(false); }
  }, [addr]);

  useEffect(() => { loadOnchain(); }, [loadOnchain]);

  const copy = async () => {
    if (!addr) return;
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const scanDeposits = async () => {
    setScanning(true); setScanMsg('');
    try {
      const r = await api.post('/wallet/deposit/scan', {});
      const credited = r.data.credited || 0;
      if (credited > 0) {
        setScanMsg(`+ ${fmtUsd(credited)} CREDITED`);
        await refresh();
      } else {
        setScanMsg('NO NEW DEPOSITS');
      }
      await loadOnchain();
    } catch (e) {
      setScanMsg(e.response?.data?.detail || 'SCAN FAILED');
    } finally {
      setScanning(false);
      setTimeout(() => setScanMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="section-label">// WALLET.SYS</div>
      <h1 className="font-pixel text-white text-[22px]">DEPOSIT</h1>

      <div className="pixel-card p-6">
        <div className="font-pixel text-[9px] text-[#808080] mb-2">YOUR SOLANA DEPOSIT ADDRESS</div>
        <div className="flex items-center gap-3 bg-[#0d0d0d] border-2 border-[#1f1f1f] p-4 mb-4">
          <div className="font-mono text-[14px] text-[#00FF29] break-all flex-1">
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

        <div className="flex items-start gap-3 p-4 bg-[#0d0d0d] border border-[#1f1f1f]">
          <AlertTriangle className="text-[#ffe93d] mt-1 shrink-0" size={16} />
          <div className="font-mono text-[15px] text-[#808080]">
            Send only <span className="text-white">SOL or USDC</span> on the Solana network to this address.
            Other networks may result in permanent loss. Deposits convert to paper USDC for trading
            (<span className="text-white">1 SOL = $150 paper</span>, <span className="text-white">1 USDC = $1 paper</span>) during beta.
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button onClick={scanDeposits} disabled={scanning || !addr}
            className="pixel-btn pixel-btn-primary !py-3">
            <RefreshCw size={12} className={`mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'SCANNING CHAIN...' : 'SCAN FOR DEPOSITS'}
          </button>
          {scanMsg && <span className="font-pixel text-[9px] text-[#00FF29]">{scanMsg}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="PAPER BALANCE" value={fmtUsd(dbUser?.balance || 0)} color="#00FF29" sub="USDC" />
        <Stat label="REALIZED PNL" value={fmtUsd(dbUser?.total_pnl || 0, { sign: true })}
              color={(dbUser?.total_pnl||0) >= 0 ? '#00FF29' : '#ff3838'} sub="ALL-TIME" />
        <Stat label="ON-CHAIN SOL" value={`${onchain.sol.toFixed(4)}`}
              color="#F5F5F5" sub={loadingBal ? 'LOADING...' : 'HELIUS'} />
        <Stat label="ON-CHAIN USDC" value={`$${onchain.usdc.toFixed(2)}`}
              color="#F5F5F5" sub={loadingBal ? 'LOADING...' : 'HELIUS'} />
      </div>

      <div className="pixel-card p-5">
        <div className="font-pixel text-[10px] text-[#00FF29] mb-3">// HOW IT WORKS</div>
        <ol className="font-mono text-[16px] text-[#808080] space-y-2 list-decimal pl-5">
          <li>Copy your Solana deposit address above.</li>
          <li>Send SOL or USDC from Phantom / Solflare / any wallet on Solana mainnet.</li>
          <li>Click <span className="text-[#00FF29]">SCAN FOR DEPOSITS</span> to credit your paper balance.</li>
          <li>Head to <span className="text-white">/app/trade</span> and start longing or shorting at up to 1000x.</li>
        </ol>
      </div>
    </div>
  );
}

function Stat({ label, value, color, sub }) {
  return (
    <div className="pixel-card p-4">
      <div className="font-pixel text-[7px] text-[#808080] tracking-[0.15em] mb-2">{label}</div>
      <div className="font-pixel text-[16px]" style={{ color }}>{value}</div>
      {sub && <div className="font-mono text-[12px] text-[#808080] mt-1">{sub}</div>}
    </div>
  );
}
