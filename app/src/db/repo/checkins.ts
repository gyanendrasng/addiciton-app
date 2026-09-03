import { getDb } from '../client';
import { emit } from '../events';
import { useLiveQuery } from '../hooks';
import { now } from '@/lib/clock';

export type Checkin = {
  date: string;
  mood: number;
  difficulty: number;
  note: string | null;
  createdAt: number;
  updatedAt: number;
};

type Row = { date: string; mood: number; difficulty: number; note: string | null; created_at: number; updated_at: number };
const fromRow = (r: Row): Checkin => ({
  date: r.date,
  mood: r.mood,
  difficulty: r.difficulty,
  note: r.note,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export async function upsertCheckin(c: { date: string; mood: number; difficulty: number; note?: string | null }) {
  const db = await getDb();
  const t = now();
  await db.runAsync(
    `INSERT INTO checkins (date, mood, difficulty, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET mood = excluded.mood, difficulty = excluded.difficulty, note = excluded.note, updated_at = excluded.updated_at`,
    c.date,
    c.mood,
    c.difficulty,
    c.note ?? null,
    t,
    t,
  );
  emit('checkins');
}

export async function getCheckin(date: string): Promise<Checkin | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>('SELECT * FROM checkins WHERE date = ?', date);
  return row ? fromRow(row) : null;
}

export async function listCheckins(limit = 90): Promise<Checkin[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM checkins ORDER BY date DESC LIMIT ?', limit);
  return rows.map(fromRow);
}

export function useCheckin(date: string) {
  const q = useLiveQuery(() => getCheckin(date), ['checkins'], [date]);
  return { checkin: q.data ?? null, loading: q.loading };
}
