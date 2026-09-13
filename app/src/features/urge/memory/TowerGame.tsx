import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { curves, durations, springs } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { bestLine, GameEnd, Status, useBest } from './shared';

const STAGE_W = 300;
const STAGE_H = 320;
const BLOCK_H = 26;
const BASE_W = 180;
/** Rows kept below the moving block before the camera starts rising. */
const VISIBLE_ROWS = 6;
/** A drop this close to flush counts as perfect and costs nothing. */
const PERFECT_PX = 7;
/** Three perfects in a row grow the tower back toward full width. */
const HEAL_EVERY = 3;
const HEAL_PX = 12;
/** The tower is finished at this height, so the game has an end in the urge flow. */
const GOAL = 30;
const BEST_KEY = 'game.tower.best';

type Block = { key: number; left: number; width: number; perfect: boolean };
type Cut = { key: number; left: number; width: number; bottom: number };

/** Slide time for the block at a given height — quickens as the tower grows. */
function slideMs(height: number, reduced: boolean) {
  const base = Math.max(650, 1300 - height * 24);
  return reduced ? base * 1.6 : base;
}

/**
 * Tower. A block slides across the top of the tower; tap to drop it. Whatever
 * hangs over the edge is sliced off and falls, so the tower narrows and every
 * drop matters a little more than the last. Land it flush and it flashes,
 * keeps its width, and three in a row grow it back.
 *
 * Built on what the craving research actually found: it's *visuospatial*
 * load — shapes, edges, positions — that competes with the imagery an urge
 * runs on, not words or arithmetic. And built to be wanted: a score that goes
 * up, a best to beat, and one more go always a tap away. The tower ending is
 * just the tower ending — no "game over", no red.
 */
type Phase = 'play' | 'ended' | 'built';
type Game = {
  tower: Block[];
  cuts: Cut[];
  phase: Phase;
  streak: number;
  /** bumps each time a new block starts sliding */
  round: number;
  /** what the last drop was, for the haptic and the shake */
  last: 'none' | 'perfect' | 'cut' | 'miss' | 'built';
};

const BASE: Block = { key: 0, left: (STAGE_W - BASE_W) / 2, width: BASE_W, perfect: false };
const FRESH: Game = { tower: [BASE], cuts: [], phase: 'play', streak: 0, round: 0, last: 'none' };

/** One drop, as a pure step so the tap handler never reads stale state. */
function dropAt(g: Game, at: number): Game {
  if (g.phase !== 'play') return g;
  const top = g.tower[g.tower.length - 1];
  const key = top.key + 1;
  const delta = at - top.left;
  const bottom = g.tower.length * BLOCK_H;
  const finished = (tower: Block[], last: Game['last']): Game =>
    tower.length > GOAL ? { ...g, tower, phase: 'built', last: 'built' } : { ...g, tower, round: g.round + 1, last };

  // Flush enough: snap on, keep the width, maybe heal.
  if (Math.abs(delta) <= PERFECT_PX) {
    const streak = g.streak + 1;
    const heal = streak % HEAL_EVERY === 0 ? HEAL_PX : 0;
    const width = Math.min(BASE_W, top.width + heal);
    const left = Math.max(0, Math.min(STAGE_W - width, top.left - heal / 2));
    return { ...finished([...g.tower, { key, left, width, perfect: true }], 'perfect'), streak };
  }

  const overlapLeft = Math.max(at, top.left);
  const overlapRight = Math.min(at + top.width, top.left + top.width);
  const overlap = overlapRight - overlapLeft;

  // Nothing under it: the block falls whole and the tower is done.
  if (overlap <= 0) {
    return { ...g, cuts: [...g.cuts, { key, left: at, width: top.width, bottom }], streak: 0, phase: 'ended', last: 'miss' };
  }

  // Partial: keep the overlap, drop the overhang.
  const cutLeft = delta > 0 ? overlapRight : at;
  const cuts = [...g.cuts, { key, left: cutLeft, width: top.width - overlap, bottom }];
  return { ...finished([...g.tower, { key, left: overlapLeft, width: overlap, perfect: false }], 'cut'), cuts, streak: 0 };
}

