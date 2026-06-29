import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

// App ID from https://dashboard.privy.io - set REACT_APP_PRIVY_APP_ID in frontend/.env
const PRIVY_APP_ID = process.env.REACT_APP_PRIVY_APP_ID || 'cmq45366d00c60cleqhgf79jl';

export default function PrivyWrapper({ children }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // X (Twitter) first, wallet as fallback. Email disabled to reduce friction.
        loginMethods: ['twitter', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#00FF29',
          showWalletLoginFirst: false,
          walletList: ['phantom', 'solflare', 'backpack', 'detected_wallets'],
        },
        // Server-side custodial Solana wallets are used for deposits.
        // Disable Privy embedded EVM wallets to avoid a chain mismatch UX.
        embeddedWallets: {
          createOnLogin: 'off',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
