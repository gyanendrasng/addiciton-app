import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { curves, durations } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { PROGRAM_DAYS } from '@/features/onboarding/content';
import { progressThrough } from './timeline';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * The organ that habit wears on, drawn translucent, filling with green from
 * the bottom as the streak runs. One picture, one mechanic, every habit.
 *
 * The fill is progress through the 90-day program — the same number as
 * "Day 12 of 90" — not a measurement of anything. The line beneath names the
 * next documented milestone from the sourced timeline and when it's due, so
 * the picture stays honest: it says how far along you are, not how clean
 * your lungs are.
 */
export type Organ = 'lungs' | 'liver' | 'brain';

export function organFor(habitId: string): Organ {
  if (habitId === 'smoking' || habitId === 'vaping') return 'lungs';
  if (habitId === 'alcohol') return 'liver';
  return 'brain';
}

const ORGAN_NAME: Record<Organ, string> = { lungs: 'Lungs', liver: 'Liver', brain: 'Brain' };

/** All three share a 100 × 100 box; `top`/`bottom` are each shape's own extent, so the fill spans exactly it. */
const SHAPES: Record<Organ, { fill: string[]; lines: string[]; top: number; bottom: number }> = {
  lungs: {
    fill: [
      'M46 34 C38 30 24 36 18 48 C12 60 12 78 20 88 C26 94 42 94 45 87 C48 80 47 52 46 34 Z',
      'M54 34 C62 30 76 36 82 48 C88 60 88 78 80 88 C74 94 58 94 55 87 C52 80 53 52 54 34 Z',
      'M47 10 h6 v26 h-6 Z',
    ],
    lines: ['M50 22 C50 30 44 34 40 40', 'M50 22 C50 30 56 34 60 40'],
    top: 10,
    bottom: 94,
  },
  liver: {
    // The big lobe on the viewer's left, tapering to the small lobe on the right.
    fill: ['M10 40 C10 26 28 20 48 22 L86 28 C92 29 94 37 89 43 C80 56 66 70 48 76 C34 80 20 76 14 64 C10 56 10 48 10 40 Z'],
    lines: ['M60 27 C62 40 60 56 52 72'],
    top: 20,
    bottom: 80,
  },
  brain: {
    fill: [
      'M50 16 C36 12 20 20 18 36 C14 48 20 64 32 70 C36 78 44 80 50 76 C56 80 64 78 68 70 C80 64 86 48 82 36 C80 20 64 12 50 16 Z',
      'M42 74 C40 84 46 90 50 90 C54 90 60 84 58 74 Z',
    ],
    lines: ['M50 18 V74', 'M26 40 C34 38 38 44 40 52', 'M74 40 C66 38 62 44 60 52', 'M30 58 C36 56 42 60 44 66', 'M70 58 C64 56 58 60 56 66'],
    top: 12,
    bottom: 90,
  },
};

/** The drawing on its own: a translucent organ with `progress` (0–1) of it filled green. */
export function OrganPicture({ organ, progress, size, animate = true }: { organ: Organ; progress: number; size: number; animate?: boolean }) {
  const reduced = useReducedMotion();
  const level = useSharedValue(animate && !reduced ? 0 : progress);

  useEffect(() => {
    if (reduced || !animate) {
      level.set(progress);
      return;
    }
    // The fill rises after the screen has settled, once — the hero motion.
    level.set(withDelay(durations.base, withTiming(progress, { duration: durations.reveal, easing: curves.out })));
  }, [animate, level, progress, reduced]);

  const shape = SHAPES[organ];
  const rect = useAnimatedProps(() => {
    const h = (shape.bottom - shape.top) * level.get();
    return { y: shape.bottom - h, height: h };
  });

  const clipId = `organ-${organ}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id={clipId}>
          {shape.fill.map((d, i) => (
            <Path key={i} d={d} />
          ))}
        </ClipPath>
      </Defs>
      {/* translucent body */}
      <G>
        {shape.fill.map((d, i) => (
          <Path key={i} d={d} fill={hues.pledge.wash} />
        ))}
      </G>
      {/* the green rising inside it */}
      <AnimatedRect x={0} width={100} fill={palette.accent} clipPath={`url(#${clipId})`} animatedProps={rect} />
      {/* outline and detail, drawn over the fill */}
      <G fill="none" stroke={palette.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {shape.fill.map((d, i) => (
          <Path key={`o${i}`} d={d} />
        ))}
        {shape.lines.map((d, i) => (
          <Path key={`l${i}`} d={d} opacity={0.55} />
        ))}
      </G>
    </Svg>
  );
}

/**
 * The organ with its words: name, how far through the program, and the next
 * documented milestone. `hoursClean` is that habit's own streak.
 */
export function OrganFill({ habitId, habitLabel, hoursClean, size = 88, animate = true }: { habitId: string; habitLabel?: string; hoursClean: number; size?: number; animate?: boolean }) {
  const organ = organFor(habitId);
  const progress = Math.max(0, Math.min(1, hoursClean / (PROGRAM_DAYS * 24)));
  const next = progressThrough(habitId, hoursClean).find((m): m is typeof m & { short: string } => !m.reached && typeof m.short === 'string');
  const dueDays = next ? Math.max(1, Math.ceil((next.at - hoursClean) / 24)) : null;

  return (
    <View style={s.row} accessibilityLabel={`${ORGAN_NAME[organ]}, ${Math.round(progress * 100)} percent through the 90 days${next ? `. Next: ${next.short} in ${dueDays} days` : ''}`}>
      <OrganPicture organ={organ} progress={progress} size={size} animate={animate} />
      <View style={s.words}>
        <Text style={s.name}>
          {ORGAN_NAME[organ]}
          {habitLabel ? <Text style={s.habit}> · {habitLabel}</Text> : null}
        </Text>
        <Text style={s.pct}>
          <Text style={s.pctStrong}>{Math.round(progress * 100)}%</Text> through the 90 days
        </Text>
        {next ? (
          <Text style={s.next}>
            Next: {next.short.toLowerCase()} · in {dueDays} {dueDays === 1 ? 'day' : 'days'}
          </Text>
        ) : (
          <Text style={s.next}>Every milestone in the program reached.</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  words: { flex: 1, gap: 3 },
  name: { color: palette.text, fontSize: 17, fontFamily: type.bodySemi },
  habit: { color: palette.textDim, fontFamily: type.body },
  pct: { color: palette.textDim, fontSize: 14, fontFamily: type.body, fontVariant: ['tabular-nums'] },
  pctStrong: { color: palette.accent, fontSize: 20, fontFamily: type.display },
  next: { color: palette.textFaint, fontSize: 13, fontFamily: type.bodyMed, fontVariant: ['tabular-nums'] },
});
