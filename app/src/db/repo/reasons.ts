import { getDb } from '../client';
import { emit } from '../events';
import { useLiveQuery } from '../hooks';

export type Reason = { id: number; text: string; sort: number; source: 'onboarding' | 'user'; archived: boolean };
type Row = { id: number; text: string; sort: number; source: 'onboarding' | 'user'; archived: number };
const fromRow = (r: Row): Reason => ({ ...r, archived: r.archived === 1 });

export async function listReasons(includeArchived = false): Promise<Reason[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    includeArchived ? 'SELECT * FROM reasons ORDER BY sort ASC' : 'SELECT * FROM reasons WHERE archived = 0 ORDER BY sort ASC',
  );
  return rows.map(fromRow);
}

export async function addReason(text: string, source: 'onboarding' | 'user' = 'user') {
  const db = await getDb();
  const max = await db.getFirstAsync<{ m: number | null }>('SELECT MAX(sort) AS m FROM reasons');
  await db.runAsync('INSERT INTO reasons (text, sort, source) VALUES (?, ?, ?)', text, (max?.m ?? -1) + 1, source);
  emit('reasons');
}

export async function seedReasons(texts: string[]) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < texts.length; i++) {
      await db.runAsync("INSERT INTO reasons (text, sort, source) VALUES (?, ?, 'onboarding')", texts[i], i);
    }
  });
  emit('reasons');
}

export async function updateReason(id: number, text: string) {
  const db = await getDb();
  await db.runAsync('UPDATE reasons SET text = ? WHERE id = ?', text, id);
  emit('reasons');
}

export async function archiveReason(id: number, archived = true) {
  const db = await getDb();
  await db.runAsync('UPDATE reasons SET archived = ? WHERE id = ?', archived ? 1 : 0, id);
  emit('reasons');
}

export async function reorderReasons(idsInOrder: number[]) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < idsInOrder.length; i++) await db.runAsync('UPDATE reasons SET sort = ? WHERE id = ?', i, idsInOrder[i]);
  });
  emit('reasons');
}

export function useReasons() {
  const q = useLiveQuery(() => listReasons(), ['reasons']);
  return { reasons: q.data ?? [], loading: q.loading };
}
