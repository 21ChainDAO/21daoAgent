import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

// Replace with your real Privy App ID from https://dashboard.privy.io
const PRIVY_APP_ID = process.env.REACT_APP_PRIVY_APP_ID || 'clpispdty00ycl80fpueukbhl';

export default function PrivyWrapper({ children }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['twitter', 'wallet', 'email'],
        appearance: {
          theme: 'dark',
          accentColor: '#00FF29',
          logo: undefined,
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
