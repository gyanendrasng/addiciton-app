/**
 * The hour the user said urges hit hardest.
 *
 * Onboarding asks "When do urges hit hardest?" and the plan screen promises
 * "Urge toolkit — tuned for late at night". Until now the app collected that
 * answer and did nothing with it, which made the promise false. Two places use
 * it now: a nudge scheduled just before that window, and the urge screen,
 * which leads with the user's own trigger instead of a generic prompt.
 */
import * as Notifications from 'expo-notifications';

export type TriggerId = 'night' | 'bored' | 'stressed' | 'lonely';

/** Indexes match the `trigger` question's options, in order. */
const BY_INDEX: TriggerId[] = ['night', 'bored', 'stressed', 'lonely'];

export type TriggerInfo = {
  id: TriggerId;
  /** how the user described it, lower case, for use mid-sentence */
  label: string;
  /** the hour we nudge, just ahead of the window */
  hour: number;
  /** what the nudge says */
  nudge: string;
  /** what the urge screen opens with */
  opener: string;
};

const INFO: Record<TriggerId, TriggerInfo> = {
  night: {
    id: 'night',
    label: 'late at night',
    hour: 21,
    nudge: 'Late evening is your hardest stretch. Anything you want to do before it starts?',
    opener: 'Late nights are your hardest stretch. You already knew this one was coming.',
  },
  bored: {
    id: 'bored',
    label: 'when you’re bored',
    hour: 20,
    nudge: 'Empty evenings are where it usually starts. Line something up.',
    opener: 'Boredom is your trigger. This is the gap it usually fills.',
  },
  stressed: {
    id: 'stressed',
    label: 'when you’re stressed',
    hour: 18,
    nudge: 'End of the day is when stress usually lands. Two minutes of breathing beats it.',
    opener: 'Stress is your trigger. The urge is the old answer to it, not the only one.',
  },
  lonely: {
    id: 'lonely',
    label: 'when you’re lonely',
    hour: 20,
    nudge: 'Evenings alone are the hard ones. Message someone before the urge arrives.',
    opener: 'Loneliness is your trigger. The urge is asking for company, not for this.',
  },
};

export function triggerFrom(answers: Record<string, number[]>): TriggerInfo | null {
  const idx = answers['trigger']?.[0];
  if (idx == null) return null;
  const id = BY_INDEX[idx];
  return id ? INFO[id] : null;
}

export const TRIGGER_NOTIFICATION_ID = 'reminder-trigger';

/**
 * A nudge just before the window the user named.
 *
 * Deliberately one a day and silent, like the other two: the onboarding copy
 * promises a small number of nudges, and a recovery app that pesters gets
 * deleted. Cancelled and rescheduled whenever the answer changes.
 */
export async function scheduleTriggerNudge(
  answers: Record<string, number[]>,
): Promise<boolean> {
  await cancelTriggerNudge();
  const info = triggerFrom(answers);
  if (!info) return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return false;

  await Notifications.scheduleNotificationAsync({
    identifier: TRIGGER_NOTIFICATION_ID,
    content: { title: 'Your hard hour', body: info.nudge, sound: false },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: info.hour,
      minute: 0,
      channelId: 'reminders',
    },
  });
  return true;
}

export async function cancelTriggerNudge() {
  try {
    await Notifications.cancelScheduledNotificationAsync(TRIGGER_NOTIFICATION_ID);
  } catch {
    // never scheduled — nothing to cancel
  }
}
