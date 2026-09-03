import type { Table } from './schema';

type Listener = () => void;
const listeners = new Map<Table, Set<Listener>>();

/** Notify live queries that a table changed. Repos call this after writes. */
export function emit(...tables: Table[]) {
  for (const t of tables) listeners.get(t)?.forEach((l) => l());
}

export function subscribe(tables: readonly Table[], listener: Listener): () => void {
  for (const t of tables) {
    if (!listeners.has(t)) listeners.set(t, new Set());
    listeners.get(t)!.add(listener);
  }
  return () => {
    for (const t of tables) listeners.get(t)?.delete(listener);
  };
}
