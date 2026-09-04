/**
 * RevenueCat reconciliation.
 *
 * The webhook handler does NOT try to reason about the 21 event types. Per
 * RevenueCat's own guidance ("we recommend calling the REST API after
 * receiving any webhook… simpler than writing custom logic to handle each
 * webhook event") we treat every event as a bare "something changed for this
 * customer" ping and re-read canonical state. That is what makes TRANSFER,
 * TEMPORARY_ENTITLEMENT_GRANT and any event type RevenueCat adds later correct
 * for free.
 *
 * When the REST key isn't configured we fall back to the event payload, using
 * the corrected mapping in `applyEventDirectly` — notably: CANCELLATION,
 * SUBSCRIPTION_PAUSED and BILLING_ISSUE must NOT revoke. EXPIRATION is the only
 * revoke trigger.
 */
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { entitlement, revenuecatEvent, user } from '@/db/schema';
import { upsertEntitlement } from './entitlements';

/** The entitlement identifier configured in the RevenueCat dashboard. */
const ENTITLEMENT_ID = process.env.REVENUECAT_ENTITLEMENT_ID ?? 'premium';

/** Display-only details the REST endpoint doesn't return. */
export type Hint = {
  productId?: string | null;
  store?: string | null;
  willRenew?: boolean;
};

type ActiveEntitlementsResponse = {
  items?: { entitlement_id?: string; expires_at?: number | string | null }[];
};

/**
 * Our Better Auth user id is what the app sets as the RevenueCat App User ID.
 * Purchases made before sign-in carry a `$RCAnonymousID:…` instead, which we
 * can only resolve once it has been recorded against a user.
 */
export async function resolveUserId(appUserId?: string | null): Promise<string | null> {
  if (!appUserId) return null;

  const [direct] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, appUserId))
    .limit(1);
  if (direct) return direct.id;

  const [byRc] = await db
    .select({ userId: entitlement.userId })
    .from(entitlement)
    .where(eq(entitlement.revenuecatId, appUserId))
    .limit(1);
  return byRc?.userId ?? null;
}

function restConfigured(): boolean {
  return !!(process.env.REVENUECAT_API_KEY?.trim() && process.env.REVENUECAT_PROJECT_ID?.trim());
}

/**
 * Read the customer's active entitlements from RevenueCat.
 *
 * v2, not v1: `GET /v1/subscribers/{id}` is get-or-create and would silently
 * create a customer record for an id that doesn't exist. Requires a V2-version
 * secret key with `customer_information:customers:read`.
 */
/** Upstream failure, carrying the status so it reaches the webhook response. */
export class RestError extends Error {
  constructor(readonly status: number, readonly body: string) {
    super(`RevenueCat REST ${status}: ${body}`);
    this.name = 'RestError';
  }
}

async function fetchActiveEntitlements(appUserId: string): Promise<
  { active: boolean; expiresAt: Date | null } | null
