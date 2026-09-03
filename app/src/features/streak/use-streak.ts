import { useMemo } from 'react';

import { useLiveQuery } from '@/db/hooks';
import { useProfile } from '@/db/repo/profile';
import { activeRelapses } from '@/db/repo/relapses';
import { habits as ALL_HABITS } from '@/features/onboarding/content';
import { now, useMinuteTick } from '@/lib/clock';
import {
  computeStreak,
  longestStreakDays,
  rewiring,
  streakStart,
  totalCleanDays,
  type Streak,
} from '@/lib/streak';
import { currentTier, nextTier, type Tier } from './tiers';

export type HabitStreak = { id: string; label: string; days: number; hours: number };

export type StreakState = {
  streak: Streak;
  periodStart: number;
  totalClean: number;
  longest: number;
  dayOfProgram: number;
  daysUntilFreedom: number;
  rewiring: number;
  tier: Tier | null;
  next: Tier | null;
  /** 0..1 progress from the current tier to the next */
  tierProgress: number;
  /** one counter per tracked habit (empty when only one habit) */
  perHabit: HabitStreak[];
};

export function useStreak(): { state: StreakState | null; loading: boolean } {
  const { profile, loading: pLoading } = useProfile();
  const relapses = useLiveQuery(() => activeRelapses(), ['relapses']);
  const tick = useMinuteTick();

  const state = useMemo(() => {
    if (!profile || !relapses.data) return null;
    const t = now();
    const allTimes = relapses.data.map((r) => r.createdAt);
    const start = streakStart(profile.quitStartedAt, allTimes);
    const streak = computeStreak(t, start);
    const tier = currentTier(streak.days);
    const next = nextTier(streak.days);
    const from = tier?.days ?? 0;
    const tierProgress = next ? Math.min(1, (streak.ms / 86_400_000 - from) / (next.days - from)) : 1;
    const perHabit: HabitStreak[] =
      profile.habits.length > 1
        ? profile.habits.map((id) => {
            const label = ALL_HABITS.find((h) => h.id === id)?.label ?? id;
            const times = relapses.data!
              .filter((r) => r.habitIds.length === 0 || r.habitIds.includes(id))
              .map((r) => r.createdAt);
            const hs = computeStreak(t, streakStart(profile.quitStartedAt, times));
            return { id, label, days: hs.days, hours: hs.hours };
          })
        : [];
    return {
      streak,
      periodStart: start,
      totalClean: totalCleanDays(profile.quitStartedAt, allTimes, t),
      longest: longestStreakDays(profile.quitStartedAt, allTimes, t),
      // Program tracks the CURRENT streak, so it matches the hero and the ring.
      // dayOfProgram + daysUntilFreedom always sums to 90 (until complete).
      dayOfProgram: Math.min(90, streak.days + 1),
      daysUntilFreedom: Math.max(0, 89 - streak.days),
      rewiring: rewiring(streak.days),
      tier,
      next,
      tierProgress,
      perHabit,
    } satisfies StreakState;
    // tick forces recompute every minute
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, relapses.data, tick]);

  return { state, loading: pLoading || relapses.loading };
}
