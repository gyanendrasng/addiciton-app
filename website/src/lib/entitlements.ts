import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { entitlement as entitlementTable } from '@/db/schema';

/**
 * Premium entitlements.
 *
 * RevenueCat is the source of truth for purchases; this table is a cache so the
 * app can ask ONE endpoint "is this user premium?" and get an answer that is
 * consistent across their devices.
 *
 * Deliberately minimal: no recovery data, no purchase amounts, no receipts.
 */
export type Entitlement = {
  active: boolean;
  productId: string | null;
  store: string | null;
  expiresAt: string | null;
  willRenew: boolean;
  isLifetime: boolean;
};

export const NO_ENTITLEMENT: Entitlement = {
  active: false,
  productId: null,
  store: null,
  expiresAt: null,
  willRenew: false,
  isLifetime: false,
};

export async function getEntitlement(userId: string): Promise<Entitlement> {
  const [row] = await db
    .select()
    .from(entitlementTable)
    .where(eq(entitlementTable.userId, userId))
    .limit(1);
  if (!row) return NO_ENTITLEMENT;

  // A subscription can lapse between webhooks; never trust `active` alone.
  const notExpired = row.isLifetime || !row.expiresAt || row.expiresAt.getTime() > Date.now();

  return {
    active: row.active && notExpired,
    productId: row.productId,
    store: row.store,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    willRenew: row.willRenew,
    isLifetime: row.isLifetime,
  };
}

export async function upsertEntitlement(
  userId: string,
  e: {
    active: boolean;
    productId?: string | null;
    store?: string | null;
    expiresAt?: Date | null;
    willRenew?: boolean;
    isLifetime?: boolean;
    revenuecatId?: string | null;
  },
) {
  const values = {
    userId,
    active: e.active,
    productId: e.productId ?? null,
    store: e.store ?? null,
    expiresAt: e.expiresAt ?? null,
    willRenew: e.willRenew ?? false,
    isLifetime: e.isLifetime ?? false,
    revenuecatId: e.revenuecatId ?? null,
    updatedAt: new Date(),
  };

  await db
    .insert(entitlementTable)
    .values(values)
    .onConflictDoUpdate({
      target: entitlementTable.userId,
      set: {
        active: values.active,
        productId: values.productId,
        store: values.store,
        expiresAt: values.expiresAt,
        willRenew: values.willRenew,
        isLifetime: values.isLifetime,
        // Never clear a known RevenueCat id with a null from a later event.
        ...(values.revenuecatId ? { revenuecatId: values.revenuecatId } : {}),
        updatedAt: values.updatedAt,
      },
    });
}
