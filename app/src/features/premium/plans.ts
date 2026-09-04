/**
 * Subscription plans.
 *
 * Curb has **no free tier and no trial** — the paywall is a hard wall, by
 * decision. So there is no trial timeline, no "free for 7 days", and no copy
 * anywhere that implies either.
 *
 * `productId` must match the identifiers configured in App Store Connect,
 * Google Play Console and RevenueCat. Prices here are the fallback shown before
 * the store's localised price arrives — Apple 3.1.2 requires the real price and
 * duration be shown, so once RevenueCat is wired the store price wins.
 */
export type Plan = {
  id: 'weekly' | 'monthly' | 'yearly';
  /** RevenueCat / store product identifier */
  productId: string;
  name: string;
  /** fallback display price; replaced by the store's localised string */
  price: string;
  period: string;
  sub: string;
  badge?: string;
  /** "per week" / "per month" / "per year" — used to rebuild the disclosure */
  per: string;
  /** "billed weekly" / "billed monthly" / "billed yearly" */
  billed: string;
  recurring: boolean;
};

/**
 * Order: shortest commitment first, best value last.
 * The eye lands on weekly's $9.99 and then reads down to $59.99 for a whole
 * year, which is the comparison that sells the year. Leading with the year
 * makes it the expensive-looking number instead of the cheap one.
 */
export const PLANS: Plan[] = [
  {
    id: 'weekly',
    productId: 'curb.premium.weekly',
    name: 'Weekly',
    price: '$9.99',
    period: '/week',
    sub: 'Try it a week at a time',
    per: 'per week',
    billed: 'billed weekly',
    recurring: true,
  },
  {
    id: 'monthly',
    productId: 'curb.premium.monthly',
    name: 'Monthly',
    price: '$14.99',
    period: '/month',
    sub: 'Cancel whenever you want',
    per: 'per month',
    billed: 'billed monthly',
    recurring: true,
  },
  {
    id: 'yearly',
    productId: 'curb.premium.yearly',
    name: 'Yearly',
    price: '$59.99',
    period: '/year',
    // $59.99 ÷ 12 = $5.00; against $14.99/mo that's 67% off, computed not guessed.
    sub: 'Works out to $5 a month',
    badge: 'SAVE 67%',
    per: 'per year',
    billed: 'billed yearly',
    recurring: true,
  },
];

/** What the money buys. Concrete features, no promised outcomes. */
export const BENEFITS = [
  'A separate streak for every habit you’re quitting',
  'The urge toolkit — breathing, a 2-minute delay, your reasons, games',
  'A slip log that resets the streak without the shame, and an undo',
  'Milestones, calendar history and mood trends',
  'What you’ve saved, and what stopping is doing for you',
];

export const TERMS_URL = 'https://joincurb.app/terms';
export const PRIVACY_URL = 'https://joincurb.app/privacy';

/**
 * The Apple 3.1.2 disclosure, built from the *store's* price.
 *
 * The prices in this file are USD and exist only as a placeholder before
 * StoreKit answers. Rendering them to someone outside the US states a price in
 * the wrong currency, which is precisely what 3.1.2 forbids — and the purchase
 * sheet would then quote a different number, which is how you lose someone's
 * trust at the exact moment you ask for money.
 *
 * With no live price we say the cadence and omit the amount. A missing number
 * is recoverable; a wrong one is not.
 */
export function disclosureFor(plan: Plan, storePrice?: string): string {
  if (!storePrice) return `${plan.billed[0].toUpperCase()}${plan.billed.slice(1)}. Renews until you cancel.`;
  return `${storePrice} ${plan.per}, ${plan.billed}. Renews until you cancel.`;
}
