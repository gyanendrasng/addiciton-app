import { timingSafeEqual } from 'node:crypto';

import { NextResponse } from 'next/server';

import {
  applyEventDirectly,
  claimEvent,
  releaseEvent,
  resolveUserId,
  restConfigured,
  resyncFromRevenueCat,
  type Hint,
} from '@/lib/revenuecat';

export const runtime = 'nodejs';

/**
 * POST /api/revenuecat/webhook
 *
 * RevenueCat pings us whenever a subscription changes. We do NOT branch on the
 * 21 event types — we treat the ping as "this customer changed" and re-read
 * canonical state from RevenueCat's REST API (their own recommendation). The
 * result lands in one `entitlement` row so every device the user signs in on
 * agrees about premium.
 *
 * Auth: the shared secret configured in the RevenueCat dashboard arrives in the
 * `Authorization` header. Compared in constant time, with a length guard —
 * `timingSafeEqual` throws RangeError on unequal lengths, which would turn a
 * truncated secret into a 500 and five pointless retries.
 *
 * Any non-2xx response counts as a delivery failure and RevenueCat retries up
 * to 5 times, which is what we want when a sync genuinely failed — so the work
 * runs inline and a failure answers 500 (releasing the idempotency claim so the
 * retry can do the work).
 */
type RevenueCatEvent = {
  type?: string;
  id?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[] | null;
  product_id?: string | null;
  new_product_id?: string | null;
  store?: string | null;
  expiration_at_ms?: number | null;
  period_type?: string | null;
  // TRANSFER only — and it carries NO app_user_id.
  transferred_from?: string[] | null;
  transferred_to?: string[] | null;
};

function authorized(request: Request): boolean {
  const expected = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!expected) return false;
  const got = request.headers.get('authorization') ?? '';
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  // Length check first: timingSafeEqual throws on a mismatch.
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Which customers this event touches.
 *
 * TRANSFER is the odd one out: no `app_user_id`, two arrays instead, and it is
 * "sent only for the destination user" — so both sides must be recomputed or
 * the source keeps premium it no longer owns.
 */
function affectedCustomers(event: RevenueCatEvent): string[] {
  if (event.type === 'TRANSFER') {
    return [...(event.transferred_from ?? []), ...(event.transferred_to ?? [])];
  }
  const ids = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])];
  return [...new Set(ids.filter((id): id is string => !!id))];
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: { event?: RevenueCatEvent };
  try {
    payload = (await request.json()) as { event?: RevenueCatEvent };
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const event = payload.event;
  if (!event?.type) {
    return NextResponse.json({ error: 'missing event' }, { status: 400 });
  }
  if (event.type === 'TEST') {
    return NextResponse.json({ ok: true, note: 'test event' });
  }

  const customers = affectedCustomers(event);
  if (customers.length === 0) {
    return NextResponse.json({ ok: true, note: 'no customer on event' });
  }

  // Retries reuse event.id, so claiming it makes replays no-ops. Events with
  // no id (shouldn't happen) are processed rather than dropped.
  if (event.id && !(await claimEvent(event.id))) {
    return NextResponse.json({ ok: true, note: 'already handled' });
  }

  const hint: Hint = {
    productId: event.new_product_id ?? event.product_id ?? null,
    store: event.store ?? null,
    willRenew: event.type !== 'CANCELLATION' && event.type !== 'NON_RENEWING_PURCHASE',
  };

  // A dashboard-granted promotional entitlement is NOT reported by v2
  // `active_entitlements`, so re-reading canonical state right after one is
  // granted comes back empty and revokes it. Verified against a real grant:
  // RevenueCat showed "Active - unlimited duration" while the REST read
  // returned no `premium` item, and the row was written active:false. For
  // these the event payload is the only source that knows, and it is complete
  // -- NON_RENEWING_PURCHASE with entitlement_id, store and period_type
  // PROMOTIONAL. Revocation arrives as EXPIRATION on the same path, so access
  // is still withdrawn correctly.
  const promotional = (event.store ?? '').toUpperCase() === 'PROMOTIONAL';

  try {
    for (const appUserId of customers) {
      if (restConfigured() && !promotional) {
        await resyncFromRevenueCat(appUserId, hint);
      } else {
        // No REST key configured, or a promotional grant REST cannot see.
        const userId = await resolveUserId(appUserId);
        if (userId) {
          await applyEventDirectly(userId, { ...event, type: event.type as string }, appUserId);
        }
      }
    }
  } catch (e) {
    console.error('[revenuecat] webhook sync failed', e);
    // Let the retry re-do the work rather than stranding the claim.
    if (event.id) await releaseEvent(event.id).catch(() => {});
    // The reason travels in the body so it shows up in RevenueCat's delivery
    // log. Safe: this route is unreachable without the shared secret.
    const reason = e instanceof Error ? e.message : 'sync failed';
    return NextResponse.json({ error: reason }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
