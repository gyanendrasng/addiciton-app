import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import type { Answers } from './lib';

type State = {
  index: number;
  direction: 1 | -1;
  answers: Answers;
};

type Action =
  | { type: 'answer'; id: string; selection: number[] }
  | { type: 'goto'; index: number; direction: 1 | -1 };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'answer':
      return { ...state, answers: { ...state.answers, [action.id]: action.selection } };
    case 'goto':
      return { ...state, index: action.index, direction: action.direction };
    default:
      return state;
  }
}

const Ctx = createContext<(State & { dispatch: (a: Action) => void }) | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { index: 0, direction: 1, answers: {} });
  const value = useMemo(() => ({ ...state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useOnboarding outside provider');
  return ctx;
}
