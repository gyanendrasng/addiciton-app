/**
 * Local reminder notifications.
 *
 * The onboarding copy promises exactly two nudges a day — a morning pledge and
 * an evening check-in — and nothing else. These are *local* notifications:
 * no server, no push tokens, no network. They work in Expo Go.
 *
 * iOS shows its permission sheet only ONCE per install. Never call
 * requestReminderPermission() speculatively — only from a deliberate tap.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const PERMISSION_KEY = 'notif.permission';
const SCHEDULED_KEY = 'notif.scheduled';

export const MORNING_HOUR = 8;
export const EVENING_HOUR = 21;

export type PermissionOutcome = 'granted' | 'denied' | 'undetermined';

/** Foreground presentation — a reminder should still be visible in-app. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Android requires an explicit channel or notifications post silently. */
async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Daily reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#31C983',
    sound: null,
    vibrationPattern: [0, 200],
  });
}

/** Current status without prompting. Safe to call on every launch. */
export async function getReminderPermission(): Promise<PermissionOutcome> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

/**
 * Ask the user. Only ever call this from an explicit "turn on reminders" tap —
 * once iOS records a denial, the sheet never appears again and recovery means
 * sending the user to Settings by hand.
 */
export async function requestReminderPermission(): Promise<PermissionOutcome> {
  await ensureAndroidChannel();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== 'granted' && existing.canAskAgain) {
    const asked = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: false, allowBadge: false },
    });
    status = asked.status;
  }

  const outcome: PermissionOutcome =
    status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
  await AsyncStorage.setItem(PERMISSION_KEY, outcome);
  return outcome;
}

/** What we last recorded, for UI that shouldn't hit the system API. */
export async function getStoredPermission(): Promise<PermissionOutcome | null> {
  return (await AsyncStorage.getItem(PERMISSION_KEY)) as PermissionOutcome | null;
}

/**
 * Schedule the two daily reminders. Idempotent: clears ours first so repeat
 * calls can't stack duplicates.
 */
export async function scheduleDailyReminders(
  morningHour = MORNING_HOUR,
  eveningHour = EVENING_HOUR,
): Promise<boolean> {
  if ((await getReminderPermission()) !== 'granted') return false;
  await ensureAndroidChannel();
  await cancelDailyReminders();

  await Notifications.scheduleNotificationAsync({
    identifier: 'reminder-morning',
    content: {
      title: 'Morning pledge',
      body: 'One line. Say what today looks like.',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: morningHour,
      minute: 0,
      channelId: 'reminders',
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: 'reminder-evening',
    content: {
      title: 'Evening check-in',
      body: 'How did it go? Keep the streak honest.',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: eveningHour,
      minute: 0,
      channelId: 'reminders',
    },
  });

  await AsyncStorage.setItem(
    SCHEDULED_KEY,
    JSON.stringify({ morningHour, eveningHour, at: Date.now() }),
  );
  return true;
}

export async function cancelDailyReminders() {
  await Promise.all(
    ['reminder-morning', 'reminder-evening'].map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );
  await AsyncStorage.removeItem(SCHEDULED_KEY);
}

const MILESTONE_PREFIX = 'milestone-';
const MAX_MILESTONE_SCHEDULES = 4; // iOS caps pending notifications at 64

export async function cancelMilestoneNotifications() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.identifier.startsWith(MILESTONE_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => undefined)),
  );
}

/**
 * Schedule the next few milestone moments as local notifications, timed from
 * the current streak start. Idempotent; silently no-op without permission.
 */
export async function scheduleMilestoneNotifications(
  streakStartMs: number,
  tiers: { days: number; name: string }[],
  nowMs = Date.now(),
): Promise<number> {
  if ((await getReminderPermission()) !== 'granted') return 0;
  await ensureAndroidChannel();
  await cancelMilestoneNotifications();
  const upcoming = tiers
    .map((t) => ({ ...t, at: streakStartMs + t.days * 86_400_000 }))
    .filter((t) => t.at > nowMs + 60_000)
    .slice(0, MAX_MILESTONE_SCHEDULES);
  for (const t of upcoming) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${MILESTONE_PREFIX}${t.days}`,
      content: {
        title: `${t.days} ${t.days === 1 ? 'day' : 'days'} clean — ${t.name}`,
        body: 'Open the app to collect it.',
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(t.at),
        channelId: 'reminders',
      },
    });
  }
  return upcoming.length;
}

/** Debug helper — what is actually queued right now. */
export async function listScheduled() {
  return Notifications.getAllScheduledNotificationsAsync();
}
