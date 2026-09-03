import { getDb } from '../client';
import { emit } from '../events';
import { useLiveQuery } from '../hooks';

export type Profile = {
  quitStartedAt: number;
  habits: string[];
  score: number;
  freedomDate: string; // YYYY-MM-DD
  answers: Record<string, number[]>;
  premium: boolean;
  createdAt: number;
};

type Row = {
  quit_started_at: number;
  habits: string;
  score: number;
  freedom_date: string;
  answers: string;
  premium: number;
  created_at: number;
};

function fromRow(r: Row): Profile {
  return {
    quitStartedAt: r.quit_started_at,
    habits: JSON.parse(r.habits),
    score: r.score,
    freedomDate: r.freedom_date,
    answers: JSON.parse(r.answers),
    premium: r.premium === 1,
    createdAt: r.created_at,
  };
}

export async function getProfile(): Promise<Profile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>('SELECT * FROM profile WHERE id = 1');
  return row ? fromRow(row) : null;
}

export async function createProfile(p: Omit<Profile, 'premium' | 'createdAt'> & { premium?: boolean }) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO profile (id, quit_started_at, habits, score, freedom_date, answers, premium, created_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
    p.quitStartedAt,
    JSON.stringify(p.habits),
    p.score,
    p.freedomDate,
    JSON.stringify(p.answers),
    p.premium ? 1 : 0,
    Date.now(),
  );
  emit('profile');
}

export async function setPremium(premium: boolean) {
  const db = await getDb();
  await db.runAsync('UPDATE profile SET premium = ? WHERE id = 1', premium ? 1 : 0);
  emit('profile');
}

export async function setQuitStartedAt(ms: number) {
  const db = await getDb();
  await db.runAsync('UPDATE profile SET quit_started_at = ? WHERE id = 1', ms);
  emit('profile');
}

/**
 * Rewrite the onboarding answers (Settings → Your answers).
 *
 * The score is derived from the answers, so it is recomputed here rather than
 * left stale. The quit date and freedom date are NOT touched — those belong to
 * when the user started, not to what they said about themselves.
 */
export async function setAnswers(answers: Record<string, number[]>, score: number) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE profile SET answers = ?, score = ? WHERE id = 1',
    JSON.stringify(answers),
    score,
  );
  emit('profile');
}

export async function setHabits(habits: string[]) {
  const db = await getDb();
  await db.runAsync('UPDATE profile SET habits = ? WHERE id = 1', JSON.stringify(habits));
  emit('profile');
}

/** null while loading, then Profile | undefined (undefined = no profile yet). */
export function useProfile() {
  const q = useLiveQuery(async () => (await getProfile()) ?? undefined, ['profile']);
  return { profile: q.data, loading: q.loading, refetch: q.refetch };
}
