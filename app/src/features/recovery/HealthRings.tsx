import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { TICK_PATH } from '@/components/ui/tick';

import { curves } from '@/theme/motion';
import type { HealthRing } from '@/features/recovery/timeline';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * One ring: how far the streak has come toward a documented milestone.
 *
 * The fill is a reveal, not a live readout, so it eases out on mount and then
 * stays still. Reduced motion draws it at its final value immediately.
 */
function Ring({
  entry,
  index,
  size,
  animate,
}: {
  entry: HealthRing;
  index: number;
  size: number;
  animate: boolean;
}) {
  const reduced = useReducedMotion();
  const stroke = Math.round(size * 0.076);
  const still = reduced || !animate;
  const r = size / 2 - stroke;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(still ? entry.progress : 0);

  useEffect(() => {
    p.set(
      still
        ? entry.progress
        : withDelay(index * 40, withTiming(entry.progress, { duration: 900, easing: curves.height })),
    );
  }, [p, entry.progress, index, still]);

  const animated = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.get()) }));

  return (
    <View style={[s.cell, { width: size + 24 }]}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={palette.surface3} strokeWidth={stroke} fill="none" />
          {/* Accent from the first percent: a grey arc reads as "nothing yet",
              which is the opposite of what a 2% ring on day two is saying. */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={palette.accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circ}
            animatedProps={animated}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          {/* The same drawn mark as everywhere else, scaled into the ring's
              inner box and sharing the arc's stroke weight and round caps. */}
          {entry.reached ? (
            <Path
              d={TICK_PATH}
              stroke={palette.accent}
              strokeWidth={(stroke / (size * 0.46)) * 24}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              transform={`translate(${size * 0.27} ${size * 0.27}) scale(${(size * 0.46) / 24})`}
            />
          ) : null}
        </Svg>
        {entry.reached ? null : (
          <View style={s.center}>
            <Text style={[s.pct, { fontSize: size < 80 ? 14 : 17 }]}>{Math.round(entry.progress * 100)}%</Text>
          </View>
        )}
      </View>
      <Text style={[s.label, { fontSize: size < 80 ? 12 : 14 }]} numberOfLines={1}>
        {entry.short}
      </Text>
      {size >= 80 ? <Text style={s.at}>{entry.reached ? 'reached' : `at ${entry.title}`}</Text> : null}
    </View>
  );
}

/**
 * A few things worth waiting for, as progress rings.
 *
 * These show how far the streak has come toward milestones that are already in
 * the sourced timeline -- they are not a measurement of anyone's actual risk,
 * and the caption on the screen says so plainly. Nothing here is a promise.
 */
export function HealthRings({
  rings,
  size = 92,
  animate = true,
}: {
  rings: HealthRing[];
  size?: number;
  /** Home shows these on every visit, so it opts out — motion earns its keep by being rare. */
  animate?: boolean;
}) {
  if (rings.length === 0) return null;
  return (
    <View style={s.grid}>
      {rings.map((e, i) => (
        <Ring key={e.title + e.short} entry={e} index={i} size={size} animate={animate} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: Spacing.five },
  cell: { alignItems: 'center' },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  pct: { color: palette.text, fontFamily: type.displayMed, fontVariant: ['tabular-nums'] },
  label: { color: palette.text, fontFamily: type.bodyMed, marginTop: Spacing.two, textAlign: 'center' },
  at: {
    color: palette.textFaint,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: type.body,
    marginTop: 2,
    textAlign: 'center',
  },
});
