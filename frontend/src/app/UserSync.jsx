import React, { useEffect, useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { api, setAuthHeader } from '../lib/api';

const Ctx = React.createContext(null);

export function useAppUser() {
  return React.useContext(Ctx);
}

export default function UserSync({ children }) {
  const { ready, authenticated, user } = usePrivy();
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!authenticated || !user?.id) return;
    setAuthHeader(user.id);
    try {
      const r = await api.get('/users/me');
      setDbUser(r.data);
    } catch (e) {
      // 404 means we need to create
      if (e.response?.status === 404) {
        const tw = user.twitter || {};
        const wallet = user.wallet?.address || user.linkedAccounts?.find(a => a.type === 'wallet')?.address;
        const r2 = await api.post('/users/upsert', {
          privy_id: user.id,
          x_handle: tw.username || null,
          x_name: tw.name || null,
          x_avatar: tw.profilePictureUrl || null,
          wallet_address: wallet || null,
        });
        setDbUser(r2.data);
      }
    }
  }, [authenticated, user]);

  useEffect(() => {
    if (!ready) return;
    if (authenticated && user) {
      setLoading(true);
      (async () => {
        const tw = user.twitter || {};
        const wallet = user.wallet?.address || user.linkedAccounts?.find(a => a.type === 'wallet')?.address;
        setAuthHeader(user.id);
        try {
          const r = await api.post('/users/upsert', {
            privy_id: user.id,
            x_handle: tw.username || null,
            x_name: tw.name || null,
            x_avatar: tw.profilePictureUrl || null,
            wallet_address: wallet || null,
          });
          setDbUser(r.data);
        } catch (e) {
          console.error('upsert failed', e);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setAuthHeader(null);
      setDbUser(null);
    }
  }, [ready, authenticated, user]);

  return (
    <Ctx.Provider value={{ dbUser, setDbUser, refresh, loading }}>
      {children}
    </Ctx.Provider>
  );
}
