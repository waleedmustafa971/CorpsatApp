import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as api from '../services/api';
import { Farmer, FarmerSession } from '../types';

interface SessionValue {
  session: FarmerSession | null;
  farmer: Farmer | null;
  /** False until the persisted session has been read from AsyncStorage. */
  ready: boolean;
  signIn: (phone: string, code: string) => Promise<FarmerSession>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<FarmerSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .hydrateSession()
      .then((restored) => {
        if (cancelled) return;
        setSession(restored);
      })
      .finally(() => {
        if (cancelled) return;
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (phone: string, code: string) => {
    const next = await api.verifyOtp(phone, code);
    setSession(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await api.logout();
    setSession(null);
  }, []);

  const refresh = useCallback(async () => {
    const farmer = await api.refreshFarmer();
    if (!farmer) return;
    setSession((prev) => (prev ? { ...prev, farmer } : prev));
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ session, farmer: session?.farmer ?? null, ready, signIn, signOut, refresh }),
    [session, ready, signIn, signOut, refresh],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}
