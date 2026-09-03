import { getDb } from '../client';
import { emit } from '../events';
import { useLiveQuery } from '../hooks';

export async function getSetting<T = string>(key: string): Promise<T | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  if (!row) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return row.value as unknown as T;
  }
}

export async function setSetting(key: string, value: unknown) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    JSON.stringify(value),
  );
  emit('settings');
}

export function useSetting<T = string>(key: string, fallback: T) {
  const q = useLiveQuery(() => getSetting<T>(key), ['settings'], [key]);
  return { value: (q.data ?? fallback) as T, loading: q.loading };
}
