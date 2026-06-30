import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';

const Ctx = React.createContext({ prices: {}, get: () => null });
export function usePrices() { return React.useContext(Ctx); }

const API_INTERVAL_MS = 3_000;

export default function PricesProvider({ children }) {
  const [prices, setPrices] = useState({});
  const lastRef = useRef({});

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await api.get('/markets/prices');
        if (!alive) return;
        const next = {};
        const ts = new Date().toISOString();
        for (const p of r.data.prices) {
          next[p.pair] = { ...p, updated_at: ts };
        }
        lastRef.current = next;
        setPrices(next);
      } catch (err) {
        console.warn('[prices] fetch failed:', err?.message || err);
      }
    };
    load();
    const id = setInterval(load, API_INTERVAL_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const value = useMemo(
    () => ({ prices, get: (p) => prices[p] }),
    [prices],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
