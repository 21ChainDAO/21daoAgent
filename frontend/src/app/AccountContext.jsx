import React, { useState, useEffect, useCallback } from 'react';

const Ctx = React.createContext({
  account: 'paper', setAccount: () => {},
  displayCurrency: 'USD', setDisplayCurrency: () => {},
});
export function useAccount() { return React.useContext(Ctx); }

export default function AccountProvider({ children }) {
  const [account, setAccountState] = useState(() => {
    try { return localStorage.getItem('db_account') || 'paper'; } catch { return 'paper'; }
  });
  const [displayCurrency, setDisplayCurrencyState] = useState(() => {
    try { return localStorage.getItem('db_currency') || 'USD'; } catch { return 'USD'; }
  });

  const setAccount = useCallback((a) => {
    setAccountState(a);
    try { localStorage.setItem('db_account', a); } catch { /* noop */ }
  }, []);
  const setDisplayCurrency = useCallback((c) => {
    const v = c === 'SOL' ? 'SOL' : 'USD';
    setDisplayCurrencyState(v);
    try { localStorage.setItem('db_currency', v); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'db_account' && e.newValue) setAccountState(e.newValue);
      if (e.key === 'db_currency' && e.newValue) setDisplayCurrencyState(e.newValue);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <Ctx.Provider value={{ account, setAccount, displayCurrency, setDisplayCurrency }}>
      {children}
    </Ctx.Provider>
  );
}
