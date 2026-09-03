export type Card = { id: number; glyph: number };
export type GameState = {
  cards: Card[];
  open: number[];      // indexes currently face-up (max 2)
  matched: number[];   // indexes solved
  moves: number;
  locked: boolean;     // waiting for mismatch to flip back
};

export const PAIRS = 6;

function shuffle<T>(arr: T[], seed = Date.now()): T[] {
  let s = seed % 2147483647;
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function createGame(): GameState {
  const glyphs = Array.from({ length: PAIRS }, (_, i) => i);
  const cards = shuffle([...glyphs, ...glyphs]).map((glyph, id) => ({ id, glyph }));
  return { cards, open: [], matched: [], moves: 0, locked: false };
}

export type GameAction = { type: 'flip'; index: number } | { type: 'resolve' };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'flip': {
      const i = action.index;
      if (state.locked || state.open.includes(i) || state.matched.includes(i) || state.open.length >= 2) return state;
      const open = [...state.open, i];
      if (open.length < 2) return { ...state, open };
      const [a, b] = open;
      const isMatch = state.cards[a].glyph === state.cards[b].glyph;
      return isMatch
        ? { ...state, open: [], matched: [...state.matched, a, b], moves: state.moves + 1 }
        : { ...state, open, moves: state.moves + 1, locked: true };
    }
    case 'resolve':
      return state.locked ? { ...state, open: [], locked: false } : state;
    default:
      return state;
  }
}

export const isDone = (s: GameState) => s.matched.length === s.cards.length;
