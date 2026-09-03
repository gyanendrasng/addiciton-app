import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { Streak } from '@/lib/streak';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const two = (n: number) => String(n).padStart(2, '0');

/** The number that matters. Settles once on mount; static at rest. */
export function StreakHero({ streak }: { streak: Streak }) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={s.wrap} accessibilityRole="header">
      <View style={s.row}>
        <Unit value={String(streak.days)} label={streak.days === 1 ? 'day' : 'days'} big />
        <Unit value={two(streak.hours)} label="hrs" />
        <Unit value={two(streak.minutes)} label="min" />
      </View>
      <Text style={s.caption}>clean, and counting</Text>
    </Animated.View>
  );
}

function Unit({ value, label, big }: { value: string; label: string; big?: boolean }) {
  return (
    <View style={s.unit}>
      <Text style={[s.value, big && s.valueBig]}>{value}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.three },
  unit: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  value: {
    color: palette.text,
    fontSize: 34,
    fontFamily: type.display,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  valueBig: { fontSize: 84, color: palette.bright, letterSpacing: -2.5, lineHeight: 88 },
  label: { color: palette.textDim, fontSize: 14, fontFamily: type.bodyMed },
  caption: { color: palette.textFaint, fontSize: 14, fontFamily: type.body },
});
