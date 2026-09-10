/**
 * Shield state.
 *
 * What the app needs to remember lives in the SQLite `settings` table, like
 * every other preference; the selection token itself lives in the app group
 * with Apple's module, because the extensions read it from there. The two are
 * kept in step by the functions below, which are the only writers.
 *
 * None of this syncs to the server: tokens are device-bound and meaningless
 * anywhere else, and the counts are not worth a privacy-policy paragraph.
 */
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { listReasons } from '@/db/repo/reasons';
import { getSetting, setSetting, useSetting } from '@/db/repo/settings';
import { triggerFrom } from '@/features/notifications/trigger-window';
import { track } from '@/lib/analytics';
import { now, nowDate } from '@/lib/clock';
import { fmtHour, fmtTime } from './format';
import {
  authorizationStatus,
  blockNow,
  clearWindow,
  configureAppearance,
  endLock,
  lockFor,
  saveSelection,
  scheduleWindow,
  setAdultFilter,
  shieldAvailable,
  tearDown,
  type ShieldAuth,
} from './module';

export const SHIELD_SETUP_KEY = 'shield.setup';
export const SHIELD_WINDOW_KEY = 'shield.window';
export const SHIELD_LOCK_KEY = 'shield.lock';
export const SHIELD_DELAY_KEY = 'shield.unlockDelayMin';
export const SHIELD_FILTER_KEY = 'shield.adultFilter';
export const SHIELD_ALWAYS_KEY = 'shield.always';

/**
 * How the shield decides when to be up.
 *   always — blocked around the clock; the browser wall for the porn habit
 *   window — the daily hard hours
 *   ask    — only the 15/30/60 locks
 */
export type ShieldMode = 'always' | 'window' | 'ask';

/** How many things were picked. Never which. */
export type ShieldSetup = { apps: number; categories: number; sites: number; at: number };
export type ShieldWindow = { on: boolean; startHour: number; hours: number };
export type ShieldLock = { until: number };

export const DEFAULT_WINDOW_HOURS = 3;
export const DEFAULT_UNLOCK_DELAY_MIN = 5;
export const LOCK_CHOICES_MIN = [15, 30, 60] as const;

/**
 * Where the window starts if the user never touches it: the hour onboarding
 * already derived from "when do urges hit hardest?", so the shield and the
 * nudge agree without asking anything new.
 */
export function defaultWindow(answers: Record<string, number[]>): ShieldWindow {
  const t = triggerFrom(answers);
  return { on: false, startHour: t?.hour ?? 21, hours: DEFAULT_WINDOW_HOURS };
}

/** A fresh reason each time, so the shield doesn't wear one sentence out. */
async function refreshAppearance() {
  const reasons = await listReasons();
  const pick = reasons.length ? reasons[Math.floor(Math.random() * reasons.length)].text : null;
  configureAppearance(pick);
}

export async function completeSetup(token: string, counts: Omit<ShieldSetup, 'at'>) {
  saveSelection(token);
  await refreshAppearance();
  await setSetting(SHIELD_SETUP_KEY, { ...counts, at: now() } satisfies ShieldSetup);
  track('shield_set_up', { apps: counts.apps, categories: counts.categories, sites: counts.sites });
}

/** Resolves false when iOS refused the timer; the block itself still stands. */
export async function startLock(minutes: number): Promise<boolean> {
  await refreshAppearance();
  const scheduled = await lockFor(minutes);
  await setSetting(SHIELD_LOCK_KEY, { until: now() + minutes * 60_000 } satisfies ShieldLock);
  track('shield_lock_started', { minutes, scheduled });
  return scheduled;
}

/**
 * Ending early is allowed — after the delay the user chose while calm.
 * Implemented as a shorter lock, so the extension lifts it with no help from
 * the app. A delay of zero lifts it now.
 */
export async function endLockAfterDelay() {
  const delay = (await getSetting<number>(SHIELD_DELAY_KEY)) ?? DEFAULT_UNLOCK_DELAY_MIN;
  if (delay <= 0) {
    endLock();
    await setSetting(SHIELD_LOCK_KEY, null);
  } else {
    await lockFor(delay);
    await setSetting(SHIELD_LOCK_KEY, { until: now() + delay * 60_000 } satisfies ShieldLock);
  }
  track('shield_lock_ended_early', { delay_min: delay });
}

/** Lift a lock whose end the extension may have missed. Called on foreground. */
export async function reconcileLock() {
  const lock = await getSetting<ShieldLock>(SHIELD_LOCK_KEY);
  if (!lock) return;
  if (lock.until <= now()) {
    endLock();
    await setSetting(SHIELD_LOCK_KEY, null);
  }
}

export async function setWindow(next: ShieldWindow) {
  await setSetting(SHIELD_WINDOW_KEY, next);
  if (next.on) {
    await refreshAppearance();
    await scheduleWindow(next.startHour, next.hours);
    track('shield_window_enabled', { start_hour: next.startHour, hours: next.hours });
  } else {
    clearWindow();
  }
}

