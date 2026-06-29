import React, { useState } from 'react';
import { useAppUser } from './UserSync';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { fmtUsd } from '../lib/api';

export default function WalletPage() {
  const { dbUser } = useAppUser();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!dbUser?.wallet_address) return;
    await navigator.clipboard.writeText(dbUser.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="section-label">// WALLET.SYS</div>
      <h1 className="font-pixel text-white text-[22px]">DEPOSIT</h1>

      <div className="pixel-card p-6">
        <div className="font-pixel text-[9px] text-[#808080] mb-2">YOUR DEPOSIT ADDRESS</div>
        <div className="flex items-center gap-3 bg-[#0d0d0d] border-2 border-[#1f1f1f] p-4 mb-4">
          <div className="font-mono text-[14px] text-[#00FF29] break-all flex-1">
            {dbUser?.wallet_address || 'PROVISIONING WALLET...'}
          </div>
          <button onClick={copy} disabled={!dbUser?.wallet_address}
            className="pixel-btn pixel-btn-secondary !py-2 !px-3 !text-[9px]">
            {copied ? <><Check size={12} className="mr-2"/>COPIED</> : <><Copy size={12} className="mr-2"/>COPY</>}
          </button>
        </div>

        <div className="flex items-start gap-3 p-4 bg-[#0d0d0d] border border-[#1f1f1f]">
          <AlertTriangle className="text-[#ffe93d] mt-1" size={16} />
          <div className="font-mono text-[15px] text-[#808080]">
            Send only <span className="text-white">SOL or USDC</span> on the Solana network to this address.
            Other networks may result in permanent loss. Deposits will be credited as paper USDC during beta.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="pixel-card p-5">
          <div className="font-pixel text-[8px] text-[#808080] mb-2">BALANCE</div>
          <div className="font-pixel text-[24px] text-[#00FF29]">{fmtUsd(dbUser?.balance || 0)}</div>
          <div className="font-mono text-[14px] text-[#808080] mt-1">PAPER USDC</div>
        </div>
        <div className="pixel-card p-5">
          <div className="font-pixel text-[8px] text-[#808080] mb-2">REALIZED PNL</div>
          <div className={`font-pixel text-[24px] ${(dbUser?.total_pnl||0)>=0?'text-[#00FF29]':'text-[#ff3838]'}`}>
            {fmtUsd(dbUser?.total_pnl || 0, { sign: true })}
          </div>
          <div className="font-mono text-[14px] text-[#808080] mt-1">ALL-TIME</div>
        </div>
      </div>
    </div>
  );
}
