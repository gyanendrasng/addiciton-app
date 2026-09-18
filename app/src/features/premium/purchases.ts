/**
 * RevenueCat, isolated behind a lazy import.
 *
 * `react-native-purchases` is a native module: importing it at the top of a
 * module crashes Expo Go, which is how this app is previewed day to day. So it
 * is required lazily inside a try/catch, and every function degrades to a
 * no-op when the native side isn't there. Expo Go keeps working exactly as it
 * did; the real SDK engages in a dev or production build.
 *
 * That isolation is also what lets `paywall.tsx` be written once, against this
 * interface, rather than being full of `__DEV__` branches.
 */
import { Platform } from 'react-native';

import { track } from '@/lib/analytics';
import { humanError } from '@/lib/errors';
import type { Plan } from './plans';

/**
 * Public SDK keys. These are *publishable* — they ship in the binary by
 * design and can only start purchases, never read or refund. The secret key
 * lives on the server (`REVENUECAT_API_KEY`) and never comes near the app.
 */
const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  default: '',
});

/** Must match the entitlement identifier in the RevenueCat dashboard. */
export const ENTITLEMENT_ID = 'premium';

type PurchasesModule = typeof import('react-native-purchases');

let cached: PurchasesModule | null | undefined;

/** null once we know the native module isn't available. */
function sdk(): PurchasesModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('react-native-purchases') as PurchasesModule;
  } catch {
    cached = null; // Expo Go, or web
  }
  return cached;
}

/** True when real purchases can happen. False in Expo Go and on web. */
export function purchasesAvailable(): boolean {
  return sdk() != null && !!API_KEY;
}

let configured = false;

/**
 * Start the SDK. Safe to call repeatedly.
 *
 * `appUserID` is the Better Auth user id — this is the line that makes an
 * entitlement follow the person rather than the device, and it's why user ids
 * are UUIDv4 (Apple and Play's server-to-server purchase tracking requires
 * that shape).
 */
/**
 * `logIn` calls are serialised and deduplicated: the session provider and the
 * account hook both ask for the same identity at sign-in, and two concurrent
 * `logIn`s for one id are at best wasted round trips.
 */
let identity: string | null = null;
let identifying: Promise<void> = Promise.resolve();

export async function configurePurchases(appUserID?: string | null) {
  const m = sdk();
  if (!m || !API_KEY) return;
  const Purchases = m.default;
  if (!configured) {
    if (__DEV__) Purchases.setLogLevel(m.LOG_LEVEL.WARN);
    // No account yet is the normal case now: the wall comes before sign-in,
    // so the SDK starts anonymous and `logIn` merges that customer into the
    // account later. With no id given it reuses whatever it last identified.
    Purchases.configure({ apiKey: API_KEY, appUserID: appUserID ?? null });
    configured = true;
    identity = appUserID ?? null;
    return;
  }
  // Already configured — just move the identity, once.
  if (!appUserID || appUserID === identity) return identifying;
  identity = appUserID;
  identifying = identifying.then(() => Purchases.logIn(appUserID)).then(() => undefined);
  return identifying;
}

/** RevenueCat's current App User ID — anonymous (`$RCAnonymousID:…`) before sign-in. */
export async function currentAppUserId(): Promise<string | null> {
  const m = sdk();
  if (!m || !configured) return null;
  try {
    return await m.default.getAppUserID();
  } catch {
    return null;
  }
}

/**
 * Does the store say this device's customer holds the entitlement right now?
 * null when there is no store to ask. This is the truth for a purchase the
 * server hasn't been told about yet.
 */
export async function storeEntitlementActive(): Promise<boolean | null> {
  const m = sdk();
  if (!m || !API_KEY) return null;
  try {
    const info = await m.default.getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return null;
  }
}

/**
 * Post the device's receipt under the current identity, and say whether the
 * entitlement is now active on it.
 *
 * This is how a purchase made before sign-in reaches an account RevenueCat
 * won't merge into. `logIn` merges an anonymous customer only into an account
 * with no history of its own; log into an account that has any — a lapsed
 * subscription, an old promotional grant — and the purchase stays on the
 * anonymous customer, and the account reads as unentitled. Re-posting the
 * receipt under the account moves the subscription across (the project's
 * transfer behaviour is "transfer to new App User ID"). Unlike a restore this
 * never shows an App Store sign-in sheet.
 */
