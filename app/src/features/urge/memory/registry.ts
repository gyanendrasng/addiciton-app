/**
 * The one list of games.
 *
 * Both the urge toolkit's Step 4 and the Games tab draw from here, so adding a
 * game is one entry. Every game takes `onDone` and nothing else, and ends in
 * one to two minutes.
 *
 * Four, on purpose, and all four visuospatial: the craving research (Skorka-
 * Brown & Andrade) found it's *spatial* working-memory load — shapes, edges,
 * positions — that competes with the imagery an urge runs on, not words or
 * arithmetic. Each has a score that goes up and a best to beat, because a
 * game nobody wants to open holds nothing. What none of them has is a "game
 * over": a round ending is just a round ending, and the next go is a tap away.
 */
import type { ComponentType } from 'react';
import type { SFSymbol } from 'expo-symbols';

import type { Hue } from '@/theme/palette';
import { BubblesGame } from './BubblesGame';
import { EchoGame } from './EchoGame';
import { MemoryGame } from './MemoryGame';
import { StackGame } from './StackGame';

export type GameMeta = {
  id: string;
  /** tile and chip label */
  title: string;
  /** one line under the tile */
  blurb: string;
  /** the instruction, as the urge step's headline */
  headline: string;
  icon: SFSymbol;
  hue: Hue;
  /** where the personal best lives (settings key), and how to print it */
  best: { key: string; unit?: string; label: string };
  Component: ComponentType<{ onDone: () => void }>;
};

export const GAMES: readonly GameMeta[] = [
  { id: 'stack', title: 'Stack', blurb: 'Land it flush. Go high.', headline: 'Build the tower.', icon: 'square.stack.3d.up.fill', hue: 'progress', best: { key: 'game.stack.best', label: 'Best height' }, Component: StackGame },
  { id: 'bubbles', title: 'Bubbles', blurb: 'How many in 45s?', headline: 'Pop them before they go.', icon: 'circle.hexagongrid.fill', hue: 'checkin', best: { key: 'game.bubbles.best', label: 'Best' }, Component: BubblesGame },
  { id: 'pairs', title: 'Pairs', blurb: 'Clear six pairs, fast.', headline: 'Match the pairs.', icon: 'square.grid.2x2.fill', hue: 'pledge', best: { key: 'game.pairs.best', unit: 's', label: 'Best time' }, Component: MemoryGame },
  { id: 'echo', title: 'Echo', blurb: 'Repeat it. It grows.', headline: 'Repeat the pattern.', icon: 'waveform.path', hue: 'urge', best: { key: 'game.echo.best', label: 'Best round' }, Component: EchoGame },
];

export type GameId = (typeof GAMES)[number]['id'];

export function gameById(id: string): GameMeta {
  return GAMES.find((g) => g.id === id) ?? GAMES[0];
}

/** A different game each time the toolkit opens, so Step 4 doesn't wear thin. */
export function randomGameId(): string {
  return GAMES[Math.floor(Math.random() * GAMES.length)].id;
}
