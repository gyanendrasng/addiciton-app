import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Cta } from '@/features/onboarding/components/chrome';
import { curves } from '@/theme/motion';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { SKIP_AFTER_MS } from '../machine';
import { shared, SkipLater } from './shared';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PHASE_S = 4;
const PHASE_MS = PHASE_S * 1000;
const PHASES = [
  { label: 'Breathe in', hint: 'through the nose' },
  { label: 'Hold', hint: 'lungs full' },
  { label: 'Breathe out', hint: 'slow, through the mouth' },
  { label: 'Hold', hint: 'lungs empty' },
] as const;
const CYCLES = 3;

const SIZE = 300; // stage size
const R_RING = SIZE / 2 - 6; // per-phase progress ring
const CIRC = 2 * Math.PI * R_RING;
const DISC = 132; // resting disc diameter; inhales to ×1.6 (= inner guide ring)
const GROW = 1.6;

/**
 * Box breathing 4-4-4-4 × 3. The disc breathes between two hairline guide rings;
 * a thin ring sweeps each 4s phase; the numeral counts the seconds down.
 */
export function Breathe({
  onDone,
  onSkip,
  opener,
}: {
  onDone: () => void;
  onSkip: () => void;
  /** The user's own trigger, from onboarding — see notifications/trigger-window. */
  opener?: string | null;
}) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const phaseP = useSharedValue(0);
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0); // completed cycles
  const [count, setCount] = useState(PHASE_S);

  useEffect(() => {
    const ease = Easing.inOut(Easing.quad);
    if (!reduced) {
      scale.set(
        withRepeat(
          withSequence(
            withTiming(GROW, { duration: PHASE_MS, easing: ease }),
            withTiming(GROW, { duration: PHASE_MS }),
            withTiming(1, { duration: PHASE_MS, easing: ease }),
            withTiming(1, { duration: PHASE_MS }),
          ),
          CYCLES,
          false,
        ),
      );
      phaseP.set(withRepeat(withTiming(1, { duration: PHASE_MS, easing: curves.linear }), 4 * CYCLES, false));
    }
    let tick = 0; // seconds elapsed
    const id = setInterval(() => {
      tick += 1;
      const inPhase = tick % PHASE_S;
      setCount(inPhase === 0 ? PHASE_S : PHASE_S - inPhase);
      if (inPhase === 0) {
        const p = tick / PHASE_S; // phases completed
        if (p >= 4 * CYCLES) {
          clearInterval(id);
          onDone();
          return;
        }
        setPhase(p % 4);
        setCycle(Math.floor(p / 4));
        try {
          Haptics.selectionAsync();
        } catch {}
      }
    }, 1000);
    return () => {
      clearInterval(id);
      cancelAnimation(scale);
      cancelAnimation(phaseP);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disc = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const ring = useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - phaseP.get()) }));

  return (
    <View style={shared.pane}>
      <View style={s.top}>
        <Text style={s.kicker}>Breathe · {PHASE_S}-{PHASE_S}-{PHASE_S}-{PHASE_S}</Text>
        <Text style={s.phase}>{PHASES[phase].label}</Text>
        <Text style={s.hint}>{PHASES[phase].hint}</Text>
        {/* Naming the trigger the user gave us is the difference between a
            generic breathing timer and one that knows why they're here. */}
        {opener ? <Text style={s.opener}>{opener}</Text> : null}
      </View>

      <View style={shared.center}>
        <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={StyleSheet.absoluteFill}>
            {/* guide rings: rest size and full-inhale size */}
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={DISC / 2} stroke={palette.line} strokeWidth={1} fill="none" />
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={(DISC * GROW) / 2} stroke={palette.line} strokeWidth={1} fill="none" strokeDasharray="3 5" />
            {/* phase progress ring */}
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={R_RING} stroke={palette.surface3} strokeWidth={3} fill="none" />
            <AnimatedCircle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R_RING}
              stroke={palette.accent}
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CIRC}
              animatedProps={ring}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </Svg>
          <Animated.View style={[s.disc, disc]}>
            <Text style={s.count}>{count}</Text>
          </Animated.View>
        </View>
      </View>

      <View style={s.bottom}>
        <View style={s.cycles} accessibilityLabel={`cycle ${Math.min(cycle + 1, CYCLES)} of ${CYCLES}`}>
          {Array.from({ length: CYCLES }, (_, i) => (
            <View key={i} style={[s.cyclePill, i < cycle && s.cyclePillDone, i === cycle && s.cyclePillNow]} />
          ))}
        </View>
        <SkipLater afterMs={SKIP_AFTER_MS.breathe} onSkip={onSkip} />
        {reduced && <Cta label="Continue" onPress={onDone} />}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  top: { alignItems: 'center', gap: Spacing.one, marginTop: Spacing.two },
  kicker: { color: palette.textFaint, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: type.bodySemi },
  phase: { color: palette.bright, fontSize: 34, fontFamily: type.display, letterSpacing: -0.5, marginTop: Spacing.one },
  opener: {
    color: palette.textDim,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: type.body,
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  hint: { color: palette.textDim, fontSize: 15, fontFamily: type.body },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { color: palette.accentInk, fontSize: 40, fontFamily: type.display, fontVariant: ['tabular-nums'] },
  bottom: { alignItems: 'center', gap: Spacing.two },
  cycles: { flexDirection: 'row', gap: 6 },
  cyclePill: { width: 28, height: 4, borderRadius: 2, backgroundColor: palette.surface3 },
  cyclePillDone: { backgroundColor: palette.accent },
  cyclePillNow: { backgroundColor: palette.accentDeep },
});