/**
 * Always-on is a block with no schedule: ManagedSettings keeps it up until
 * something clears it. Switching it OFF honours the unlock delay exactly like
 * ending a lock — the delay is the whole point of having one.
 */
export async function setMode(mode: ShieldMode, window: ShieldWindow) {
  if (mode === 'always') {
    clearWindow();
    await setSetting(SHIELD_WINDOW_KEY, { ...window, on: false });
    await refreshAppearance();
    blockNow();
    await setSetting(SHIELD_LOCK_KEY, null);
    await setSetting(SHIELD_ALWAYS_KEY, true);
    track('shield_window_enabled', { start_hour: -1, hours: 24 });
    return;
  }
  const wasAlways = (await getSetting<boolean>(SHIELD_ALWAYS_KEY)) === true;
  await setSetting(SHIELD_ALWAYS_KEY, false);
  if (wasAlways) {
    const delay = (await getSetting<number>(SHIELD_DELAY_KEY)) ?? DEFAULT_UNLOCK_DELAY_MIN;
    if (delay > 0) {
      await lockFor(delay);
      await setSetting(SHIELD_LOCK_KEY, { until: now() + delay * 60_000 } satisfies ShieldLock);
    } else {
      endLock();
    }
  }
  await setWindow({ ...window, on: mode === 'window' });
}

export async function setUnlockDelay(minutes: number) {
  await setSetting(SHIELD_DELAY_KEY, Math.max(0, Math.min(30, minutes)));
}

export async function setFilter(on: boolean) {
  setAdultFilter(on);
  await setSetting(SHIELD_FILTER_KEY, on);
}

/** Part of "delete everything". */
export async function removeShield() {
  tearDown();
  await setSetting(SHIELD_SETUP_KEY, null);
  await setSetting(SHIELD_LOCK_KEY, null);
  await setSetting(SHIELD_WINDOW_KEY, null);
  await setSetting(SHIELD_FILTER_KEY, false);
  await setSetting(SHIELD_ALWAYS_KEY, false);
}

export type ShieldNow =
  | { up: true; reason: 'lock' | 'always' | 'window'; until: string | null }
  | { up: false; next: string | null };

/**
 * Is the shield up right now, and why. One answer for Home, the tab and the
 * urge flow, so they can never disagree.
 */
export function shieldNow(s: {
  lock: ShieldLock | null;
  always: boolean;
  window: ShieldWindow | null;
}): ShieldNow {
  if (s.lock) return { up: true, reason: 'lock', until: fmtTime(s.lock.until) };
  if (s.always) return { up: true, reason: 'always', until: null };
  if (s.window?.on) {
    const h = nowDate().getHours();
    const end = Math.min(24, s.window.startHour + s.window.hours);
    if (h >= s.window.startHour && h < end) return { up: true, reason: 'window', until: fmtHour(end) };
    return { up: false, next: `${fmtHour(s.window.startHour)} ${h < s.window.startHour ? 'today' : 'tomorrow'}` };
  }
  return { up: false, next: null };
}

/**
 * Authorization, re-read on every foreground — see `authorizationStatus`. The
 * refresh is for right after the permission sheet closes, before the next
 * foreground would pick the change up.
 */
export function useShieldAuth(): [ShieldAuth, () => void] {
  const [auth, setAuth] = useState<ShieldAuth>(() => authorizationStatus());
  const refresh = useCallback(() => setAuth(authorizationStatus()), []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);
  return [auth, refresh];
}

export function useShield() {
  const [auth, refreshAuth] = useShieldAuth();
  const setup = useSetting<ShieldSetup | null>(SHIELD_SETUP_KEY, null);
  const lock = useSetting<ShieldLock | null>(SHIELD_LOCK_KEY, null);
  const window = useSetting<ShieldWindow | null>(SHIELD_WINDOW_KEY, null);
  const delay = useSetting<number>(SHIELD_DELAY_KEY, DEFAULT_UNLOCK_DELAY_MIN);
  const filter = useSetting<boolean>(SHIELD_FILTER_KEY, false);
  const always = useSetting<boolean>(SHIELD_ALWAYS_KEY, false);
  const active = !!lock.value && lock.value.until > now();
  const mode: ShieldMode = always.value ? 'always' : window.value?.on ? 'window' : 'ask';
  return {
    available: shieldAvailable(),
    auth,
    /** picked something and Apple has said yes */
    ready: auth === 'approved' && !!setup.value,
    setup: setup.value,
    lock: active ? lock.value : null,
    window: window.value,
    unlockDelayMin: delay.value,
    filter: filter.value,
    always: always.value,
    mode,
    loading: setup.loading || lock.loading || window.loading,
    refreshAuth,
  };
}
