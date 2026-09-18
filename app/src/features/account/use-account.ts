/**
 * Account + entitlement state.
 *
 * Premium is decided by the SERVER (via RevenueCat webhooks) so it is identical
 * on every device the user signs in on. The result is cached locally so the app
 * still knows you're premium when offline.
 *
 * Session comes from `@/lib/session`, not `authClient.useSession()` — see that
 * file for why.
 */
import { useCallback, useEffect, useState } from 'react';

import { AUTH_BASE_URL, authClient } from '@/lib/auth-client';
import { useSession } from '@/lib/session';
import { getSetting, setSetting } from '@/db/repo/settings';
import { setPremium } from '@/db/repo/profile';
import { claimEntitlement, clearPendingClaim, pendingClaim } from '@/features/premium/claim';
import { configurePurchases, storeEntitlementActive, syncPurchasesToIdentity } from '@/features/premium/purchases';

export type Entitlement = {
  active: boolean;
  productId: string | null;
  store: string | null;
  expiresAt: string | null;
  willRenew: boolean;
  isLifetime: boolean;
};

const CACHE_KEY = 'entitlement.cache.v1';

export const NO_ENTITLEMENT: Entitlement = {
  active: false,
  productId: null,
  store: null,
  expiresAt: null,
  willRenew: false,
  isLifetime: false,
};

/** Ask the server whether this user is premium. */
export async function fetchEntitlement(): Promise<Entitlement | null> {
  try {
    // The Expo client keeps the session cookie in SecureStore, not in a cookie
    // jar, so it has to be attached by hand. `credentials: 'omit'` is what the
    // docs prescribe — without it RN can attach a stale jar cookie instead.
    const cookie = await authClient.getCookie();
    const res = await fetch(`${AUTH_BASE_URL}/api/entitlement`, {
      headers: cookie ? { Cookie: cookie } : undefined,
      credentials: 'omit',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Entitlement & { signedIn: boolean };
    // Not signed in is "the server can't know", not "no" — a purchase made
    // before sign-in is real, and the mirror must not be cleared by it.
    if (!data.signedIn) return null;
    const entitlement: Entitlement = {
      active: data.active,
      productId: data.productId,
      store: data.store,
      expiresAt: data.expiresAt,
      willRenew: data.willRenew,
      isLifetime: data.isLifetime,
    };
    await setSetting(CACHE_KEY, entitlement);
    return entitlement;
  } catch {
    return null; // offline — caller falls back to the cache
  }
}

export function useAccount() {
  const { session, loading, refresh: refreshSession } = useSession();
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(async () => {
    setChecking(true);
    const fresh = await fetchEntitlement();
    if (fresh) {
      setEntitlement(fresh);
      // Mirror the server's answer into local SQLite so the premium gate can
      // decide instantly, and correctly, on a cold or offline launch.
      if (fresh.active) {
        await setPremium(true);
        await clearPendingClaim();
      } else if (await pendingClaim()) {
        // The server hasn't been told about this purchase yet, so its "no"
        // isn't one. The store knows — and if the account doesn't hold the
        // purchase yet, re-posting the receipt under it is what moves it
        // across. Only a definite no after that revokes.
        let store = await storeEntitlementActive();
        if (store === false) store = await syncPurchasesToIdentity();
        if (store === false) {
          await setPremium(false);
          await clearPendingClaim();
        }
      } else {
        await setPremium(false);
      }
    } else {
      const cached = await getSetting<Entitlement>(CACHE_KEY);
      if (cached) setEntitlement(cached);
    }
    setChecking(false);
  }, []);

  /**
   * On sign-in, a purchase made before the account has to be handed to it:
   * `logIn` moves RevenueCat to this user; if the account doesn't then hold
   * the purchase (it merges only into an account with no history), the
   * receipt is re-posted under it, which does; then the server is asked to
   * re-read and record the entitlement — and only then is the ordinary
   * refresh worth doing.
   */
  const userId = session?.user?.id ?? null;
  useEffect(() => {
    if (loading || !userId) return;
    let alive = true;
    void (async () => {
      if (await pendingClaim()) {
        await configurePurchases(userId);
        if ((await storeEntitlementActive()) === false) await syncPurchasesToIdentity();
        await claimEntitlement();
      }
      if (alive) await refresh();
    })();
    return () => {
      alive = false;
    };
  }, [loading, refresh, userId]);

  // Signed-out state is derived, not stored — avoids a cascading render.
  const current = session ? (entitlement ?? NO_ENTITLEMENT) : NO_ENTITLEMENT;

  return {
    session,
    user: session?.user ?? null,
    signedIn: !!session,
    loading,
    entitlement: current,
    premium: current.active,
    checking,
    refresh,
    /** Re-read the session itself. Call after sign-in / sign-out. */
    refreshSession,
  };
}
