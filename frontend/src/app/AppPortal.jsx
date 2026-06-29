import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import PrivyWrapper from './PrivyWrapper';
import UserSync, { useAppUser } from './UserSync';
import PricesProvider from './PricesProvider';
import Login from './Login';
import AppShell from './AppShell';
import Dashboard from './Dashboard';
import TradeView from './TradeView';
import Leaderboard from './Leaderboard';
import WalletPage from './WalletPage';

function Guard({ children }) {
  const { ready, authenticated } = usePrivy();
  const { dbUser, loading } = useAppUser();
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="font-pixel text-[10px] text-[#00FF29] flicker">BOOTING...</div>
      </div>
    );
  }
  if (!authenticated) return <Login />;
  if (loading || !dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="font-pixel text-[10px] text-[#00FF29] flicker">SYNCING ACCOUNT...</div>
      </div>
    );
  }
  return children;
}

export default function AppPortal() {
  return (
    <PrivyWrapper>
      <UserSync>
        <PricesProvider>
          <Guard>
            <AppShell>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="trade" element={<TradeView />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="wallet" element={<WalletPage />} />
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Routes>
            </AppShell>
          </Guard>
        </PricesProvider>
      </UserSync>
    </PrivyWrapper>
  );
}
