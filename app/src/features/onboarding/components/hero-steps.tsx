/** The payoff screens: Analyzing, Score (ring + count-up), Freedom date. */
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { Spacing } from '@/theme/spacing';
import { curves, springs, stagger } from '@/theme/motion';
import { type } from '@/theme/type';
import { palette } from '@/theme/palette';
import { analyzingLines } from '../content';
import { formatFreedomDate, formatFreedomDateLong, freedomDate, scoreBlurb } from '../lib';
import { Cta, Subtitle, Title } from './chrome';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedInput = Animated.createAnimatedComponent(TextInput);

function success() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}
function thud() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

/* ---------------- Analyzing ---------------- */

const THRESHOLDS = [24, 49, 74, 96];
const ANALYZE_MS = 3600;

export function Analyzing({ onDone }: { onDone: () => void }) {
  const progress = useSharedValue(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: ANALYZE_MS, easing: curves.inOut });
    const t = setTimeout(onDone, ANALYZE_MS + 700);
    return () => clearTimeout(t);
  }, [onDone, progress]);

  useAnimatedReaction(
    () => Math.round(progress.value * 100),
    (n, prev) => {
      if (n !== prev) runOnJS(setPct)(n);
    },
  );

  return (
    <View style={s.center}>
      <View style={s.analyzeBlock}>
        <Text style={s.analyzePct}>{pct}%</Text>
        <Text style={s.analyzeSub}>Building your plan</Text>
        <View style={s.analyzeRows}>
          {analyzingLines.map((line, i) => {
            const done = pct >= THRESHOLDS[i];
            return (
              <View key={line} style={s.checkRow}>
                <View style={[s.tickBubble, done && s.tickBubbleDone]}>
                  {done && (
                    <Animated.View entering={FadeIn.duration(150)}>
                      <Svg width={13} height={13} viewBox="0 0 14 14">
                        <Path
                          d="M2.5 7.5 L5.5 10.5 L11.5 3.5"
                          stroke={palette.accentInk}
                          strokeWidth={2.4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </Svg>
                    </Animated.View>
                  )}
                </View>
                <Text style={[s.checkLabel, !done && s.checkLabelPending]}>{line}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/* ---------------- Score ---------------- */

const R = 88;
const CIRC = 2 * Math.PI * R;

export function ScoreStep({ score, onNext }: { score: number; onNext: () => void }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const landed = useRef(false);

  useEffect(() => {
    if (reduced) {
      progress.value = score / 100;
      return;
    }
    // ring + number ride the same clock so they land together
    progress.value = withDelay(
      600,
      withTiming(score / 100, { duration: 1200, easing: curves.height }, (fin) => {
        if (fin && !landed.current) runOnJS(thud)();
      }),
    );
  }, [progress, reduced, score]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC * (1 - progress.value),
  }));
  const numberProps = useAnimatedProps(() => {
    const n = Math.round(progress.value * 100);
    return { text: String(n) } as { text: string };
  });
  const [webNumber, setWebNumber] = useState(0);
  useAnimatedReaction(
    () => Math.round(progress.value * 100),
    (n, prev) => {
      if (Platform.OS === 'web' && n !== prev) runOnJS(setWebNumber)(n);
    },
  );

  return (
    <View style={s.center}>
      <View style={s.ringWrap}>
        <Svg width={220} height={220} viewBox="0 0 220 220">
          <Circle cx={110} cy={110} r={R} stroke={palette.surface3} strokeWidth={12} fill="none" />
          <AnimatedCircle
            cx={110}
            cy={110}
            r={R}
            stroke={palette.amber}
            strokeWidth={12}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRC}
            animatedProps={ringProps}
            transform="rotate(-90 110 110)"
          />
        </Svg>
        <View style={s.ringCenter}>
          {Platform.OS === 'web' ? (
            <Text style={s.scoreNumber}>{webNumber}</Text>
          ) : (
            <AnimatedInput
              editable={false}
              defaultValue="0"
              animatedProps={numberProps as never}
              style={s.scoreNumber}
            />
          )}
          <Text style={s.scoreOutOf}>/ 100</Text>
        </View>
      </View>
      <Animated.View entering={FadeIn.delay(reduced ? 0 : 1900).duration(400)} style={s.scoreCopy}>
        <Title center>Your dependency score</Title>
        <Subtitle center>{scoreBlurb(score)}</Subtitle>
      </Animated.View>
      <Animated.View entering={FadeIn.delay(reduced ? 0 : 2300).duration(400)} style={s.bottom}>
        <Cta label="See what’s possible" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

/* ---------------- Freedom date ---------------- */

/** Per-character reveal: y 12 → 0 with a small-element bounce, opacity ease-out. */
const charEnter = (delay: number) => {
  if (Platform.OS === 'web') return FadeIn.delay(delay).duration(260);
  return () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 12 }] },
    animations: {
      opacity: withDelay(delay, withTiming(1, { duration: 260, easing: curves.out })),
      transform: [{ translateY: withDelay(delay, withSpring(0, springs.swap)) }],
    },
  };
  };
};

