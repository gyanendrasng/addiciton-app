import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { curves, durations, springs } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { bestLine, GameEnd, Status, useBest } from './shared';

const STAGE = 300;
const ROUND_MS = 45_000;
/** Bubbles alive at once — enough to have to choose, not enough to panic. */
const MAX_ALIVE = 3;
const BEST_KEY = 'game.bubbles.best';
const HUES = ['checkin', 'pledge', 'urge', 'reasons', 'progress'] as const;

type Bubble = {
  key: number;
  x: number;
  y: number;
  size: number;
  hue: (typeof HUES)[number];
  /** how long it stays before it's gone */
  life: number;
  /** tapped — bursting on its way out */
  popped: boolean;
};

type Game = { bubbles: Bubble[]; score: number; streak: number; phase: 'play' | 'ended'; tick: number; next: number };
const FRESH: Game = { bubbles: [], score: 0, streak: 0, phase: 'play', tick: 0, next: 1 };

/** Both tighten as the score climbs: less time between bubbles, less time to get each. */
const spawnGap = (score: number) => Math.max(420, 950 - score * 12);
const lifeFor = (score: number) => Math.max(950, 2000 - score * 22);

/** Kept outside the component so the compiler's purity rule sees the randomness where it belongs. */
function spawnOne(g: Game): Game {
  const tick = g.tick + 1;
  if (g.bubbles.filter((b) => !b.popped).length >= MAX_ALIVE) return { ...g, tick };
  const size = 52 + Math.floor(Math.random() * 22);
  const b: Bubble = {
    key: g.next,
    size,
    x: Math.random() * (STAGE - size),
    y: 6 + Math.random() * (STAGE - size - 6),
    hue: HUES[g.next % HUES.length],
    life: lifeFor(g.score),
    popped: false,
  };
  return { ...g, tick, next: g.next + 1, bubbles: [...g.bubbles, b] };
}

/**
 * Bubbles. They appear, shrink, and go; tap them before they do. Forty-five
 * seconds, as many as you can, and the pace tightens as the number climbs —
 * a reflex game with a score to beat, not a chore with a count.
 *
 * Visuospatial on purpose (see StackGame): where things are and how fast
 * they're going is the load that crowds an urge out.
 */
export function BubblesGame({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [g, setG] = useState<Game>(FRESH);
  const [run, setRun] = useState(0);
  const { best, beats, record } = useBest(BEST_KEY);
  const clock = useSharedValue(1);

  const ended = g.phase === 'ended';
  const newBest = ended && beats(g.score);

  // The round: a bar drains for ROUND_MS, and the state ends with it.
  useEffect(() => {
    clock.set(1);
    clock.set(withTiming(0, { duration: ROUND_MS, easing: curves.linear }));
    const t = setTimeout(() => setG((prev) => ({ ...prev, phase: 'ended' })), ROUND_MS);
    return () => {
      clearTimeout(t);
      cancelAnimation(clock);
    };
  }, [clock, run]);

  // One bubble at a time, on a gap that shortens as the score climbs.
  useEffect(() => {
    if (g.phase !== 'play') return;
    const t = setTimeout(() => setG((prev) => (prev.phase === 'play' ? spawnOne(prev) : prev)), spawnGap(g.score));
    return () => clearTimeout(t);
  }, [g.phase, g.score, g.tick]);

  useEffect(() => {
    if (ended) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
  }, [ended]);

  const pop = (key: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setG((prev) => {
      if (prev.phase !== 'play') return prev;
      const b = prev.bubbles.find((x) => x.key === key);
      if (!b || b.popped) return prev;
      return {
        ...prev,
        score: prev.score + 1,
        streak: prev.streak + 1,
        bubbles: prev.bubbles.map((x) => (x.key === key ? { ...x, popped: true } : x)),
      };
    });
  };
  // Shrank away untapped: it leaves, and the streak goes with it. (A popped
  // bubble's timer still fires; by then it's gone or bursting, and that's not a miss.)
  const expire = (key: number) =>
    setG((prev) => {
      const b = prev.bubbles.find((x) => x.key === key);
      if (!b || b.popped) return prev;
      return { ...prev, streak: 0, bubbles: prev.bubbles.filter((x) => x.key !== key) };
    });
  const gone = (key: number) => setG((prev) => ({ ...prev, bubbles: prev.bubbles.filter((x) => x.key !== key) }));

  const again = () => {
    record(g.score);
    setG(FRESH);
    setRun((r) => r + 1);
  };
  const done = () => {
    record(g.score);
    onDone();
  };

  const clockStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: clock.get() }] }));

  return (
    <View style={s.wrap}>
      <View style={s.stage}>
        <Animated.View style={[s.clock, clockStyle]} />
        {g.bubbles.map((b) => (
          <BubbleView key={b.key} bubble={b} reduced={reduced} onPop={() => pop(b.key)} onExpire={() => expire(b.key)} onGone={() => gone(b.key)} />
        ))}
      </View>
      {ended ? (
        <GameEnd title={`Popped ${g.score}`} sub={bestLine(newBest, best)} onAgain={again} onDone={done} />
      ) : (
        <Status accent={g.streak >= 5}>
          {g.score === 0 ? 'Pop them before they go.' : g.streak >= 5 ? `${g.score} popped · ${g.streak} in a row` : `${g.score} popped${best ? ` · Best ${best}` : ''}`}
        </Status>
      )}
    </View>
  );
}

