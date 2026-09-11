/**
 * Apple's Screen Time API, isolated behind a lazy import.
 *
 * `react-native-device-activity` is a native module with three app extensions
 * behind it. Importing it at the top of a module crashes Expo Go and does
 * nothing on Android, so — exactly like `features/premium/purchases.ts` — it is
 * required lazily inside a try/catch and every function degrades to a no-op
 * when the native side isn't there. The rest of the app, and every Maestro
 * flow, keeps running on the Simulator, where Screen Time itself does not.
 *
 * Nothing here touches the server. Selections are opaque tokens Apple mints
 * per device; Qwyt never learns which apps were picked, only how many.
 */
import { Platform } from 'react-native';

import { hues, palette } from '@/theme/palette';

type DeviceActivity = typeof import('react-native-device-activity');

let cached: DeviceActivity | null | undefined;

/** null once we know the native module isn't available. */
export function sdk(): DeviceActivity | null {
  if (cached !== undefined) return cached;
  if (Platform.OS !== 'ios') {
    cached = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require('react-native-device-activity') as DeviceActivity;
    cached = m.isAvailable() ? m : null;
  } catch {
    cached = null; // Expo Go, or a build without the extensions
  }
  return cached;
}

/** True when Screen Time can actually be used on this device. */
export function shieldAvailable(): boolean {
  return sdk() != null;
}

export type ShieldAuth = 'unavailable' | 'notDetermined' | 'denied' | 'approved';

/**
 * Read, don't cache. The permission can be revoked in Settings while the app
 * is backgrounded, and the README warns the module can report `notDetermined`
 * right after a choice — callers treat that as "ask again", never as "off".
 */
export function authorizationStatus(): ShieldAuth {
  const m = sdk();
  if (!m) return 'unavailable';
  const s = m.getAuthorizationStatus();
  if (s === m.AuthorizationStatus.approved) return 'approved';
  if (s === m.AuthorizationStatus.denied) return 'denied';
  return 'notDetermined';
}

/**
 * Show Apple's permission sheet. Individual authorization — this is
 * self-management, never parental control, and the entitlement request to
 * Apple says the same.
 */
export async function requestAuthorization(): Promise<ShieldAuth> {
  const m = sdk();
  if (!m) return 'unavailable';
  try {
    await m.requestAuthorization('individual');
  } catch {
    // Denied, or the sheet was dismissed — the status read below says which.
  }
  return authorizationStatus();
}

/** The one selection Qwyt keeps. Everything blocks and unblocks by this id. */
export const SELECTION_ID = 'shield';

/** Names for the DeviceActivity schedules, so they can be stopped by name. */
const LOCK_ACTIVITY = 'shield-lock';
const WINDOW_ACTIVITY = 'shield-window';

export function saveSelection(token: string) {
  sdk()?.setFamilyActivitySelectionId({ id: SELECTION_ID, familyActivitySelection: token });
}

export function hasSelection(): boolean {
  return !!sdk()?.getFamilyActivitySelectionId(SELECTION_ID);
}

export function blockNow() {
  sdk()?.blockSelection({ activitySelectionId: SELECTION_ID }, 'curb');
}

export function unblockNow() {
  sdk()?.unblockSelection({ activitySelectionId: SELECTION_ID }, 'curb');
}

export function isShieldUp(): boolean {
  return sdk()?.isShieldActive() ?? false;
}

function components(d: Date) {
  return { hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() };
}

/**
 * Shield now, and have the extension lift it after `minutes` — with no help
 * from the app, which will be closed. The block is applied directly first so
 * the schedule only has to handle the end; if the schedule is refused (Apple
 * enforces a 15-minute minimum) the block still stands and the caller keeps a
 * fallback `until` to lift it on next foreground.
 */
export async function lockFor(minutes: number): Promise<boolean> {
  const m = sdk();
  if (!m) return false;
  const start = new Date();
  const end = new Date(start.getTime() + minutes * 60_000);
  m.stopMonitoring([LOCK_ACTIVITY]);
  blockNow();
  m.configureActions({
    activityName: LOCK_ACTIVITY,
    callbackName: 'intervalDidEnd',
    actions: [{ type: 'unblockSelection', familyActivitySelectionId: SELECTION_ID }],
  });
  try {
    await m.startMonitoring(
      LOCK_ACTIVITY,
      { intervalStart: components(start), intervalEnd: components(end), repeats: false },
      [],
    );
    return true;
  } catch {
    return false;
  }
}