> {
  // Trimmed: pasting into a dashboard env field commonly carries a trailing
  // newline or wrapping quotes, which RevenueCat rejects as "Invalid API key"
  // while the value looks correct on screen.
  const project = (process.env.REVENUECAT_PROJECT_ID as string).trim();
  const key = (process.env.REVENUECAT_API_KEY as string).trim().replace(/^["']|["']$/g, '');
  // App User IDs can contain `$` and `:` ($RCAnonymousID:…) — must be encoded.
  const url =
    `https://api.revenuecat.com/v2/projects/${encodeURIComponent(project)}` +
    `/customers/${encodeURIComponent(appUserId)}/active_entitlements`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (res.status === 404) return { active: false, expiresAt: null }; // no such customer
  if (!res.ok) {
    const body = await res.text();
    console.error(`[revenuecat] ${res.status} on active_entitlements: ${body}`);
    if (res.status === 401) {
      // Shape only -- never the key itself. Distinguishes "wrong key" from
      // "empty/truncated env var", which look identical from the 401 alone.
      console.error(
        `[revenuecat] key len=${key.length} prefix=${key.slice(0, 3)} project=${project}`,
      );
    }
    // Carries the upstream status so the 500 we answer with names the cause.
    // Only RevenueCat sees it: the route rejects anything without the secret.
    throw new RestError(res.status, body.slice(0, 200));
  }

  const body = (await res.json()) as ActiveEntitlementsResponse;
  const match = (body.items ?? []).find((i) => i.entitlement_id === ENTITLEMENT_ID);
  if (!match) return { active: false, expiresAt: null };

  // `expires_at` is null for lifetime / non-expiring grants.
  const raw = match.expires_at;
  const expiresAt =
    raw === null || raw === undefined
      ? null
      : new Date(typeof raw === 'number' ? raw : Date.parse(raw));
  return { active: true, expiresAt };
}

/** Re-read one customer from RevenueCat and write the result to our cache. */
export async function resyncFromRevenueCat(appUserId: string, hint: Hint = {}) {
  const userId = await resolveUserId(appUserId);
  // Unknown ids are expected — a purchase can happen before sign-in.
  if (!userId) return;

  const state = await fetchActiveEntitlements(appUserId);
  // Throw rather than return. A silent return answered the webhook 200, which
  // RevenueCat reads as delivered and never retries -- and a promotional grant
  // has no "next event" to retry with, so the entitlement was simply lost. The
  // route turns this into a 500, which releases the idempotency claim and buys
  // five more attempts.
  if (!state) throw new Error(`active_entitlements unavailable for ${appUserId}`);

  const isLifetime = state.active && state.expiresAt === null;
  await upsertEntitlement(userId, {
    active: state.active,
    productId: hint.productId ?? null,
    store: hint.store ?? null,
    expiresAt: state.expiresAt,
    willRenew: state.active ? (hint.willRenew ?? !isLifetime) : false,
    isLifetime,
    revenuecatId: appUserId,
  });
}

/**
 * Fallback used only when no REST key is configured.
 *
 * Corrected mapping (RevenueCat docs):
 *   grant   — INITIAL_PURCHASE, RENEWAL, NON_RENEWING_PURCHASE, UNCANCELLATION,
 *             SUBSCRIPTION_EXTENDED, PRODUCT_CHANGE, REFUND_REVERSED,
 *             TEMPORARY_ENTITLEMENT_GRANT
 *   revoke  — EXPIRATION only
 *   ignore  — CANCELLATION (auto-renew off, access continues), BILLING_ISSUE
 *             (not expired yet), SUBSCRIPTION_PAUSED (revoke arrives later as
 *             EXPIRATION), TEST, and anything unrecognised
 *
 * There is no REFUND event type: a refund surfaces as CANCELLATION with a
 * `cancel_reason`, then an EXPIRATION.
 */
const GRANTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'NON_RENEWING_PURCHASE',
  'UNCANCELLATION',
  'SUBSCRIPTION_EXTENDED',
  'PRODUCT_CHANGE',
  'REFUND_REVERSED',
  'TEMPORARY_ENTITLEMENT_GRANT',
]);

export async function applyEventDirectly(
  userId: string,
  event: {
    type: string;
    product_id?: string | null;
    new_product_id?: string | null;
    store?: string | null;
    expiration_at_ms?: number | null;
    period_type?: string | null;
  },
  appUserId: string | null,
) {
  const productId = event.new_product_id ?? event.product_id ?? null;

  if (GRANTS.has(event.type)) {
    const isLifetime = event.period_type === 'LIFETIME' || !event.expiration_at_ms;
    await upsertEntitlement(userId, {
      active: true,
      productId,
      store: event.store ?? null,
      expiresAt: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
      willRenew: event.type !== 'NON_RENEWING_PURCHASE' && !isLifetime,
      isLifetime,
      revenuecatId: appUserId,
    });
    return;
  }

  if (event.type === 'CANCELLATION') {
    // Auto-renew is off but paid-through time remains. Keep access; only flip
    // the renewal flag so the UI can say "access until <date>".
    await upsertEntitlement(userId, {
      active: !!event.expiration_at_ms && event.expiration_at_ms > Date.now(),
      productId,
      store: event.store ?? null,
      expiresAt: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
      willRenew: false,
      isLifetime: false,
      revenuecatId: appUserId,
    });
    return;
  }

  if (event.type === 'EXPIRATION') {
    await upsertEntitlement(userId, {
      active: false,
      productId,
      store: event.store ?? null,
      expiresAt: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
      willRenew: false,
      isLifetime: false,
      revenuecatId: appUserId,
    });
  }
  // Everything else is acknowledged without a write.
}

/**
 * Idempotency. RevenueCat retries a failed delivery up to 5 times reusing the
 * same `event.id`, so claiming the id makes replays no-ops.
 * Returns false if this event was already handled.
 */
export async function claimEvent(eventId: string): Promise<boolean> {
  const claimed = await db
    .insert(revenuecatEvent)
    .values({ id: eventId })
    .onConflictDoNothing()
    .returning({ id: revenuecatEvent.id });
  return claimed.length > 0;
}

/** Undo a claim so a retried delivery can do the work. */
export async function releaseEvent(eventId: string): Promise<void> {
  await db.delete(revenuecatEvent).where(eq(revenuecatEvent.id, eventId));
}

export { restConfigured };
