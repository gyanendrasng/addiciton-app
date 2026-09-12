import * as StoreReview from 'expo-store-review';

import { getSetting, setSetting } from '@/db/repo/settings';
import { latestActiveRelapse } from '@/db/repo/relapses';
import { track } from '@/lib/analytics';
import { dayKey, now } from '@/lib/clock';

/**
 * The App Store rating prompt.
 *
 * It only ever fires after the app has visibly done its job — a milestone or a
 * survived urge — never on onboarding, never from a button, and never on a day
 * the person has logged a lapse. iOS shows the sheet at most three times a year
 * on its own; the gate here keeps us from even asking more than once a season,
 * so those three chances land on good days.
 */
const ASKED_AT = 'review.askedAt';
const COOLDOWN_MS = 90 * 86_400_000;
const SETTLE_MS = 600;

export type ReviewMoment = 'milestone' | 'urge_survived';

export async function maybeAskForReview(moment: ReviewMoment) {
  try {
    if (!(await StoreReview.hasAction())) return;
    const askedAt = await getSetting<number>(ASKED_AT);
    if (askedAt && now() - askedAt < COOLDOWN_MS) return;
    const lapse = await latestActiveRelapse();
    if (lapse && dayKey(lapse.createdAt) === dayKey()) return;
    await setSetting(ASKED_AT, now());
    track('review_prompted', { moment });
    // Let the screen behind settle first so the sheet doesn't land mid-transition.
    setTimeout(() => {
      StoreReview.requestReview().catch(() => {});
    }, SETTLE_MS);
  } catch {
    // The prompt is a nice-to-have; nothing here may surface to the user.
  }
}
