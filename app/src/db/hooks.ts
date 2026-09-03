import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getDb } from './client';
import { subscribe } from './events';
import type { Table } from './schema';

export type LiveQuery<T> = { data: T | undefined; loading: boolean; refetch: () => void };

/**
 * Runs `query` and re-runs it whenever any of `tables` is written to,
 * when the app returns to the foreground, or when `deps` change.
 */
export function useLiveQuery<T>(
  query: (db: SQLiteDatabase) => Promise<T>,
  tables: readonly Table[],
  deps: unknown[] = [],
): LiveQuery<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  });
  const seq = useRef(0);

  const run = useCallback(async () => {
    const id = ++seq.current;
    try {
      const db = await getDb();
      const result = await queryRef.current(db);
      if (id === seq.current) {
        setData(result);
        setLoading(false);
      }
    } catch (e) {
      if (__DEV__) console.warn('[useLiveQuery]', e);
      if (id === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
    const unsub = subscribe(tables, run);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') run();
    });
    return () => {
      unsub();
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, ...deps]);

  return { data, loading, refetch: run };
}
