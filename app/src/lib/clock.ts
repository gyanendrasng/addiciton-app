/**
 * Single source of time for the app. Everything that reasons about "now" or
 * "today" goes through here so the dev time-travel offset applies everywhere.
 * Never call Date.now() directly in feature code.
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

let offsetMs = 0;
const listeners = new Set<() => void>();

export function setTimeOffset(ms: number) {
  offsetMs = ms;
  listeners.forEach((l) => l());
}
export function getTimeOffset() {
  return offsetMs;
}
export function now(): number {
  return Date.now() + offsetMs;
}
export function nowDate(): Date {
  return new Date(now());
}

const DAY_MS = 86_400_000;

/** Local calendar day as 'YYYY-MM-DD'. */
export function dayKey(d: Date | number = now()): string {
  const x = typeof d === 'number' ? new Date(d) : d;
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${m}-${day}`;
}

/** Local midnight (ms) for a day key. */
export function dayKeyToMs(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function startOfDay(d: Date | number = now()): number {
  return dayKeyToMs(dayKey(d));
}

/** Calendar-day difference b − a (DST-safe: compares UTC noon of each local day). */
export function diffDays(aKey: string, bKey: string): number {
  const [ay, am, ad] = aKey.split('-').map(Number);
  const [by, bm, bd] = bKey.split('-').map(Number);
  const a = Date.UTC(ay, am - 1, ad, 12);
  const b = Date.UTC(by, bm - 1, bd, 12);
  return Math.round((b - a) / DAY_MS);
}

export function addDays(key: string, n: number): string {
  const ms = dayKeyToMs(key) + n * DAY_MS + 12 * 3_600_000; // noon, DST-safe
  return dayKey(ms);
}

/**
 * Re-renders roughly every minute — and immediately on foreground/wake and dev
 * offset changes. Uses a 20s heartbeat that only bumps state when the displayed
 * minute actually changes, so sleep/suspend recovery is at most 20s behind.
 */
export function useMinuteTick(): number {
  const [minute, setMinute] = useState(() => Math.floor(now() / 60_000));
  useEffect(() => {
    const refresh = () => setMinute(Math.floor(now() / 60_000));
    const interval = setInterval(refresh, 20_000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    listeners.add(refresh);
    return () => {
      clearInterval(interval);
      sub.remove();
      listeners.delete(refresh);
    };
  }, []);
  return minute;
}

/** Today's key; flips at local midnight while the app is open. */
export function useDayKey(): string {
  useMinuteTick();
  return dayKey();
}
