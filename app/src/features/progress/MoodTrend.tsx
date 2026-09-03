import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import type { Checkin } from '@/db/repo/checkins';
import { curves } from '@/theme/motion';
import { palette } from '@/theme/palette';
import { type } from '@/theme/type';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const W = 320;
const H = 120;
const PAD = 12;

/** Mood over the last 30 check-ins; the line draws in once. */
export function MoodTrend({ checkins }: { checkins: Checkin[] }) {
  const reduced = useReducedMotion();
  const pts = [...checkins].reverse().slice(-30);
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    p.set(reduced ? 1 : withTiming(1, { duration: 500, easing: curves.out }));
  }, [p, reduced, pts.length]);
  const LEN = 1200;
  const props = useAnimatedProps(() => ({ strokeDashoffset: LEN * (1 - p.get()) }));

  if (pts.length < 2) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyText}>Two check-ins and your mood line appears here.</Text>
      </View>
    );
  }
  const x = (i: number) => PAD + (i / (pts.length - 1)) * (W - 2 * PAD);
  const y = (m: number) => PAD + (1 - (m - 1) / 4) * (H - 2 * PAD);
  const d = pts.map((c, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(c.mood).toFixed(1)}`).join(' ');

  return (
    <View style={s.wrap}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[1, 3, 5].map((m) => (
          <Line key={m} x1={PAD} x2={W - PAD} y1={y(m)} y2={y(m)} stroke={palette.line} strokeWidth={1} />
        ))}
        <AnimatedPath d={d} stroke={palette.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={LEN} animatedProps={props} />
        <Circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1].mood)} r={4.5} fill={palette.accent} />
      </Svg>
      <View style={s.axis}>
        <Text style={s.axisLabel}>rough</Text>
        <Text style={s.axisLabel}>great</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 4 },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  axisLabel: { color: palette.textFaint, fontSize: 11, fontFamily: type.bodyMed },
  empty: { padding: 16, borderRadius: 12, backgroundColor: palette.surface2 },
  emptyText: { color: palette.textDim, fontSize: 14, fontFamily: type.body },
});