/**
 * One bubble: lands with a small spring, shrinks for its life, and either
 * bursts (tapped) or fades (missed). The hit target is the full size the
 * whole time — it's the picture that shrinks, not the button.
 */
function BubbleView({
  bubble,
  reduced,
  onPop,
  onExpire,
  onGone,
}: {
  bubble: Bubble;
  reduced: boolean;
  onPop: () => void;
  onExpire: () => void;
  onGone: () => void;
}) {
  const scale = useSharedValue(reduced ? 1 : 0.4);
  const opacity = useSharedValue(1);

  // Life: a timer decides when it's gone; the shrink is only the picture of it.
  useEffect(() => {
    if (!reduced) {
      scale.set(withSequence(withSpring(1, springs.pop), withTiming(0.2, { duration: bubble.life - springs.pop.duration, easing: curves.linear })));
    }
    const t = setTimeout(onExpire, bubble.life);
    return () => clearTimeout(t);
    // Mount-only: a bubble's life is fixed when it appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Burst on pop, then leave.
  useEffect(() => {
    if (!bubble.popped) return;
    cancelAnimation(scale);
    if (reduced) {
      opacity.set(withTiming(0, { duration: durations.fast, easing: curves.out }, (f) => f && runOnJS(onGone)()));
      return;
    }
    scale.set(withTiming(1.35, { duration: durations.press, easing: curves.out }));
    opacity.set(withTiming(0, { duration: durations.press, easing: curves.out }, (f) => f && runOnJS(onGone)()));
    // Pop is a one-way transition; the callbacks are stable for this bubble.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubble.popped]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.get(), transform: [{ scale: scale.get() }] }));

  return (
    <Pressable
      onPress={onPop}
      disabled={bubble.popped}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Pop the bubble"
      style={[s.bubble, { left: bubble.x, top: bubble.y, width: bubble.size, height: bubble.size }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: bubble.size / 2, backgroundColor: hues[bubble.hue].solid }, style]} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.three },
  stage: { width: STAGE, height: STAGE, borderRadius: 24, backgroundColor: palette.surface2, overflow: 'hidden' },
  clock: { position: 'absolute', top: 0, left: 0, width: STAGE, height: 3, backgroundColor: palette.accent, transformOrigin: 'left' },
  bubble: { position: 'absolute' },
});
