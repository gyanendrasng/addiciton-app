import { getDb } from '../client';
import { emit } from '../events';
import { now } from '@/lib/clock';

export type UrgeOutcome = 'open' | 'survived' | 'slipped' | 'abandoned';
export type Urge = {
  id: number;
  createdAt: number;
  trigger: string | null;
  intensity: number | null;
  outcome: UrgeOutcome;
  durationS: number | null;
  stepsCompleted: string[];
};

type Row = {
  id: number; created_at: number; trigger: string | null; intensity: number | null;
  outcome: UrgeOutcome; duration_s: number | null; steps_completed: string;
};
const fromRow = (r: Row): Urge => ({
  id: r.id, createdAt: r.created_at, trigger: r.trigger, intensity: r.intensity,
  outcome: r.outcome, durationS: r.duration_s, stepsCompleted: JSON.parse(r.steps_completed),
});

export async function insertUrge(): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync('INSERT INTO urges (created_at) VALUES (?)', now());
  emit('urges');
  return res.lastInsertRowId;
}

export async function finishUrge(
  id: number,
  u: { outcome: UrgeOutcome; trigger?: string | null; intensity?: number | null; durationS?: number; stepsCompleted?: string[] },
) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE urges SET outcome = ?, trigger = ?, intensity = ?, duration_s = ?, steps_completed = ? WHERE id = ?',
    u.outcome, u.trigger ?? null, u.intensity ?? null, u.durationS ?? null, JSON.stringify(u.stepsCompleted ?? []), id,
  );
  emit('urges');
}

export async function countUrges(outcome?: UrgeOutcome): Promise<number> {
  const db = await getDb();
  const row = outcome
    ? await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM urges WHERE outcome = ?', outcome)
    : await db.getFirstAsync<{ c: number }>("SELECT COUNT(*) AS c FROM urges WHERE outcome != 'open'");
  return row?.c ?? 0;
}

export async function listUrges(limit = 100): Promise<Urge[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM urges ORDER BY created_at DESC LIMIT ?', limit);
  return rows.map(fromRow);
}
