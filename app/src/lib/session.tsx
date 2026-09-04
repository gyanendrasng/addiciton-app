/**
 * Session state for Curb.
 *
 * WHY THIS EXISTS instead of `authClient.useSession()`:
 *
 * better-auth issue #10545 (open as of 1.7.2) — on exactly our stack (Expo SDK
 * 57 / RN 0.86 / React 19) the reactive `useSession()` hook never re-renders
 * after a successful sign-in. The server creates the session, the cookie is
 * written to SecureStore, but `$sessionSignal` is left with no bound listeners
 * so the store notification is a no-op. Force-quit and relaunch and you are
 * signed in — which is exactly the symptom of a store that never notified.
 *
 * So we do not subscribe to the store at all. `authClient.getSession()` is a
 * plain fetch that reads the SecureStore cookie and hits the server; we drive
 * state off that, imperatively, and re-check on foreground. Sign-in and
 * sign-out call `refresh()` themselves rather than trusting a re-render.
 *
 * Revisit once 1.7.3+ ships with a fix; the public shape here matches
 * `useSession()` closely enough that swapping back is a one-file change.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { configurePurchases, logOutPurchases } from '@/features/premium/purchases';
import { authClient } from './auth-client';

type SessionData = Awaited<ReturnType<typeof authClient.getSession>>['data'];

export type SessionState = {
  session: SessionData;
  /** True until the first `getSession()` settles. Mirrors `isPending`. */
  loading: boolean;
  /** Re-read the session from the server. Returns the fresh value. */
  refresh: () => Promise<SessionData>;
};

const SessionContext = createContext<SessionState>({
  session: null,
  loading: true,
  refresh: async () => null,
});

/** Foreground re-checks any more often than this are pointless. */
const REFRESH_THROTTLE_MS = 30_000;

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData>(null);
  const [loading, setLoading] = useState(true);
  // Refs so `refresh` keeps a stable identity — it is a dependency of the
  // AppState listener and of every sign-in call site.
  const latest = useRef<SessionData>(null);
  const lastFetchedAt = useRef(0);
  const mounted = useRef(true);

  const refresh = useCallback(async (): Promise<SessionData> => {
    lastFetchedAt.current = Date.now();
    let data: SessionData;
    try {
      // Direct fetch — deliberately bypasses the reactive store (see header).
      const result = await authClient.getSession();
      data = result.data ?? null;
    } catch {
      // Offline: keep whatever we already had rather than false-signing-out.
      if (mounted.current) setLoading(false);
      return latest.current;
    }
    latest.current = data;
    if (mounted.current) {
      setSession(data);
      setLoading(false);
    }
    return data;
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (Date.now() - lastFetchedAt.current < REFRESH_THROTTLE_MS) return;
      void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  /**
   * Keep RevenueCat's App User ID pointed at the signed-in account.
   *
   * This is the line that makes a subscription follow the person to a new
   * phone rather than staying with the device. On sign-out we log out too, or
   * the next person to buy on this device would be attributed to the last
   * account.
   */
  useEffect(() => {
    const id = session?.user?.id;
    if (id) void configurePurchases(id);
    else void logOutPurchases();
  }, [session?.user?.id]);

  return (
    <SessionContext.Provider value={{ session, loading, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  return useContext(SessionContext);
}
