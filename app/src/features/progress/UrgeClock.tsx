import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import type { Urge } from '@/db/repo/urges';
import { curves } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const W = 320;
const H = 120;
const PAD = 12;
const BUCKETS = 12; // two hours each -- 24 bars are unreadable at this width

/** "8pm", "12am" -- the way someone says a time, not 20:00. */
function hourLabel(h: number): string {
  const norm = ((h % 24) + 24) % 24;
  if (norm === 0) return '12am';
  if (norm === 12) return '12pm';
  return norm < 12 ? `${norm}am` : `${norm - 12}pm`;
}

export function bucketUrges(urges: Urge[]): number[] {
  const out = Array.from({ length: BUCKETS }, () => 0);
  for (const u of urges) out[Math.floor(new Date(u.createdAt).getHours() / 2)] += 1;
  return out;
}

/**
 * Every urge, by the hour it arrived.
 *
 * The point is not the count -- it is that urges have a shape. Someone who can
 * see that theirs land between 9 and 11pm can plan for 8:30, which is the one
 * thing a streak number can never tell them.
 *
 * Outcome is deliberately not encoded here. Splitting each bar into survived
 * and slipped needed a second tone, and every tint of the urge hue light enough
 * to read as "the other one" measures under 1.3:1 against the card -- far below
 * the 3:1 a meaningful graphic owes. Survived and slipped are already counted in
 * the tiles above; this chart answers *when*, and only that.
 */
export function UrgeClock({ urges }: { urges: Urge[] }) {
  const reduced = useReducedMotion();
  const grow = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    grow.set(reduced ? 1 : withDelay(80, withTiming(1, { duration: 520, easing: curves.out })));
  }, [grow, reduced, urges.length]);

  if (urges.length < 3) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyText}>
          Once you&apos;ve logged a few urges, the hours they arrive in show up here.
        </Text>
      </View>
    );
  }

  const buckets = bucketUrges(urges);
  const peak = Math.max(...buckets);
  const inner = W - PAD * 2;
  const slot = inner / BUCKETS;
  const barW = slot * 0.72;
  const base = H - PAD - 14; // room for the hour labels
  const scale = (n: number) => (n / peak) * (base - PAD);

  // Only claim a pattern when there is one: a clear peak, on enough urges.
  const top = buckets.reduce((best, n, i) => (n > buckets[best] ? i : best), 0);
  const pattern = urges.length >= 6 && buckets[top] >= 2;

  return (
    <View style={s.wrap}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Line x1={PAD} x2={W - PAD} y1={base} y2={base} stroke={palette.line} strokeWidth={1} />
        {buckets.map((b, i) =>
          b === 0 ? (
            <Rect
              key={`o-${i}`}
              x={PAD + i * slot + (slot - barW) / 2}
              y={base - 2}
              width={barW}
              height={2}
              rx={1}
              fill={palette.line}
            />
          ) : null,
        )}
        {buckets.map((n, i) =>
          n === 0 ? null : (
            <Bar
              key={i}
              x={PAD + i * slot + (slot - barW) / 2}
              width={barW}
              base={base}
              full={scale(n)}
              grow={grow}
              index={i}
              reduced={reduced}
            />
          ),
        )}
        <SvgText
          x={PAD + top * slot + slot / 2}
          y={base - scale(buckets[top]) - 5}
          fill={palette.textDim}
          fontSize={10}
          textAnchor="middle">
          {buckets[top]}
        </SvgText>
        {[0, 3, 6, 9].map((i) => (
          <SvgText
            key={i}
            x={PAD + i * slot + slot / 2}
            y={H - 2}
            fill={palette.textFaint}
            fontSize={10}
            textAnchor="middle">
            {hourLabel(i * 2)}
          </SvgText>
        ))}
      </Svg>
      <Text style={s.caption}>
        {pattern
          ? `Most of yours arrive between ${hourLabel(top * 2)} and ${hourLabel(top * 2 + 2)}.`
          : `${urges.length} logged so far, spread across the day.`}
      </Text>
    </View>
  );
}

function Bar({
  x, width, base, full, grow, index, reduced,
}: {
  x: number; width: number; base: number; full: number;
  grow: SharedValue<number>; index: number; reduced: boolean;
}) {
  // Each bar is a hair behind the one before it, left to right, like a clock.
  const lag = reduced ? 0 : Math.min(0.5, index * 0.04);
  const at = useAnimatedProps(() => {
    const t = Math.max(0, Math.min(1, (grow.get() - lag) / (1 - lag)));
    return { height: full * t, y: base - full * t };
  });
  return <AnimatedRect x={x} width={width} rx={3} fill={hues.urge.solid} animatedProps={at} />;
}

const s = StyleSheet.create({
  wrap: { gap: Spacing.two },
  caption: { color: palette.textDim, fontSize: 13, fontFamily: type.body },
  empty: { paddingVertical: Spacing.four },
  emptyText: { color: palette.textFaint, fontSize: 14, lineHeight: 20, fontFamily: type.body },
});
