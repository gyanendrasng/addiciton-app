/** Dev-only helpers: time travel and demo data. Never shipped (guarded by __DEV__ at call sites). */
import { upsertCheckin } from '@/db/repo/checkins';
import { pledge } from '@/db/repo/pledges';
import { setQuitStartedAt } from '@/db/repo/profile';
import { insertRelapse } from '@/db/repo/relapses';
import { getSetting, setSetting } from '@/db/repo/settings';
import { finishUrge, insertUrge } from '@/db/repo/urges';
import { rescheduleMilestones } from '@/features/streak/milestone-schedule';
import { addDays, dayKey, getTimeOffset, now, setTimeOffset } from '@/lib/clock';

export const DEV_OFFSET_KEY = 'dev.time_offset_ms';

export async function loadDevOffset() {
  const v = await getSetting<number>(DEV_OFFSET_KEY);
  if (typeof v === 'number' && v !== 0) setTimeOffset(v);
}

export async function travel(days: number) {
  const next = days === 0 ? 0 : getTimeOffset() + days * 86_400_000;
  setTimeOffset(next);
  await setSetting(DEV_OFFSET_KEY, next);
  await rescheduleMilestones();
}

/** 12 days of history: pledges, check-ins, a few urges, one slip on day 5. */
/** Remove today's pledge and check-in (testing the daily loop repeatedly). */
export async function clearToday() {
  const { getDb } = await import('@/db/client');
  const db = await getDb();
  const key = dayKey(now());
  await db.runAsync('DELETE FROM pledges WHERE date = ?', key);
  await db.runAsync('DELETE FROM checkins WHERE date = ?', key);
  const { emit } = await import('@/db/events');
  emit('pledges', 'checkins');
}

export async function seedDemo() {
  const start = now() - 12 * 86_400_000;
  await setQuitStartedAt(start);
  const startKey = dayKey(start);
  for (let i = 0; i < 12; i++) {
    const key = addDays(startKey, i);
    if (i % 3 !== 2) await pledge(key);
    await upsertCheckin({ date: key, mood: 2 + ((i * 7) % 4), difficulty: 1 + ((i * 5) % 5) });
  }
  for (let i = 0; i < 4; i++) {
    const id = await insertUrge();
    await finishUrge(id, { outcome: i === 3 ? 'slipped' : 'survived', trigger: 'Late at night', intensity: 3 + (i % 3), durationS: 140 });
  }
  await insertRelapse({ habitIds: [], trigger: 'When I’m stressed', note: 'demo', nextActions: [] });
  // move that relapse back to day 5
  const { getDb } = await import('@/db/client');
  const db = await getDb();
  await db.runAsync('UPDATE relapses SET created_at = ? WHERE id = (SELECT MAX(id) FROM relapses)', start + 5 * 86_400_000);
  const { emit } = await import('@/db/events');
  emit('relapses');
  await rescheduleMilestones();
}
