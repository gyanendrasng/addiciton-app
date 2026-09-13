/**
 * The analytics preference.
 *
 * Off by default and only ever turned on by the user, in Settings. Two things
 * have to agree for anything to be sent: the seam in `lib/analytics.ts` and
 * PostHog's own opt-out flag, because the SDK captures lifecycle events on its
 * own schedule and would otherwise report before the seam is consulted.
 *
 * `website/src/app/privacy/page.tsx` §3c promises this control by name — "you
 * can turn analytics off in Settings" — so the two move together.
 */
import { getSetting, setSetting } from '@/db/repo/settings';
import { setAnalyticsConsent, setAnalyticsOptOut } from '@/lib/analytics';

export const ANALYTICS_KEY = 'analytics.enabled';

/**
 * Apply the stored preference. Called once, after the database opens.
 *
 * No stored value means the user has not been asked yet — the consent step is
 * the last screen of onboarding — and that is `pending`, not `out`: the seam
 * holds onboarding events until the answer instead of dropping them.
 */
export async function loadAnalyticsPref() {
  const on = await getSetting<boolean>(ANALYTICS_KEY);
  setAnalyticsConsent(on === true ? 'in' : on === false ? 'out' : 'pending');
}

/** Persist and apply in one step, so the two can never drift. */
export async function setAnalyticsPref(on: boolean) {
  await setSetting(ANALYTICS_KEY, on);
  setAnalyticsOptOut(!on);
}
