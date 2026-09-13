/**
 * The 2048 rules, pure. Tiles carry ids so the view can slide the same tile
 * from where it was to where it lands, and a merge keeps the survivor's id.
 */
export const SIZE = 4;
export const GOAL = 2048;

export type Tile = { id: number; value: number; r: number; c: number; /** merged this move — pops */ bumped: boolean };
export type Board = { tiles: Tile[]; score: number; next: number };
export type Dir = 'up' | 'down' | 'left' | 'right';

export function emptyBoard(): Board {
  return spawn(spawn({ tiles: [], score: 0, next: 1 }));
}

/** Kept out of the component so the compiler's purity rule sees the randomness where it belongs. */
export function spawn(b: Board): Board {
  const taken = new Set(b.tiles.map((t) => t.r * SIZE + t.c));
  const free: number[] = [];
  for (let i = 0; i < SIZE * SIZE; i++) if (!taken.has(i)) free.push(i);
  if (free.length === 0) return b;
  const cell = free[Math.floor(Math.random() * free.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  return { ...b, next: b.next + 1, tiles: [...b.tiles, { id: b.next, value, r: Math.floor(cell / SIZE), c: cell % SIZE, bumped: false }] };
}

/** Slide every tile in one direction, merging equal neighbours once. `moved` is false if nothing changed. */
export function move(b: Board, dir: Dir): { board: Board; moved: boolean } {
  const vertical = dir === 'up' || dir === 'down';
  const reverse = dir === 'down' || dir === 'right';
  let score = b.score;
  let moved = false;
  const out: Tile[] = [];

  for (let line = 0; line < SIZE; line++) {
    // The tiles on this row/column, in travel order.
    const cells = b.tiles
      .filter((t) => (vertical ? t.c : t.r) === line)
      .sort((a, z) => (vertical ? a.r - z.r : a.c - z.c));
    if (reverse) cells.reverse();

    let pos = 0;
    for (let i = 0; i < cells.length; i++) {
      const t = cells[i];
      const n = cells[i + 1];
      const target = reverse ? SIZE - 1 - pos : pos;
      if (n && n.value === t.value) {
        // Merge into the leading tile; the trailing one is gone.
        const value = t.value * 2;
        score += value;
        out.push(place({ ...t, value, bumped: true }, vertical, line, target));
        i++;
        moved = true;
      } else {
        const placed = place({ ...t, bumped: false }, vertical, line, target);
        if (placed.r !== t.r || placed.c !== t.c) moved = true;
        out.push(placed);
      }
      pos++;
    }
  }
  return { board: { ...b, tiles: out, score }, moved };
}

function place(t: Tile, vertical: boolean, line: number, target: number): Tile {
  return vertical ? { ...t, c: line, r: target } : { ...t, r: line, c: target };
}

export function canMove(b: Board): boolean {
  if (b.tiles.length < SIZE * SIZE) return true;
  const at = new Map(b.tiles.map((t) => [t.r * SIZE + t.c, t.value]));
  for (const t of b.tiles) {
    if (at.get(t.r * SIZE + t.c + 1) === t.value && t.c < SIZE - 1) return true;
    if (at.get((t.r + 1) * SIZE + t.c) === t.value && t.r < SIZE - 1) return true;
  }
  return false;
}

export const won = (b: Board) => b.tiles.some((t) => t.value >= GOAL);
