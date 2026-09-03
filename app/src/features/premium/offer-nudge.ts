/**
 * The come-back nudge.
 *
 * Someone reaches the wall and doesn't subscribe. Half an hour later, one
 * local notification tells them the year is half price. Tapping it opens the
 * paywall, which by then counts as a second visit and shows the $29.99 offer —
 * so the notification and the screen agree.
 *
 * Rules this follows, deliberately:
 *
 * - **Local only.** No push tokens, no server, nothing leaves the device. The
 *   scheduling happens on the phone from a timer.
 * - **Once, ever.** A discount that nags is an ad. If they ignore it, that was
 *   their answer.
 * - **Discreet copy.** These land on a lock screen other people can see. It
 *   says nothing about addiction, recovery, or what Curb is for — the same
 *   rule the daily reminders follow.
 * - **Never prompts for permission.** If notifications aren't already granted
 *   we skip it silently. Asking for notification access *on a paywall*, to
 *   send a discount, is the kind of thing that gets an app deleted.
 */
import * as Notifications from 'expo-notifications';

import { getSetting, setSetting } from '@/db/repo/settings';

export const OFFER_NOTIFICATION_ID = 'offer-discount';

/** Set once the nudge has been scheduled, so it can never fire twice. */
const SENT_KEY = 'offer.nudge.sent.v1';

/** How long after seeing the wall the nudge arrives. */
export const OFFER_DELAY_MINUTES = 30;

/**
 * Schedule the nudge, if it hasn't been scheduled before and notifications are
 * already allowed. Safe to call on every paywall mount.
 */
export async function scheduleOfferNudge(delaySeconds?: number): Promise<boolean> {
  if (await getSetting<boolean>(SENT_KEY)) return false;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return false;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: OFFER_NOTIFICATION_ID,
      content: {
        title: 'Half off your first year',
        body: '$29.99 instead of $59.99. It’s there whenever you want it.',
        sound: false,
        data: { route: '/paywall' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delaySeconds ?? OFFER_DELAY_MINUTES * 60,
        repeats: false,
        channelId: 'reminders',
      },
    });
    await setSetting(SENT_KEY, true);
    return true;
  } catch {
    // Scheduling can fail on a device with notifications disabled at the OS
    // level; the offer still appears in-app on the next visit.
    return false;
  }
}

/** Dev only: re-arm the nudge so it can be tested more than once. */
export async function resetOfferNudge() {
  await cancelOfferNudge();
  await setSetting(SENT_KEY, false);
}

/**
 * Drop the nudge. Called the moment someone subscribes — being offered a
 * discount on something you just bought is the worst version of this feature.
 */
export async function cancelOfferNudge() {
  try {
    await Notifications.cancelScheduledNotificationAsync(OFFER_NOTIFICATION_ID);
  } catch {
    // never scheduled — nothing to cancel
  }
  await setSetting(SENT_KEY, true);
}
