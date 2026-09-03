import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getEntitlement, NO_ENTITLEMENT } from '@/lib/entitlements';

export const runtime = 'nodejs';

/**
 * GET /api/entitlement — "is the signed-in user premium?"
 *
 * The app calls this on launch and after a purchase. It is the single source of
 * truth the client trusts for cross-device premium.
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ ...NO_ENTITLEMENT, signedIn: false }, { status: 200 });
  }
  const entitlement = await getEntitlement(session.user.id);
  return NextResponse.json(
    { ...entitlement, signedIn: true },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
