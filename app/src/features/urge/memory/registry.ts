/**
 * The one list of games.
 *
 * Both the urge toolkit's Step 4 and the Games tab draw from here, so adding a
 * game is one entry. Every game takes `onDone` and nothing else, finishes in
 * one to two minutes, and never keeps score against the player — the job is
 * to hold attention until the wave breaks, not to be lost.
 */
import type { ComponentType } from 'react';
import type { SFSymbol } from 'expo-symbols';

import type { Hue } from '@/theme/palette';
import { BubblesGame } from './BubblesGame';
import { ColorsGame } from './ColorsGame';
import { EchoGame } from './EchoGame';
import { LettersGame } from './LettersGame';
import { MemoryGame } from './MemoryGame';
import { RecallGame } from './RecallGame';
import { SevensGame } from './SevensGame';
import { SpotGame } from './SpotGame';
import { SumsGame } from './SumsGame';

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
  Component: ComponentType<{ onDone: () => void }>;
};

export const GAMES: readonly GameMeta[] = [
  { id: 'bubbles', title: 'Bubbles', blurb: 'Pop before they shrink.', headline: 'Pop them before they go.', icon: 'circle.hexagongrid.fill', hue: 'checkin', Component: BubblesGame },
  { id: 'pairs', title: 'Pairs', blurb: 'Match six pairs.', headline: 'Match the pairs.', icon: 'square.grid.2x2.fill', hue: 'progress', Component: MemoryGame },
  { id: 'echo', title: 'Echo', blurb: 'Repeat the pattern.', headline: 'Repeat the pattern.', icon: 'waveform.path', hue: 'pledge', Component: EchoGame },
  { id: 'letters', title: 'Letters', blurb: 'Unscramble the word.', headline: 'Unscramble the word.', icon: 'textformat.abc', hue: 'reasons', Component: LettersGame },
  { id: 'spot', title: 'Spot it', blurb: 'Find the tilted one.', headline: 'Spot the odd one.', icon: 'eye.fill', hue: 'urge', Component: SpotGame },
  { id: 'sums', title: 'Sums', blurb: 'Two that add up.', headline: 'Find two that add up.', icon: 'plus.circle.fill', hue: 'checkin', Component: SumsGame },
  { id: 'colors', title: 'Colors', blurb: 'Word vs. ink — match?', headline: 'Word vs. color.', icon: 'paintpalette.fill', hue: 'reasons', Component: ColorsGame },
  { id: 'recall', title: 'Recall', blurb: 'Hold a growing number.', headline: 'Hold the number.', icon: 'textformat.123', hue: 'progress', Component: RecallGame },
  { id: 'sevens', title: 'Countdown', blurb: 'Subtract your way down.', headline: 'Do the math.', icon: 'minus.circle.fill', hue: 'pledge', Component: SevensGame },
];

export type GameId = (typeof GAMES)[number]['id'];

export function gameById(id: string): GameMeta {
  return GAMES.find((g) => g.id === id) ?? GAMES[0];
}

/** A different game each time the toolkit opens, so Step 4 doesn't wear thin. */
export function randomGameId(): string {
  return GAMES[Math.floor(Math.random() * GAMES.length)].id;
}
