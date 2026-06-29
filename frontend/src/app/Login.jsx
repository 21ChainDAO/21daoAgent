import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import PixelLogo from '../components/PixelLogo';
import { Twitter, Wallet, Mail } from 'lucide-react';

export default function Login() {
  const { login, ready } = usePrivy();
  return (
    <div className="min-h-screen flex items-center justify-center px-6 scanlines vignette" style={{ background: '#050505' }}>
      <div className="fixed inset-0 grid-bg pointer-events-none" style={{ zIndex: 1 }} />
      <div className="relative pixel-card p-10 max-w-md w-full text-center" style={{ zIndex: 10 }}>
        <div className="flex justify-center mb-6"><PixelLogo size={8} /></div>
        <div className="font-pixel text-white text-[14px] mb-3">DEGENSBET</div>
        <div className="font-pixel text-[8px] text-[#00FF29] tracking-[0.2em] mb-6 flicker">// AUTH.SYS :: REQUIRED</div>

        <p className="font-mono text-[18px] text-[#808080] mb-8 leading-snug">
          Connect your X account to enter the arcade.<br/>
          A non-custodial wallet will be auto-provisioned.
        </p>

        <button onClick={login} disabled={!ready}
          className="pixel-btn pixel-btn-primary w-full !py-4 mb-3">
          <Twitter size={14} className="mr-2" /> CONNECT WITH X
        </button>
        <button onClick={login} disabled={!ready}
          className="pixel-btn pixel-btn-secondary w-full !py-3 mb-3">
          <Wallet size={14} className="mr-2" /> CONNECT WALLET
        </button>
        <button onClick={login} disabled={!ready}
          className="pixel-btn pixel-btn-secondary w-full !py-3">
          <Mail size={14} className="mr-2" /> EMAIL
        </button>

        <div className="divider-pixel mt-8 mb-4" />
        <div className="font-pixel text-[7px] text-[#808080]">
          NEW USERS GET <span className="text-[#00FF29]">$10,000</span> PAPER USDC
        </div>
      </div>
    </div>
  );
}