export function DateStep({ onNext }: { onNext: () => void }) {
  const reduced = useReducedMotion();
  const date = useMemo(() => freedomDate(), []);
  const label = formatFreedomDate(date);
  const chars = useMemo(() => label.split(''), [label]);
  const curve = useSharedValue(0);

  useEffect(() => {
    const total = reduced ? 0 : 500 + chars.length * stagger + 400;
    curve.value = withDelay(
      reduced ? 0 : total,
      withTiming(1, { duration: 1000, easing: curves.dramatic }),
    );
    const t = setTimeout(success, total + 300);
    return () => clearTimeout(t);
  }, [chars.length, curve, reduced]);

  // rewiring curve: simple rising path, drawn left → right
  const CURVE_LEN = 400;
  const curveProps = useAnimatedProps(() => ({
    strokeDashoffset: CURVE_LEN * (1 - curve.value),
  }));
  const markerProps = useAnimatedProps(() => ({
    opacity: curve.value > 0.97 ? withSpring(1, springs.pop) : 0,
  }));

  return (
    <View style={s.center}>
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={s.dateKicker}>Based on your answers, you can be free by</Text>
      </Animated.View>
      <View style={s.dateRow} accessibilityLabel={formatFreedomDateLong(date)}>
        {chars.map((c, i) => (
          <Animated.Text
            key={`${c}-${i}`}
            entering={reduced ? FadeIn.duration(200) : charEnter(500 + i * stagger)}
            style={s.dateChar}>
            {c}
          </Animated.Text>
        ))}
      </View>
      <View style={s.curveWrap}>
        <Svg width="100%" height={120} viewBox="0 0 320 120" preserveAspectRatio="none">
          <AnimatedPath
            d="M8 104 C 90 100, 150 88, 200 62 C 245 39, 280 24, 312 16"
            stroke={palette.accent}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CURVE_LEN}
            animatedProps={curveProps}
          />
          <AnimatedCircle cx={312} cy={16} r={6} fill={palette.accent} animatedProps={markerProps} />
        </Svg>
        <View style={s.curveLabels}>
          <Text style={s.curveLabel}>Today</Text>
          <Text style={[s.curveLabel, { color: palette.accent }]}>Day 90 · {label}</Text>
        </View>
      </View>
      <Animated.View entering={FadeIn.delay(reduced ? 0 : 2200).duration(400)} style={s.bottom}>
        <Cta label="Build my plan" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  analyzeBlock: { alignItems: 'center' },
  analyzePct: {
    color: palette.bright,
    fontSize: 56,
    fontFamily: type.display,
    fontVariant: ['tabular-nums'],
  },
  analyzeSub: {
    color: palette.textDim,
    fontSize: 15,
    fontFamily: type.body,
    marginTop: 2,
    marginBottom: Spacing.five,
  },
  analyzeRows: { gap: Spacing.three, alignSelf: 'stretch', paddingHorizontal: Spacing.two },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  tickBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickBubbleDone: { backgroundColor: palette.accent, borderColor: palette.accent },
  checkLabel: { color: palette.text, fontSize: 16, fontFamily: type.bodyMed },
  checkLabelPending: { color: palette.textFaint },
  ringWrap: { alignSelf: 'center', width: 220, height: 220 },
  ringCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  scoreNumber: {
    color: palette.bright,
    fontSize: 64,
    fontFamily: type.display,
    fontVariant: ['tabular-nums'],
    padding: 0,
    textAlign: 'right',
  },
  scoreOutOf: { color: palette.textFaint, fontSize: 18, fontFamily: type.bodySemi, marginTop: 26 },
  scoreCopy: { marginTop: Spacing.five, gap: Spacing.one, alignItems: 'center' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: Spacing.four },
  dateKicker: { color: palette.textDim, fontSize: 17, textAlign: 'center', fontFamily: type.body },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.three,
    marginBottom: Spacing.five,
  },
  dateChar: {
    color: palette.bright,
    fontSize: 76,
    letterSpacing: -1.5,
    fontFamily: type.display,
    fontVariant: ['tabular-nums'],
  },
  curveWrap: { marginTop: Spacing.two },
  curveLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.one },
  curveLabel: { color: palette.textFaint, fontSize: 13, fontFamily: type.bodySemi },
});
