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
  id: 'yearly' | 'monthly' | 'lifetime';
  /** RevenueCat / store product identifier */
  productId: string;
  name: string;
  /** fallback display price; replaced by the store's localised string */
  price: string;
  period: string;
  sub: string;
  badge?: string;
  /** the exact disclosure shown under the button */
  disclosure: string;
  recurring: boolean;
};

export const PLANS: Plan[] = [
  {
    id: 'yearly',
    productId: 'curb.premium.yearly',
    name: 'Yearly',
    price: '$29.99',
    period: '/year',
    sub: 'Works out to $2.50 a month',
    badge: 'SAVE 58%',
    disclosure: '$29.99 per year, billed yearly. Renews until you cancel.',
    recurring: true,
  },
  {
    id: 'monthly',
    productId: 'curb.premium.monthly',
    name: 'Monthly',
    price: '$5.99',
    period: '/month',
    sub: 'Cancel whenever you want',
    disclosure: '$5.99 per month, billed monthly. Renews until you cancel.',
    recurring: true,
  },
  {
    id: 'lifetime',
    productId: 'curb.premium.lifetime',
    name: 'Lifetime',
    price: '$79.99',
    period: ' once',
    sub: 'One payment, yours for good',
    badge: 'BEST VALUE',
    disclosure: '$79.99 once. No subscription, nothing to cancel.',
    recurring: false,
  },
];

/** What the money buys. Concrete features, no promised outcomes. */
export const BENEFITS = [
  'A separate streak for every habit you’re quitting',
  'The urge toolkit — breathing, a 2-minute delay, your reasons, games',
  'A slip log that resets the streak without the shame, and an undo',
  'Milestones, calendar history and mood trends',
  'Daily reminders, and everything works offline',
];

export const TERMS_URL = 'https://joincurb.app/terms';
export const PRIVACY_URL = 'https://joincurb.app/privacy';
