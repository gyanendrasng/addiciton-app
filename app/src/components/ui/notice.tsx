import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { SymbolChip } from './symbol-chip';

/**
 * Inline message for a failure or a caveat.
 *
 * Bare red text under a field reads like a crash report. A notice gives the
 * message a container, an icon and its own colour so it registers as part of
 * the design — and so the wording has room to explain what to do next.
 */
export function Notice({
  children,
  tone = 'error',
}: {
  children: React.ReactNode;
  tone?: 'error' | 'warn' | 'info';
}) {
  const t = TONES[tone];
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(120)}
      layout={LinearTransition.duration(180)}
      accessibilityLiveRegion="polite"
      style={[s.row, { backgroundColor: t.wash, borderColor: t.line }]}>
      <SymbolChip name={t.symbol} tint={t.tint} wash="transparent" size={22} />
      <Text style={[s.text, { color: t.text }]}>{children}</Text>
    </Animated.View>
  );
}

const TONES = {
  error: {
    symbol: 'exclamationmark.circle.fill' as const,
    tint: palette.danger,
    text: palette.text,
    wash: 'rgba(240,100,90,0.10)',
    line: 'rgba(240,100,90,0.28)',
  },
  warn: {
    symbol: 'exclamationmark.triangle.fill' as const,
    tint: palette.amber,
    text: palette.text,
    wash: palette.amberWash,
    line: 'rgba(245,181,68,0.28)',
  },
  info: {
    symbol: 'info.circle.fill' as const,
    tint: palette.textDim,
    text: palette.textDim,
    wash: palette.surface2,
    line: palette.line,
  },
} as const;

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  text: { flex: 1, fontSize: 14, lineHeight: 20, fontFamily: type.bodyMed, marginTop: 1 },
});
