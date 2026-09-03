import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { insertReached, markCelebrated, uncelebrated } from '@/db/repo/milestones';
import { TIERS } from './tiers';
import { useStreak } from './use-streak';

/**
 * Detects newly reached tiers for the current streak period and opens the
 * celebration for any uncelebrated one. Runs on mount, every minute, and on foreground.
 */
export function useMilestoneWatcher() {
  const router = useRouter();
  const { state } = useStreak();
  const busy = useRef(false);
  const shown = useRef<string | null>(null);

  useEffect(() => {
    if (!state || busy.current) return;
    const { periodStart, streak } = state;
    const due = TIERS.filter((t) => t.days <= streak.days);
    if (!due.length) return;
    busy.current = true;
    (async () => {
      for (const t of due) await insertReached(t.days, periodStart);
      const pending = await uncelebrated(periodStart);
      const top = pending[0];
      // Several tiers reached at once (e.g. after days away): celebrate the highest, retire the rest.
      for (const m of pending.slice(1)) await markCelebrated(m.tier, periodStart);
      if (top) {
        const key = `${top.tier}:${periodStart}`;
        if (shown.current !== key) {
          shown.current = key;
          router.push({ pathname: '/milestone', params: { tier: String(top.tier), period: String(periodStart) } });
        }
      }
    })().finally(() => {
      busy.current = false;
    });
  }, [router, state]);
}