export function TowerGame({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [g, setG] = useState<Game>(FRESH);
  const { best, beats, record } = useBest(BEST_KEY);

  const x = useSharedValue(0);
  const cam = useSharedValue(0);
  const shake = useSharedValue(0);

  const height = g.tower.length - 1;
  const top = g.tower[g.tower.length - 1];
  const ended = g.phase !== 'play';
  const newBest = ended && beats(height);

  // The moving block: enters from alternating sides and slides edge to edge,
  // on the UI thread, until the tap reads its position.
  useEffect(() => {
    if (g.phase !== 'play') return;
    const span = STAGE_W - top.width;
    const fromLeft = g.tower.length % 2 === 1;
    x.set(fromLeft ? 0 : span);
    x.set(withRepeat(withTiming(fromLeft ? span : 0, { duration: slideMs(g.tower.length, reduced), easing: curves.linear }), -1, true));
    return () => cancelAnimation(x);
    // `top.width` and `tower.length` only change together with `round`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.phase, g.round, reduced, x]);

  // Camera: once the tower is VISIBLE_ROWS tall, each new row lifts the view.
  useEffect(() => {
    const rise = Math.max(0, g.tower.length - VISIBLE_ROWS) * BLOCK_H;
    if (reduced) {
      cam.set(rise);
    } else {
      cam.set(withTiming(rise, { duration: durations.base, easing: curves.out }));
    }
  }, [cam, reduced, g.tower.length]);

  // The felt side of each drop, off the state so the tap handler stays pure.
  useEffect(() => {
    try {
      if (g.last === 'perfect') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (g.last === 'cut') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (g.last === 'built') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (g.last === 'miss') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    // The stage flinches on a miss: a bouncy spring back from a nudge is a shake.
    if (g.last === 'miss' && !reduced) {
      shake.set(6);
      shake.set(withSpring(0, springs.pop));
    }
  }, [g.last, g.round, g.phase, reduced, shake]);

  const drop = (at: number) => setG((prev) => dropAt(prev, at));
  const again = () => {
    record(height);
    setG(FRESH);
  };
  const done = () => {
    record(height);
    onDone();
  };

  // Read the position on the UI thread the instant the finger lands — no
  // JS-thread lag between what the eye saw and what the tap got.
  const tap = Gesture.Tap()
    .maxDuration(10_000)
    .onBegin(() => {
      'worklet';
      runOnJS(drop)(x.value);
    });

  const movingStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const towerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cam.get() }] }));
  const stageStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));

  return (
    <View style={s.wrap}>
      <GestureDetector gesture={tap}>
        <Animated.View
          style={[s.stage, stageStyle]}
          accessibilityRole="button"
          accessibilityLabel={g.phase === 'play' ? 'Drop the block' : 'Tower finished'}
          accessibilityHint="Tap when the sliding block lines up with the tower">
          <Animated.View style={[StyleSheet.absoluteFill, towerStyle]}>
            {g.tower.map((b, i) => (
              <PlacedBlock key={b.key} block={b} bottom={i * BLOCK_H} animate={i === g.tower.length - 1 && i > 0 && !reduced} />
            ))}
            {g.cuts.map((c) => (
              <CutPiece
                key={c.key}
                cut={c}
                reduced={reduced}
                onGone={() => setG((prev) => ({ ...prev, cuts: prev.cuts.filter((p) => p.key !== c.key) }))}
              />
            ))}
            {g.phase === 'play' ? (
              <Animated.View style={[s.block, s.moving, { bottom: g.tower.length * BLOCK_H, width: top.width }, movingStyle]} />
            ) : null}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {g.phase === 'play' ? (
        <Status accent={g.streak > 1}>
          {height === 0 ? 'Tap when it lines up.' : g.streak > 1 ? `Perfect ×${g.streak}` : `Height ${height}${best ? ` · Best ${best}` : ''}`}
        </Status>
      ) : (
        <GameEnd title={g.phase === 'built' ? 'Tower built.' : `Height ${height}`} sub={bestLine(newBest, best)} onAgain={again} onDone={done} />
      )}
    </View>
  );
}

/** A block on the tower. The newest one lands with a squash; a perfect one flashes. */
function PlacedBlock({ block, bottom, animate }: { block: Block; bottom: number; animate: boolean }) {
  const squash = useSharedValue(animate ? 0.7 : 1);
  const flash = useSharedValue(animate && block.perfect ? 0.85 : 0);

  useEffect(() => {
    if (!animate) return;
    squash.set(withSpring(1, springs.pop));
    if (block.perfect) flash.set(withTiming(0, { duration: durations.base, easing: curves.out }));
  }, [animate, block.perfect, flash, squash]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: squash.get() }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.get() }));

  return (
    <Animated.View style={[s.block, { bottom, left: block.left, width: block.width }, style]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s.flash, flashStyle]} />
    </Animated.View>
  );
}

/** The overhang, falling away. Removed once it's out of sight. */
function CutPiece({ cut, reduced, onGone }: { cut: Cut; reduced: boolean; onGone: () => void }) {
  const fall = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    const ms = reduced ? durations.fast : durations.slow;
    fade.set(withTiming(0, { duration: ms, easing: curves.fade }, (finished) => {
      if (finished) runOnJS(onGone)();
    }));
    if (!reduced) fall.set(withTiming(STAGE_H * 0.7, { duration: ms, easing: curves.inOut }));
    // Mount-only: the piece is created once and never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: fade.get(), transform: [{ translateY: fall.get() }] }));
  return <Animated.View pointerEvents="none" style={[s.block, s.cut, { bottom: cut.bottom, left: cut.left, width: cut.width }, style]} />;
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.three },
  stage: {
    width: STAGE_W,
    height: STAGE_H,
    borderRadius: 24,
    backgroundColor: palette.surface2,
    overflow: 'hidden',
  },
  block: {
    position: 'absolute',
    height: BLOCK_H,
    backgroundColor: hues.progress.solid,
    borderTopWidth: 1,
    borderTopColor: palette.surface2,
    borderRadius: 3,
  },
  moving: { left: 0 },
  cut: { backgroundColor: hues.progress.solid },
  flash: { backgroundColor: palette.bright, borderRadius: 3 },
});
