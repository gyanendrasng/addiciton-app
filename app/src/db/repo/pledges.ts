import { getDb } from '../client';
import { emit } from '../events';
import { useLiveQuery } from '../hooks';
import { now } from '@/lib/clock';

export async function pledge(date: string) {
  const db = await getDb();
  await db.runAsync('INSERT OR IGNORE INTO pledges (date, created_at) VALUES (?, ?)', date, now());
  emit('pledges');
}

export async function hasPledged(date: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM pledges WHERE date = ?', date);
  return (row?.c ?? 0) > 0;
}

export async function listPledgeDates(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ date: string }>('SELECT date FROM pledges');
  return rows.map((r) => r.date);
}

export function usePledged(date: string) {
  const q = useLiveQuery(() => hasPledged(date), ['pledges'], [date]);
  return { pledged: q.data ?? false, loading: q.loading };
}
