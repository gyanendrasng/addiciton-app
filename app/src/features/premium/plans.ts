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
  id: 'weekly' | 'monthly' | 'yearly' | 'yearly_offer';
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
    disclosure: '$9.99 per week, billed weekly. Renews until you cancel.',
    recurring: true,
  },
  {
    id: 'monthly',
    productId: 'curb.premium.monthly',
    name: 'Monthly',
    price: '$14.99',
    period: '/month',
    sub: 'Cancel whenever you want',
    disclosure: '$14.99 per month, billed monthly. Renews until you cancel.',
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
    disclosure: '$59.99 per year, billed yearly. Renews until you cancel.',
    recurring: true,
  },
];

/**
 * The come-back offer.
 *
 * Shown when someone reaches the wall, leaves without subscribing, and comes
 * back — a real signal, not a timer we invented. It then runs for a real 12
 * hours (see offer-window.ts): the countdown is on the *discount*, never on
 * the standard price, and when it lapses the price genuinely returns to
 * $59.99. A clock that silently restarts on every visit is the dishonest
 * version of this, and it's the version App Review objects to.
 *
 * It needs a matching promotional/introductory offer in App Store Connect and
 * Google Play, wired through RevenueCat — a discounted price shown in-app with
 * no real offer behind it fails review.
 */
export const OFFER_PLAN: Plan = {
  id: 'yearly_offer',
  productId: 'curb.premium.yearly.offer',
  name: 'Yearly',
  price: '$29.99',
  period: '/year',
  sub: 'Half the usual $59.99 — about $2.50 a month',
  badge: 'SAVE 83%',
  disclosure: '$29.99 for the first year, then $59.99 per year. Cancel any time.',
  recurring: true,
};

/** How many times the wall must have been seen before the offer appears. */
export const OFFER_AFTER_VIEWS = 2;

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
