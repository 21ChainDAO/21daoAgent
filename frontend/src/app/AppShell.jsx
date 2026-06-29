import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useAppUser } from './UserSync';
import { LayoutDashboard, TrendingUp, Trophy, Wallet, LogOut, Copy, Check } from 'lucide-react';
import PixelLogo from '../components/PixelLogo';
import { fmtUsd } from '../lib/api';

const nav = [
  { to: '/app', icon: LayoutDashboard, label: 'DASHBOARD', end: true },
  { to: '/app/trade', icon: TrendingUp, label: 'TRADE' },
  { to: '/app/leaderboard', icon: Trophy, label: 'LEADERBOARD' },
  { to: '/app/wallet', icon: Wallet, label: 'WALLET' },
];

export default function AppShell({ children }) {
  const { logout, user } = usePrivy();
  const { dbUser } = useAppUser();
  const loc = useLocation();
  const nav2 = useNavigate();
  const [copied, setCopied] = useState(false);

  const tw = user?.twitter;
  const wallet = dbUser?.wallet_address;

  const copy = async () => {
    if (!wallet) return;
    await navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen scanlines" style={{ background: '#050505' }}>
      <div className="fixed inset-0 grid-bg pointer-events-none" style={{ zIndex: 1 }} />
      <div className="relative flex" style={{ zIndex: 10 }}>
        {/* Sidebar */}
        <aside className="w-[230px] min-h-screen border-r-2 border-[#1f1f1f] bg-[#0a0a0a] p-4 hidden md:flex flex-col">
          <Link to="/" className="flex items-center gap-3 mb-10">
            <img src="/img/degens-logo.png" alt="DegensBet" className="h-8 pixelated" />
          </Link>

          <nav className="flex flex-col gap-1">
            {nav.map(n => {
              const active = n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link key={n.to} to={n.to}
                  className={`flex items-center gap-3 px-3 py-3 font-pixel text-[9px] transition-colors ${
                    active
                      ? 'bg-[#111] border border-[#00FF29] text-[#00FF29]'
                      : 'text-[#808080] hover:text-[#F5F5F5] border border-transparent'
                  }`}>
                  <Icon size={14} />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <div className="pixel-card p-3">
              <div className="font-pixel text-[7px] text-[#808080] mb-1">BALANCE</div>
              <div className="font-pixel text-[14px] text-[#00FF29]">{fmtUsd(dbUser?.balance ?? 0)}</div>
              <div className="font-pixel text-[7px] text-[#808080] mt-3">TOTAL PNL</div>
              <div className={`font-pixel text-[11px] ${ (dbUser?.total_pnl ?? 0) >= 0 ? 'text-[#00FF29]' : 'text-[#ff3838]'}`}>
                {fmtUsd(dbUser?.total_pnl ?? 0, { sign: true })}
              </div>
            </div>
            <button onClick={() => { logout(); nav2('/'); }}
              className="mt-3 w-full pixel-btn pixel-btn-secondary !py-2 !text-[8px]">
              <LogOut size={12} className="mr-2" /> LOG OUT
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Topbar */}
          <div className="border-b-2 border-[#1f1f1f] bg-[#0a0a0a] px-6 py-3 flex items-center justify-between gap-4">
            <div className="font-pixel text-[9px] text-[#00FF29] flicker hidden sm:block">// MAINNET ONLINE</div>
            <div className="flex items-center gap-3 ml-auto">
              {wallet && (
                <button onClick={copy} className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-[#1f1f1f] hover:border-[#00FF29] transition-colors">
                  <span className="font-pixel text-[8px] text-[#808080]">WALLET</span>
                  <span className="font-mono text-[14px] text-white">{wallet.slice(0,4)}...{wallet.slice(-4)}</span>
                  {copied ? <Check size={12} className="text-[#00FF29]" /> : <Copy size={12} className="text-[#808080]" />}
                </button>
              )}
              {tw?.profilePictureUrl ? (
                <img src={tw.profilePictureUrl} alt="" className="w-9 h-9 border-2 border-[#1f1f1f]" />
              ) : (
                <div className="w-9 h-9 bg-[#0d0d0d] border-2 border-[#1f1f1f] flex items-center justify-center font-pixel text-[8px] text-[#00FF29]">DG</div>
              )}
              <div className="hidden sm:block">
                <div className="font-pixel text-[8px] text-white">@{tw?.username || 'anon'}</div>
                <div className="font-pixel text-[7px] text-[#808080]">{tw?.name || 'Degen'}</div>
              </div>
            </div>
          </div>

          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
