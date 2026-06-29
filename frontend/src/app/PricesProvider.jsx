import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

const Ctx = React.createContext({ prices: {}, get: () => null });
export function usePrices() { return React.useContext(Ctx); }

/**
 * Polls /api/markets/prices every 3 seconds (real DexScreener data via backend cache).
 * No synthetic noise — the displayed price always reflects the most recent upstream value.
 * Each tick updates `updated_at` so chart components can append a new point even
 * if the underlying price was unchanged.
 */
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
      } catch (e) { /* noop */ }
    };
    load();
    const id = setInterval(load, API_INTERVAL_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return <Ctx.Provider value={{ prices, get: (p) => prices[p] }}>{children}</Ctx.Provider>;
}
