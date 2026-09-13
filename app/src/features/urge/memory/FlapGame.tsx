import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { bestLine, GameEnd, Status, useBest } from './shared';

const STAGE_W = 300;
const STAGE_H = 380;
const BIRD_X = 80;
const BIRD_R = 13;
const PIPE_W = 44;
/** Vertical opening between a pipe's halves. */
const GAP = 128;
/** Horizontal distance from one pipe to the next. */
const SPACING = 190;
const PIPES = 3;
// Tuned to the proportions the original loop used at this stage height: a flap
// lifts about a bird-and-a-half, a fall from the middle takes just over half a second.
const GRAVITY = 950;
const FLAP = -300;
const SPEED_0 = 120;
const SPEED_MAX = 190;
const BEST_KEY = 'game.flap.best';

/**
 * Flap. Gravity pulls; a tap lifts; pipes come. That's the whole game, and
 * it's one of the most replayed loops ever shipped because every run is
 * short, every death is your own, and the next go is a tap away.
 *
 * Everything moves on the UI thread: a frame callback integrates gravity,
 * scrolls the pipes and checks collisions, and JS only hears about a score
 * or a hit. Reduced motion slows the world by a third rather than removing
 * it — there is no game without it.
 */
export function FlapGame({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<'ready' | 'play' | 'ended'>('ready');
  const [score, setScore] = useState(0);
  const [run, setRun] = useState(0);
  const { best, beats, record } = useBest(BEST_KEY);

  const birdY = useSharedValue(STAGE_H / 2);
  const velY = useSharedValue(0);
  const running = useSharedValue(false);
  const over = useSharedValue(false);
  const scoreSv = useSharedValue(0);
  const speedScale = reduced ? 0.7 : 1;
  // The pipes are three recycled slots: an x, an opening height, a scored flag.
  const px = [useSharedValue(0), useSharedValue(0), useSharedValue(0)];
  const gapY = [useSharedValue(0), useSharedValue(0), useSharedValue(0)];
  const passed = [useSharedValue(false), useSharedValue(false), useSharedValue(false)];

  const ended = phase === 'ended';
  const newBest = ended && beats(score);

  const reset = () => {
    birdY.set(STAGE_H / 2);
    velY.set(0);
    over.set(false);
    scoreSv.set(0);
    for (let i = 0; i < PIPES; i++) {
      px[i].set(STAGE_W + 60 + i * SPACING);
      gapY[i].set(randomGap());
      passed[i].set(false);
    }
  };

  // Fresh slots at mount and on every Again.
  useEffect(() => {
    reset();
    // `reset` closes over shared values, which are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  const hit = () => {
    setPhase('ended');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  };
  const scored = (n: number) => {
    setScore(n);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  useFrameCallback((info) => {
    'worklet';
    if (!running.get()) return;
    const dt = Math.min(info.timeSincePreviousFrame ?? 16, 40) / 1000;
    const speed = Math.min(SPEED_MAX, SPEED_0 + scoreSv.get() * 4) * speedScale;

    // The bird: gravity, then position; the ceiling is a wall, the floor is the end.
    velY.set(velY.get() + GRAVITY * speedScale * dt);
    let y = birdY.get() + velY.get() * dt;
    if (y < BIRD_R) {
      y = BIRD_R;
      velY.set(0);
    }
    birdY.set(y);
    if (y + BIRD_R >= STAGE_H) {
      birdY.set(STAGE_H - BIRD_R);
      running.set(false);
      over.set(true);
      runOnJS(hit)();
      return;
    }

    // The pipes: scroll, recycle, score, collide.
    for (let i = 0; i < PIPES; i++) {
      const x = px[i].get() - speed * dt;
      if (x + PIPE_W < 0) {
        // Back to the far side, one spacing past the furthest pipe.
        let far = 0;
        for (let j = 0; j < PIPES; j++) far = Math.max(far, px[j].get());
        px[i].set(far + SPACING);
        gapY[i].set(randomGap());
        passed[i].set(false);
        continue;
      }
      px[i].set(x);
      const g = gapY[i].get();
      const overlapsX = x < BIRD_X + BIRD_R && x + PIPE_W > BIRD_X - BIRD_R;
      if (overlapsX && (y - BIRD_R < g - GAP / 2 || y + BIRD_R > g + GAP / 2)) {
        running.set(false);
        over.set(true);
        runOnJS(hit)();
        return;
      }
      if (!passed[i].get() && x + PIPE_W < BIRD_X - BIRD_R) {
        passed[i].set(true);
        scoreSv.set(scoreSv.get() + 1);
        runOnJS(scored)(scoreSv.get());
      }
    }
  });

  const started = () => setPhase('play');

  // The flap happens on the UI thread, the frame the finger lands; JS only
  // hears about the first one, which starts the run.
  const tap = Gesture.Tap()
    .maxDuration(10_000)
    .onBegin(() => {
      'worklet';
      if (over.get()) return;
      velY.set(FLAP * speedScale);
      if (!running.get()) {
        running.set(true);
        runOnJS(started)();
      }
    });

  const again = () => {
    record(score);
    setScore(0);
    setPhase('ready');
    setRun((r) => r + 1);
  };
  const done = () => {
    record(score);
    onDone();
  };

  // The bird leans into its velocity: nose up on a flap, nose down as it falls.
  const birdStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: birdY.get() - BIRD_R },
      { rotate: `${Math.max(-25, Math.min(70, velY.get() / 9))}deg` },
    ],
  }));

  return (
    <View style={s.wrap}>
      <GestureDetector gesture={tap}>
        <View style={s.stage} accessibilityRole="button" accessibilityLabel={phase === 'ended' ? 'Run over' : 'Flap'} accessibilityHint="Tap to lift; get through the gaps">
          {px.map((x, i) => (
            <Pipe key={i} x={x} gapY={gapY[i]} />
          ))}
          <Animated.View style={[s.bird, birdStyle]} />
        </View>
      </GestureDetector>
      {ended ? (
        <GameEnd title={`Passed ${score}`} sub={bestLine(newBest, best)} onAgain={again} onDone={done} />
      ) : (
        <Status>{phase === 'ready' ? 'Tap to lift. Get through the gaps.' : `${score}${best ? ` · Best ${best}` : ''}`}</Status>
      )}
    </View>
  );
}

/** Where the next opening sits — never so close to an edge that it can't be reached. */
function randomGap() {
  'worklet';
  const margin = GAP / 2 + 30;
  return margin + Math.random() * (STAGE_H - margin * 2);
}

/** One pipe: two halves with the opening between, positioned from shared values. */
function Pipe({ x, gapY }: { x: SharedValue<number>; gapY: SharedValue<number> }) {
  const top = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }], height: Math.max(0, gapY.get() - GAP / 2) }));
  const bottom = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }], top: gapY.get() + GAP / 2 }));
  return (
    <>
      <Animated.View style={[s.pipe, s.pipeTop, top]} />
      <Animated.View style={[s.pipe, s.pipeBottom, bottom]} />
    </>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.three },
  stage: { width: STAGE_W, height: STAGE_H, borderRadius: 24, backgroundColor: palette.surface2, overflow: 'hidden' },
  bird: {
    position: 'absolute',
    left: BIRD_X - BIRD_R,
    top: 0,
    width: BIRD_R * 2,
    height: BIRD_R * 2,
    borderRadius: BIRD_R,
    backgroundColor: hues.reasons.solid,
  },
  pipe: { position: 'absolute', left: 0, width: PIPE_W, backgroundColor: hues.pledge.solid },
  pipeTop: { top: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  pipeBottom: { bottom: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
});
