import { getDb } from '../client';
import { emit } from '../events';
import { now } from '@/lib/clock';

export type Relapse = {
  id: number;
  createdAt: number;
  habitIds: string[];
  trigger: string | null;
  note: string | null;
  nextActions: string[];
  urgeId: number | null;
  undone: boolean;
  undoneAt: number | null;
};

type Row = {
  id: number; created_at: number; habit_ids: string; trigger: string | null; note: string | null;
  next_actions: string; urge_id: number | null; undone: number; undone_at: number | null;
};
const fromRow = (r: Row): Relapse => ({
  id: r.id, createdAt: r.created_at, habitIds: JSON.parse(r.habit_ids), trigger: r.trigger, note: r.note,
  nextActions: JSON.parse(r.next_actions), urgeId: r.urge_id, undone: r.undone === 1, undoneAt: r.undone_at,
});

export async function insertRelapse(r: {
  habitIds: string[]; trigger?: string | null; note?: string | null; nextActions?: string[]; urgeId?: number | null;
}): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO relapses (created_at, habit_ids, trigger, note, next_actions, urge_id) VALUES (?, ?, ?, ?, ?, ?)',
    now(), JSON.stringify(r.habitIds), r.trigger ?? null, r.note ?? null, JSON.stringify(r.nextActions ?? []), r.urgeId ?? null,
  );
  emit('relapses');
  return res.lastInsertRowId;
}

export async function undoRelapse(id: number) {
  const db = await getDb();
  await db.runAsync('UPDATE relapses SET undone = 1, undone_at = ? WHERE id = ?', now(), id);
  emit('relapses');
}

/** Active relapses with their habit ids, ascending (empty habitIds = counts for all). */
export async function activeRelapses(): Promise<{ createdAt: number; habitIds: string[] }[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ created_at: number; habit_ids: string }>(
    'SELECT created_at, habit_ids FROM relapses WHERE undone = 0 ORDER BY created_at ASC',
  );
  return rows.map((r) => ({ createdAt: r.created_at, habitIds: JSON.parse(r.habit_ids) }));
}

/** Active (not undone) relapse timestamps, ascending. */
export async function activeRelapseTimes(): Promise<number[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ created_at: number }>('SELECT created_at FROM relapses WHERE undone = 0 ORDER BY created_at ASC');
  return rows.map((r) => r.created_at);
}

export async function latestActiveRelapse(): Promise<Relapse | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>('SELECT * FROM relapses WHERE undone = 0 ORDER BY created_at DESC LIMIT 1');
  return row ? fromRow(row) : null;
}

export async function listRelapses(limit = 100): Promise<Relapse[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM relapses WHERE undone = 0 ORDER BY created_at DESC LIMIT ?', limit);
  return rows.map(fromRow);
}
