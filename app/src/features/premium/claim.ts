/**
 * A purchase made before there is an account, and how it finds its owner.
 *
 * The wall comes before sign-in, so the first purchase happens under
 * RevenueCat's anonymous App User ID. That is fine for the store — Apple and
 * Play tie the subscription to the store account, and Restore always works —
 * but our server only knows entitlements by Better Auth user id, so until the
 * person signs in there is nothing on the server to say they've paid.
 *
 * The gap is bridged in three moves:
 *
 *  1. `unlockFromStore()` — the moment the store confirms, the local premium
 *     mirror goes true and the anonymous id is remembered as a *pending
 *     claim*. The gate opens on the mirror, so the app is usable right away.
 *  2. On sign-in, `configurePurchases(userId)` calls RevenueCat `logIn`, which
 *     merges the anonymous customer into the account. Then `claimEntitlement()`
 *     asks our server to re-read RevenueCat for this user (and, as a fallback,
 *     for the anonymous id) and write the entitlement row.
 *  3. While a claim is pending, a "not premium" from the server is not
 *     believed — the server simply hasn't been told yet. The store is asked
 *     instead, and only a definite "no" from the store revokes.
 *
 * `ACCOUNT_LINKED_KEY` is the local mirror of "this device has signed in",
 * so a paying user launching offline is never sent to the sign-in wall by a
 * session fetch that failed.
 */
import { AUTH_BASE_URL, authClient } from '@/lib/auth-client';
import { getSetting, setSetting } from '@/db/repo/settings';
import { setPremium } from '@/db/repo/profile';
import { currentAppUserId } from './purchases';

/** The anonymous RevenueCat id a purchase was made under, until the server has it. */
export const PENDING_CLAIM_KEY = 'purchase.pending_claim';
/** True once a session has been seen on this device; cleared on sign-out. */
export const ACCOUNT_LINKED_KEY = 'account.linked';

/**
 * The store said yes. Open the app now, and remember to tell the server whose
 * purchase this is once there is a "whose".
 */
export async function unlockFromStore() {
  await setPremium(true);
  const id = await currentAppUserId();
  await setSetting(PENDING_CLAIM_KEY, id ?? true);
}

export async function pendingClaim(): Promise<string | true | null> {
  return getSetting<string | true>(PENDING_CLAIM_KEY);
}

export async function clearPendingClaim() {
  await setSetting(PENDING_CLAIM_KEY, null);
}

/**
 * Ask the server to attach this user's RevenueCat entitlement to their
 * account. Called after `logIn` has merged the anonymous customer in. Returns
 * whether the server now sees an active entitlement; null when it couldn't be
 * asked (offline, or the endpoint isn't deployed yet) — in which case the
 * claim stays pending and is retried on the next session refresh.
 */
export async function claimEntitlement(): Promise<boolean | null> {
  try {
    const pending = await pendingClaim();
    const cookie = await authClient.getCookie();
    const res = await fetch(`${AUTH_BASE_URL}/api/entitlement/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      credentials: 'omit',
      body: JSON.stringify({ anonymousId: typeof pending === 'string' ? pending : null }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { active?: boolean };
    return !!data.active;
  } catch {
    return null;
  }
}
