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
 * arithmetic. Each is a loop with years of proof behind it (timing, reflex,
 * planning, memory), each has a score that goes up and a best to beat, and
 * none has a "game over": a round ending is just a round ending, the next go
 * a tap away.
 *
 * Rules aren't copyrightable; names and looks are. So these are the
 * mechanics under our own names, in our own palette, with no borrowed art.
 */
import type { ComponentType } from 'react';
import type { SFSymbol } from 'expo-symbols';

import type { Hue } from '@/theme/palette';
import { EchoArt, FlapArt, MergeArt, TowerArt, type ArtProps } from './art';
import { EchoGame } from './EchoGame';
import { FlapGame } from './FlapGame';
import { MergeGame } from './MergeGame';
import { TowerGame } from './TowerGame';

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
  /** the tile's picture of the game */
  Art: ComponentType<ArtProps>;
  /** where the personal best lives (settings key), and how to print it */
  best: { key: string; unit?: string; label: string };
  Component: ComponentType<{ onDone: () => void }>;
};

export const GAMES: readonly GameMeta[] = [
  {
    id: 'tower',
    title: 'Tower',
    blurb: 'Drop it flush. Go high.',
    headline: 'Build the tower.',
    icon: 'square.stack.3d.up.fill',
    hue: 'progress',
    Art: TowerArt,
    best: { key: 'game.tower.best', label: 'Best height' },
    Component: TowerGame,
  },
  {
    id: 'flap',
    title: 'Flap',
    blurb: 'Tap. Thread the gaps.',
    headline: 'Thread the gaps.',
    icon: 'bird.fill',
    hue: 'reasons',
    Art: FlapArt,
    best: { key: 'game.flap.best', label: 'Best' },
    Component: FlapGame,
  },
  {
    id: 'merge',
    title: 'Merge',
    blurb: 'Swipe. Reach 2048.',
    headline: 'Reach 2048.',
    icon: 'square.grid.2x2.fill',
    hue: 'checkin',
    Art: MergeArt,
    best: { key: 'game.merge.best', label: 'Best score' },
    Component: MergeGame,
  },
  {
    id: 'echo',
    title: 'Echo',
    blurb: 'Repeat it. It grows.',
    headline: 'Repeat the pattern.',
    icon: 'waveform.path',
    hue: 'urge',
    Art: EchoArt,
    best: { key: 'game.echo.best', label: 'Best round' },
    Component: EchoGame,
  },
];

export type GameId = (typeof GAMES)[number]['id'];

export function gameById(id: string): GameMeta {
  return GAMES.find((g) => g.id === id) ?? GAMES[0];
}

/** A different game each time the toolkit opens, so Step 4 doesn't wear thin. */
export function randomGameId(): string {
  return GAMES[Math.floor(Math.random() * GAMES.length)].id;
}
