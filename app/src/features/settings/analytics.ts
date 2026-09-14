/**
 * The two analytics preferences.
 *
 * `PRODUCT_KEY` — product analytics, on by default, a switch in Settings.
 * `ANALYTICS_KEY` — progress data, off until the person says yes in the
 * onboarding ask or Settings. Both are applied to the seam in
 * `lib/analytics.ts`, which is the only thing that decides what leaves.
 *
 * `website/src/app/privacy/page.tsx` §3c promises both controls by name, so
 * the three move together.
 */
import { getSetting, setSetting } from '@/db/repo/settings';
import { setAnalyticsConsent, setAnalyticsOptOut, setProductAnalytics } from '@/lib/analytics';

export const ANALYTICS_KEY = 'analytics.enabled';
export const PRODUCT_KEY = 'analytics.product.enabled';

/**
 * Apply the stored preference. Called once, after the database opens.
 *
 * No stored value means the user has not been asked yet — the consent step is
 * the last screen of onboarding — and that is `pending`, not `out`: the seam
 * holds onboarding events until the answer instead of dropping them.
 */
export async function loadAnalyticsPref() {
  const product = await getSetting<boolean>(PRODUCT_KEY);
  setProductAnalytics(product !== false);
  const on = await getSetting<boolean>(ANALYTICS_KEY);
  setAnalyticsConsent(on === true ? 'in' : on === false ? 'out' : 'pending');
}

/** Persist and apply in one step, so the two can never drift. */
export async function setAnalyticsPref(on: boolean) {
  await setSetting(ANALYTICS_KEY, on);
  setAnalyticsOptOut(!on);
}

export async function setProductAnalyticsPref(on: boolean) {
  await setSetting(PRODUCT_KEY, on);
  setProductAnalytics(on);
}
