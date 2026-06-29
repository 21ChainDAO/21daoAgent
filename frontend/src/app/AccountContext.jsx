import React, { useState, useEffect, useCallback } from 'react';

const Ctx = React.createContext({ account: 'paper', setAccount: () => {} });
export function useAccount() { return React.useContext(Ctx); }

export default function AccountProvider({ children }) {
  const [account, setAccountState] = useState(() => {
    try { return localStorage.getItem('db_account') || 'paper'; } catch { return 'paper'; }
  });
  const setAccount = useCallback((a) => {
    setAccountState(a);
    try { localStorage.setItem('db_account', a); } catch {}
  }, []);
  useEffect(() => {
    // sync across tabs
    const handler = (e) => { if (e.key === 'db_account' && e.newValue) setAccountState(e.newValue); };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  return <Ctx.Provider value={{ account, setAccount }}>{children}</Ctx.Provider>;
}
