export type UrgeStep = 'breathe' | 'delay' | 'reasons' | 'game' | 'outcome';
export const ORDER: UrgeStep[] = ['breathe', 'delay', 'reasons', 'game', 'outcome'];

export type UrgeState = { step: UrgeStep; completed: UrgeStep[]; startedAt: number };
export type UrgeAction = { type: 'next'; completed?: boolean } | { type: 'goto'; step: UrgeStep };

export function urgeReducer(state: UrgeState, action: UrgeAction): UrgeState {
  switch (action.type) {
    case 'next': {
      const i = ORDER.indexOf(state.step);
      const next = ORDER[Math.min(i + 1, ORDER.length - 1)];
      const completed = action.completed && !state.completed.includes(state.step) ? [...state.completed, state.step] : state.completed;
      return { ...state, step: next, completed };
    }
    case 'goto':
      return { ...state, step: action.step };
    default:
      return state;
  }
}

/** Skip buttons appear only after the user has given the step a real chance. */
export const SKIP_AFTER_MS: Record<UrgeStep, number> = {
  breathe: 20_000,
  delay: 30_000,
  reasons: 0,
  game: 30_000,
  outcome: 0,
};
