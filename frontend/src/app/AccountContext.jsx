import React, { useState, useEffect, useCallback, useMemo } from 'react';

const Ctx = React.createContext({
  account: 'paper', setAccount: () => {},
  displayCurrency: 'USD', setDisplayCurrency: () => {},
});
export function useAccount() { return React.useContext(Ctx); }

export default function AccountProvider({ children }) {
  const [account, setAccountState] = useState(() => {
    try { return localStorage.getItem('db_account') || 'paper'; }
    catch (e) { console.warn('localStorage read failed (db_account):', e); return 'paper'; }
  });
  const [displayCurrency, setDisplayCurrencyState] = useState(() => {
    try { return localStorage.getItem('db_currency') || 'USD'; }
    catch (e) { console.warn('localStorage read failed (db_currency):', e); return 'USD'; }
  });

  const setAccount = useCallback((a) => {
    setAccountState(a);
    try { localStorage.setItem('db_account', a); }
    catch (e) { console.warn('localStorage write failed (db_account):', e); }
  }, []);
  const setDisplayCurrency = useCallback((c) => {
    const v = c === 'SOL' ? 'SOL' : 'USD';
    setDisplayCurrencyState(v);
    try { localStorage.setItem('db_currency', v); }
    catch (e) { console.warn('localStorage write failed (db_currency):', e); }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'db_account' && e.newValue) setAccountState(e.newValue);
      if (e.key === 'db_currency' && e.newValue) setDisplayCurrencyState(e.newValue);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const value = useMemo(
    () => ({ account, setAccount, displayCurrency, setDisplayCurrency }),
    [account, setAccount, displayCurrency, setDisplayCurrency],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