export async function syncPurchasesToIdentity(): Promise<boolean | null> {
  const m = sdk();
  if (!m || !API_KEY) return null;
  try {
    const { customerInfo } = await m.default.syncPurchasesForResult();
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return null;
  }
}

/** Called on sign-out so the next buyer isn't attributed to the last user. */
export async function logOutPurchases() {
  const m = sdk();
  if (!m || !configured) return;
  try {
    // Already anonymous — nothing to drop, and `logOut` would throw.
    if (await m.default.isAnonymous()) return;
    await m.default.logOut();
    identity = null;
  } catch {
    // Nothing the user can do about it; the next configure sorts it out.
  }
}

export type StorePrice = {
  productId: string;
  /** localised, e.g. "$59.99" */
  price: string;
  period: string;
  /** numeric price in `currency`, for arithmetic the store can't do for us */
  amount: number;
  currency: string;
};

/**
 * Live, localised prices from the store.
 *
 * The strings in `plans.ts` are fallbacks for before this resolves — and they
 * are only correct in USD. Apple requires the *real* price be shown, so once
 * this returns, its values win.
 */
export async function fetchPrices(): Promise<Record<string, StorePrice>> {
  const m = sdk();
  if (!m || !API_KEY) return {};
  try {
    const offerings = await m.default.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    const out: Record<string, StorePrice> = {};
    for (const pkg of packages) {
      const p = pkg.product;
      // Keyed by package identifier so the paywall can look prices up the same
      // way on both stores.
      out[pkg.identifier] = {
        productId: p.identifier,
        price: p.priceString,
        period: p.subscriptionPeriod ?? '',
        amount: p.price,
        currency: p.currencyCode,
      };
    }
    return out;
  } catch {
    return {}; // offline, or offerings not configured yet
  }
}

export type PurchaseResult =
  | { ok: true }
  | { ok: false; cancelled: true }
  | { ok: false; cancelled?: false; message: string };

/** Buy a plan. Resolves once the store says the transaction completed. */
export async function purchasePlan(plan: Plan): Promise<PurchaseResult> {
  const m = sdk();
  if (!m || !API_KEY) {
    return {
      ok: false,
      message: __DEV__
        ? 'Purchases need a development build — they can’t run in Expo Go.'
        : 'Purchases aren’t available right now. Please try again.',
    };
  }
  try {
    const offerings = await m.default.getOfferings();
    // By package, not product: Play reports `subscriptionId:basePlanId` as the
    // product identifier, so a product-id match silently fails on Android.
    const pkg = offerings.current?.availablePackages.find(
      (p) => p.identifier === plan.packageId,
    );
    if (!pkg) {
      return { ok: false, message: 'That plan isn’t available right now.' };
    }
    const { customerInfo } = await m.default.purchasePackage(pkg);
    const active = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!active) {
      // The store completed but the entitlement didn't attach — a dashboard
      // misconfiguration, not something the user can fix by retrying.
      return { ok: false, message: 'Purchase went through but didn’t unlock. Contact support@joincurb.app.' };
    }
    track('purchase_completed', { plan: plan.id });
    return { ok: true };
  } catch (e) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err.userCancelled) return { ok: false, cancelled: true };
    return { ok: false, message: humanError(err, 'generic') };
  }
}

/**
 * Restore. Required by Apple 3.1.1 — a user reinstalling must be able to get
 * their subscription back without paying again.
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  const m = sdk();
  if (!m || !API_KEY) {
    return {
      ok: false,
      message: __DEV__
        ? 'Restore needs a development build.'
        : 'Restore isn’t available right now. Please try again.',
    };
  }
  try {
    const customerInfo = await m.default.restorePurchases();
    if (!customerInfo.entitlements.active[ENTITLEMENT_ID]) {
      return { ok: false, message: 'No previous purchase found on this account.' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: humanError(e, 'generic') };
  }
}
