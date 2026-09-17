import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getEntitlement } from '@/lib/entitlements';
import { claimForUser } from '@/lib/revenuecat';

export const runtime = 'nodejs';

/**
 * POST /api/entitlement/sync — "I've just signed in; find my purchase."
 *
 * The app's wall comes before its sign-in, so the first purchase is made
 * under RevenueCat's anonymous App User ID. On sign-in the SDK's `logIn`
 * merges that customer into the account, but no webhook announces a merge —
 * the next one arrives at renewal, weeks away. So the app calls this right
 * after `logIn`, and we re-read RevenueCat for the signed-in user (and, as a
 * fallback, for the anonymous id the purchase was made under) and record the
 * result. Same code path the webhook uses; nothing here trusts the client's
 * word for whether they paid.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let anonymousId: string | null = null;
  try {
    const body = (await request.json()) as { anonymousId?: unknown };
    if (typeof body.anonymousId === 'string' && /^\$RCAnonymousID:[\w-]{1,128}$/.test(body.anonymousId)) {
      anonymousId = body.anonymousId;
    }
  } catch {
    // No body is fine: the user id alone is usually enough.
  }

  try {
    await claimForUser(session.user.id, anonymousId);
  } catch (e) {
    console.error('[revenuecat] sync failed', e);
    return NextResponse.json({ error: 'sync failed' }, { status: 502 });
  }

  const entitlement = await getEntitlement(session.user.id);
  return NextResponse.json({ ...entitlement, signedIn: true }, { headers: { 'Cache-Control': 'no-store' } });
}
