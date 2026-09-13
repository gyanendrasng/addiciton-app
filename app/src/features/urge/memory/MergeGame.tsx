import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { curves, durations, springs } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { canMove, emptyBoard, move, SIZE, spawn, won, type Board, type Dir, type Tile } from './merge-logic';
import { bestLine, GameEnd, Status, useBest } from './shared';

const CELL = 66;
const GUTTER = 8;
const BOARD = SIZE * CELL + (SIZE + 1) * GUTTER;
const BEST_KEY = 'game.merge.best';

/**
 * Merge — the 2048 rules. Swipe, everything slides, equal tiles become one.
 * The one game here with no clock and no reflex: every swipe is a decision
 * about space, and a run is two to five minutes of exactly the continuous
 * spatial planning the craving research found crowds an urge out. People
 * play it for years without it being a slot machine.
 */
export function MergeGame({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [b, setB] = useState<Board>(emptyBoard);
  const [phase, setPhase] = useState<'play' | 'won' | 'stuck'>('play');
  const { best, beats, record } = useBest(BEST_KEY);

  const ended = phase !== 'play';
  const newBest = ended && beats(b.score);

  useEffect(() => {
    if (!ended) return;
    try {
      if (phase === 'won') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  }, [ended, phase]);

  const swipe = (dx: number, dy: number) => {
    if (phase !== 'play') return;
    const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    const { board, moved } = move(b, dir);
    if (!moved) return;
    const merged = board.score > b.score;
    try {
      Haptics.impactAsync(merged ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const next = spawn(board);
    setB(next);
    if (won(next)) setPhase('won');
    else if (!canMove(next)) setPhase('stuck');
  };

  const pan = Gesture.Pan()
    .minDistance(16)
    .onEnd((e) => {
      'worklet';
      runOnJS(swipe)(e.translationX, e.translationY);
    });

  const again = () => {
    record(b.score);
    setB(emptyBoard());
    setPhase('play');
  };
  const done = () => {
    record(b.score);
    onDone();
  };

  const top = b.tiles.reduce((m, t) => Math.max(m, t.value), 0);

  return (
    <View style={s.wrap}>
      <GestureDetector gesture={pan}>
        <View style={s.board} accessibilityRole="none" accessibilityLabel={`Board, highest tile ${top}, score ${b.score}`} accessibilityHint="Swipe to slide the tiles">
          {Array.from({ length: SIZE * SIZE }, (_, i) => (
            <View key={i} style={[s.cell, { left: GUTTER + (i % SIZE) * (CELL + GUTTER), top: GUTTER + Math.floor(i / SIZE) * (CELL + GUTTER) }]} />
          ))}
          {b.tiles.map((t) => (
            <TileView key={t.id} tile={t} reduced={reduced} />
          ))}
        </View>
      </GestureDetector>
      {ended ? (
        <GameEnd title={phase === 'won' ? '2048.' : `Score ${b.score}`} sub={bestLine(newBest, best)} onAgain={again} onDone={done} />
      ) : (
        <Status>{b.score === 0 ? 'Swipe. Equal tiles merge.' : `${b.score}${best ? ` · Best ${best}` : ''}`}</Status>
      )}
    </View>
  );
}

/** A tile slides to its cell, pops when it lands as a merge, and arrives with a small spring. */
function TileView({ tile, reduced }: { tile: Tile; reduced: boolean }) {
  const x = useSharedValue(GUTTER + tile.c * (CELL + GUTTER));
  const y = useSharedValue(GUTTER + tile.r * (CELL + GUTTER));
  const scale = useSharedValue(reduced ? 1 : 0.5);

  useEffect(() => {
    const tx = GUTTER + tile.c * (CELL + GUTTER);
    const ty = GUTTER + tile.r * (CELL + GUTTER);
    if (reduced) {
      x.set(tx);
      y.set(ty);
    } else {
      x.set(withTiming(tx, { duration: durations.fast, easing: curves.out }));
      y.set(withTiming(ty, { duration: durations.fast, easing: curves.out }));
    }
  }, [reduced, tile.c, tile.r, x, y]);

  useEffect(() => {
    if (reduced) {
      scale.set(1);
      return;
    }
    if (tile.bumped) scale.set(1.15);
    scale.set(withSpring(1, springs.pop));
  }, [reduced, scale, tile.bumped, tile.value]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: scale.get() }] }));
  const look = lookFor(tile.value);

  return (
    <Animated.View style={[s.tile, { backgroundColor: look.bg }, style]}>
      <Text style={[s.tileText, { color: look.ink, fontSize: tile.value >= 1024 ? 20 : tile.value >= 128 ? 24 : 28 }]}>{tile.value}</Text>
    </Animated.View>
  );
}

/** Flat colour per power of two: quiet at the bottom, the semantic hues as it climbs. */
function lookFor(value: number): { bg: string; ink: string } {
  switch (value) {
    case 2:
      return { bg: palette.surface3, ink: palette.text };
    case 4:
      return { bg: palette.line, ink: palette.text };
    case 8:
      return { bg: hues.checkin.solid, ink: hues.checkin.ink };
    case 16:
      return { bg: hues.pledge.solid, ink: hues.pledge.ink };
    case 32:
      return { bg: hues.reasons.solid, ink: hues.reasons.ink };
    case 64:
      return { bg: hues.urge.solid, ink: hues.urge.ink };
    case 128:
      return { bg: hues.progress.solid, ink: hues.progress.ink };
    case 256:
      return { bg: hues.premium.solid, ink: hues.premium.ink };
    default:
      return { bg: palette.accent, ink: palette.accentInk };
  }
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.three },
  board: { width: BOARD, height: BOARD, borderRadius: 20, backgroundColor: palette.surface2, overflow: 'hidden' },
  cell: { position: 'absolute', width: CELL, height: CELL, borderRadius: 10, backgroundColor: palette.bg },
  tile: { position: 'absolute', left: 0, top: 0, width: CELL, height: CELL, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontFamily: type.display, fontVariant: ['tabular-nums'] },
});
