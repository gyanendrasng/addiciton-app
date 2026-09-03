/**
 * Pure streak math. One shared streak across all habits.
 * Inputs are epoch ms; relapse times are only the *active* (not undone) ones.
 */
import { dayKey, diffDays } from './clock';

const DAY_MS = 86_400_000;
export const PROGRAM_DAYS = 90;

export type Streak = { days: number; hours: number; minutes: number; ms: number; start: number };
export type Period = { start: number; end: number | null };

export function streakStart(quitStartedAt: number, relapseTimes: number[]): number {
  return relapseTimes.length ? Math.max(quitStartedAt, ...relapseTimes) : quitStartedAt;
}

export function computeStreak(nowMs: number, start: number): Streak {
  const ms = Math.max(0, nowMs - start);
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return { days, hours, minutes, ms, start };
}

/** Clean periods between relapses; the last one is open (end = null). */
export function periods(quitStartedAt: number, relapseTimes: number[], _nowMs: number): Period[] {
  const sorted = [...relapseTimes].filter((t) => t >= quitStartedAt).sort((a, b) => a - b);
  const out: Period[] = [];
  let start = quitStartedAt;
  for (const t of sorted) {
    out.push({ start, end: t });
    start = t;
  }
  out.push({ start, end: null });
  return out;
}

export function longestStreakDays(quitStartedAt: number, relapseTimes: number[], nowMs: number): number {
  return periods(quitStartedAt, relapseTimes, nowMs).reduce((best, p) => {
    const end = p.end ?? nowMs;
    return Math.max(best, Math.floor((end - p.start) / DAY_MS));
  }, 0);
}

/** Calendar days since quitting (inclusive of today) minus distinct relapse days. Never resets. */
export function totalCleanDays(quitStartedAt: number, relapseTimes: number[], nowMs: number): number {
  const span = diffDays(dayKey(quitStartedAt), dayKey(nowMs)) + 1;
  const relapseDays = new Set(relapseTimes.map((t) => dayKey(t))).size;
  return Math.max(0, span - relapseDays);
}

export function rewiring(days: number): number {
  return Math.min(1, days / PROGRAM_DAYS);
}

export function daysUntil(targetKey: string, nowMs: number): number {
  return Math.max(0, diffDays(dayKey(nowMs), targetKey));
}
