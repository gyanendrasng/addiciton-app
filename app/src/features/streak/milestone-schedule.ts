import { getProfile } from '@/db/repo/profile';
import { activeRelapseTimes } from '@/db/repo/relapses';
import { scheduleMilestoneNotifications } from '@/features/notifications';
import { now } from '@/lib/clock';
import { streakStart } from '@/lib/streak';
import { TIERS } from './tiers';

/** Recompute the streak start from the database and reschedule milestone notifications. */
export async function rescheduleMilestones() {
  const profile = await getProfile();
  if (!profile) return;
  const start = streakStart(profile.quitStartedAt, await activeRelapseTimes());
  try {
    await scheduleMilestoneNotifications(start, TIERS, now());
  } catch (e) {
    if (__DEV__) console.warn('[milestones] schedule failed', e);
  }
}