export function endLock() {
  sdk()?.stopMonitoring([LOCK_ACTIVITY]);
  unblockNow();
}

/**
 * Shield every day from `startHour` for `hours`, lifted by the extension.
 *
 * Clamped to end by 23:59: whether a DeviceActivity interval may span
 * midnight is undocumented, and a schedule Apple silently drops is worse than
 * one that ends a little early. The on-device spike decides if this can go.
 */
export async function scheduleWindow(startHour: number, hours: number): Promise<boolean> {
  const m = sdk();
  if (!m) return false;
  const endHour = Math.min(23, startHour + hours);
  const endMinute = endHour === 23 && startHour + hours > 23 ? 59 : 0;
  m.stopMonitoring([WINDOW_ACTIVITY]);
  m.configureActions({
    activityName: WINDOW_ACTIVITY,
    callbackName: 'intervalDidStart',
    actions: [{ type: 'blockSelection', familyActivitySelectionId: SELECTION_ID }],
  });
  m.configureActions({
    activityName: WINDOW_ACTIVITY,
    callbackName: 'intervalDidEnd',
    actions: [{ type: 'unblockSelection', familyActivitySelectionId: SELECTION_ID }],
  });
  try {
    await m.startMonitoring(
      WINDOW_ACTIVITY,
      {
        intervalStart: { hour: startHour, minute: 0 },
        intervalEnd: { hour: endHour, minute: endMinute },
        repeats: true,
      },
      [],
    );
    return true;
  } catch {
    return false;
  }
}

export function clearWindow() {
  sdk()?.stopMonitoring([WINDOW_ACTIVITY]);
}

/**
 * Apple's adult-content filter. Safari only — links opened in other browsers
 * are the standard bypass, and the setup copy says so rather than implying
 * more.
 */
export function setAdultFilter(on: boolean) {
  const m = sdk();
  if (!m) return;
  if (on) m.setWebContentFilterPolicy({ type: 'auto' }, 'curb');
  else m.clearWebContentFilterPolicy('curb');
}

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { red: (n >> 16) & 255, green: (n >> 8) & 255, blue: n & 255 };
}

/**
 * What the shield says when someone hits it.
 *
 * This is the most-seen screen the feature has, and the only place a reason
 * written when clear-headed can reach someone who has already left the app.
 * Flat palette colours, no blur. "Open Qwyt" is the primary action because
 * the urge toolkit is the point; "Not now" just closes the shield — it does
 * not unblock, that takes the delay in the app.
 */
/** The words on the shield screen. Also drawn as a preview during setup, so keep them here. */
export const SHIELD_COPY = {
  title: 'Qwyt has this shielded.',
  fallback: 'You asked for this when you were clear-headed.',
  primary: 'Open Qwyt',
  secondary: 'Not now',
} as const;

export function configureAppearance(reason: string | null) {
  sdk()?.updateShield(
    {
      title: SHIELD_COPY.title,
      subtitle: reason ?? SHIELD_COPY.fallback,
      iconSystemName: 'shield.fill',
      iconTint: rgb(hues.urge.solid),
      backgroundColor: rgb(palette.bg),
      titleColor: rgb(palette.text),
      subtitleColor: rgb(palette.textDim),
      primaryButtonLabel: SHIELD_COPY.primary,
      primaryButtonBackgroundColor: rgb(palette.accent),
      primaryButtonLabelColor: rgb(palette.accentInk),
      secondaryButtonLabel: SHIELD_COPY.secondary,
      secondaryButtonLabelColor: rgb(palette.textDim),
    },
    {
      primary: { behavior: 'close', actions: [{ type: 'openApp' }] },
      secondary: { behavior: 'close', actions: [] },
    },
    'curb',
  );
}

/** Everything off: blocks, schedules, filter. Used by "delete everything". */
export function tearDown() {
  const m = sdk();
  if (!m) return;
  m.stopMonitoring([LOCK_ACTIVITY, WINDOW_ACTIVITY]);
  m.resetBlocks('curb');
  m.clearWebContentFilterPolicy('curb');
}
