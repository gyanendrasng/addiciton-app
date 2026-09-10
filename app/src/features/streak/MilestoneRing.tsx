import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { curves } from '@/theme/motion';
import { palette } from '@/theme/palette';
import { type } from '@/theme/type';
import type { Tier } from './tiers';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Progress from the current tier to the next. Fill animates on change; never loops. */
export function MilestoneRing({
  progress,
  tier,
  next,
  size = 132,
}: {
  progress: number;
  tier: Tier | null;
  next: Tier | null;
  size?: number;
}) {
  const reduced = useReducedMotion();
  const r = size / 2 - 8;
  // The label sits inside the stroke. At the Home size (96) the inner circle is
  // ~80pt across and "to Momentum" at 12pt is wider than that — it overflowed
  // the ring. Type scales with the ring and the label is boxed to the chord
  // width just above centre, shrinking rather than spilling.
  const inner = (r - 4) * 2;
  const labelWidth = Math.round(inner * 0.9);
  const pctSize = Math.round(size * 0.18);
  const labelSize = Math.max(10, Math.round(size * 0.115));
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(reduced ? progress : 0);
  useEffect(() => {
    p.set(reduced ? progress : withTiming(progress, { duration: 900, easing: curves.height }));
  }, [p, progress, reduced]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.get()) }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={palette.surface3} strokeWidth={8} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={palette.accent}
          strokeWidth={8}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          animatedProps={props}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={s.center}>
        <Text style={[s.tier, { fontSize: pctSize }]}>{Math.round(progress * 100)}%</Text>
        <Text
          style={[s.next, { fontSize: labelSize, maxWidth: labelWidth }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}>
          {next ? `to ${next.name}` : tier ? tier.name : ''}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  tier: { color: palette.text, fontFamily: type.displayMed, fontVariant: ['tabular-nums'] },
  next: { color: palette.textFaint, fontFamily: type.bodyMed, marginTop: 2, textAlign: 'center' },
});
