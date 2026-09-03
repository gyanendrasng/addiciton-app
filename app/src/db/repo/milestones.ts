import { getDb } from '../client';
import { emit } from '../events';
import { now } from '@/lib/clock';

export type MilestoneRow = { tier: number; period_start: number; reached_at: number; celebrated_at: number | null };

export async function reachedTiers(periodStart: number): Promise<MilestoneRow[]> {
  const db = await getDb();
  return db.getAllAsync<MilestoneRow>('SELECT * FROM milestones WHERE period_start = ? ORDER BY tier ASC', periodStart);
}

export async function insertReached(tier: number, periodStart: number) {
  const db = await getDb();
  await db.runAsync('INSERT OR IGNORE INTO milestones (tier, period_start, reached_at) VALUES (?, ?, ?)', tier, periodStart, now());
  emit('milestones');
}

export async function markCelebrated(tier: number, periodStart: number) {
  const db = await getDb();
  await db.runAsync('UPDATE milestones SET celebrated_at = ? WHERE tier = ? AND period_start = ?', now(), tier, periodStart);
  emit('milestones');
}

export async function uncelebrated(periodStart: number): Promise<MilestoneRow[]> {
  const db = await getDb();
  return db.getAllAsync<MilestoneRow>('SELECT * FROM milestones WHERE period_start = ? AND celebrated_at IS NULL ORDER BY tier DESC', periodStart);
}

export async function deleteMilestonesForPeriod(periodStart: number) {
  const db = await getDb();
  await db.runAsync('DELETE FROM milestones WHERE period_start = ?', periodStart);
  emit('milestones');
}
