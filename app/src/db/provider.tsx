import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getDb } from './client';

const Ctx = createContext<{ ready: boolean; error: Error | null }>({ ready: false, error: null });

/** Opens + migrates the database once; renders children only when ready. */
export function DbProvider({ children, onReady }: { children: ReactNode; onReady?: () => void }) {
  const [state, setState] = useState<{ ready: boolean; error: Error | null }>({
    ready: false,
    error: null,
  });
  useEffect(() => {
    let alive = true;
    getDb()
      .then(() => {
        if (!alive) return;
        setState({ ready: true, error: null });
        onReady?.();
      })
      .catch((e: Error) => alive && setState({ ready: false, error: e }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (state.error && __DEV__) console.error('[db] failed to open', state.error);
  return <Ctx.Provider value={state}>{state.ready ? children : null}</Ctx.Provider>;
}

export function useDbReady() {
  return useContext(Ctx).ready;
}
