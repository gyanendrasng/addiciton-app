import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { curves, durations, springs } from '@/theme/motion';
import { hues } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { bestLine, GameEnd, Status, useBest } from './shared';

const PADS = ['pledge', 'checkin', 'urge', 'reasons'] as const;
const START = 2;
/** Enough rounds that nobody clears it by accident; a hard stop so it ends. */
const CAP = 15;
const LEAD_MS = 500;
const BEST_KEY = 'game.echo.best';

type Phase = 'show' | 'echo' | 'ended';
type Game = { seq: number[]; phase: Phase; pos: number; lit: number | null; run: number };

/** Kept out of the component so the compiler's purity rule sees the randomness where it belongs. */
const randomPad = () => Math.floor(Math.random() * PADS.length);
const fresh = (run: number): Game => ({ seq: Array.from({ length: START }, randomPad), phase: 'show', pos: 0, lit: null, run });

/** Playback tightens as the sequence grows — the pressure is the pace, not just the length. */
const litMs = (round: number) => Math.max(220, 420 - round * 16);
const gapMs = (round: number) => Math.max(90, 170 - round * 6);

/**
 * Echo. Four pads light in a sequence; tap it back. It grows by one each
 * round and plays faster as it does. One wrong tap and the round is the
 * score — a number to beat next time, not a failure to sit with.
 */
export function EchoGame({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [g, setG] = useState<Game>(() => fresh(0));
  const { best, beats, record } = useBest(BEST_KEY);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const round = g.seq.length - 1;
  const ended = g.phase === 'ended';
  const newBest = ended && beats(round);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Play the sequence back, one pad at a time, then hand over.
  useEffect(() => {
    if (g.phase !== 'show') return;
    const lit = litMs(round);
    const gap = gapMs(round);
    g.seq.forEach((pad, i) => {
      later(() => setG((p) => ({ ...p, lit: pad })), LEAD_MS + i * (lit + gap));
      later(() => setG((p) => ({ ...p, lit: null })), LEAD_MS + i * (lit + gap) + lit);
    });
    later(() => setG((p) => ({ ...p, pos: 0, phase: 'echo' })), LEAD_MS + g.seq.length * (lit + gap));
    return clear;
    // `round` derives from `g.seq`; `later`/`clear` are stable closures over a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.phase, g.seq]);

  useEffect(() => clear, []);

  useEffect(() => {
    if (!ended) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  }, [ended]);

  const tap = (pad: number) => {
    if (g.phase !== 'echo') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setG((p) => ({ ...p, lit: pad }));
    later(() => setG((p) => ({ ...p, lit: null })), durations.press);

    if (pad !== g.seq[g.pos]) {
      later(() => setG((p) => ({ ...p, lit: null, phase: 'ended' })), durations.base);
      return;
    }
    if (g.pos + 1 < g.seq.length) {
      setG((p) => ({ ...p, pos: p.pos + 1 }));
      return;
    }
    if (g.seq.length >= CAP + 1) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      later(() => setG((p) => ({ ...p, lit: null, phase: 'ended' })), durations.base);
      return;
    }
    // Round cleared: the next one is one longer, after a beat.
    later(() => setG((p) => ({ ...p, seq: [...p.seq, randomPad()], phase: 'show', lit: null })), durations.base);
  };

  const again = () => {
    record(round);
    clear();
    setG(fresh(g.run + 1));
  };
  const done = () => {
    record(round);
    onDone();
  };

  const status = g.phase === 'show' ? 'Watch…' : g.phase === 'echo' ? `Your turn.${round > 1 ? ` Round ${round}` : ''}` : '';

  return (
    <View style={s.wrap}>
      <View style={s.grid}>
        {PADS.map((h, i) => (
          <Pad key={h} hue={h} lit={g.lit === i} dim={ended} reduced={reduced} disabled={g.phase !== 'echo'} onPress={() => tap(i)} label={`Pad ${i + 1}`} />
        ))}
      </View>
      {ended ? (
        <GameEnd title={round >= CAP ? 'All fifteen.' : `Round ${round}`} sub={bestLine(newBest, best)} onAgain={again} onDone={done} />
      ) : (
        <Status>{best && g.phase === 'echo' ? `${status} · Best ${best}` : status}</Status>
      )}
    </View>
  );
}

/** A pad: its wash at rest, its solid when lit, with a small lift so the light reads as a press. */
function Pad({
  hue,
  lit,
  dim,
  reduced,
  disabled,
  onPress,
  label,
}: {
  hue: (typeof PADS)[number];
  lit: boolean;
  dim: boolean;
  reduced: boolean;
  disabled: boolean;
  onPress: () => void;
  label: string;
}) {
  const on = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    on.set(withTiming(lit ? 1 : 0, { duration: durations.press, easing: curves.out }));
    if (!reduced) scale.set(lit ? withSpring(1.04, springs.press) : withSpring(1, springs.swap));
  }, [lit, on, reduced, scale]);

  const wrap = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const light = useAnimatedStyle(() => ({ opacity: on.get() }));

  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} style={s.slot}>
      <Animated.View style={[s.pad, { backgroundColor: hues[hue].wash }, dim && s.padDim, wrap]}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s.padLight, { backgroundColor: hues[hue].solid }, light]} />
      </Animated.View>
    </Pressable>
  );
}

const PAD = 128;

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.three },
  grid: { width: 2 * PAD + 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  slot: { width: PAD, height: PAD },
  pad: { flex: 1, borderRadius: 24, overflow: 'hidden' },
  padDim: { opacity: 0.5 },
  padLight: { borderRadius: 24 },
});
