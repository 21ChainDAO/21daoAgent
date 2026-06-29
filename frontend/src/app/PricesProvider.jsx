import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

const Ctx = React.createContext({ prices: {}, get: () => null });
export function usePrices() { return React.useContext(Ctx); }

export default function PricesProvider({ children }) {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await api.get('/markets/prices');
        if (!alive) return;
        const map = {};
        for (const p of r.data.prices) map[p.pair] = p;
        setPrices(map);
      } catch (e) { /* noop */ }
    };
    load();
    const id = setInterval(load, 8000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return <Ctx.Provider value={{ prices, get: (p) => prices[p] }}>{children}</Ctx.Provider>;
}
