import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Tap } from '@/components/ui/tap';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

/** Shows a ghost "Skip" only after `afterMs`. */
export function SkipLater({ afterMs, onSkip }: { afterMs: number; onSkip: () => void }) {
  const [show, setShow] = useState(afterMs === 0);
  useEffect(() => {
    if (afterMs === 0) return;
    const t = setTimeout(() => setShow(true), afterMs);
    return () => clearTimeout(t);
  }, [afterMs]);
  if (!show) return <View style={s.skipSlot} />;
  return (
    <Animated.View entering={FadeIn.duration(300)} style={s.skipSlot}>
      <Tap haptic="none" onPress={onSkip} style={s.skip} accessibilityRole="button">
        <Text style={s.skipLabel}>Skip</Text>
      </Tap>
    </Animated.View>
  );
}

export function StepHeader({ kicker, title, center }: { kicker: string; title: string; center?: boolean }) {
  return (
    <View style={[{ gap: Spacing.one }, center && { alignItems: 'center' }]}>
      <Text style={s.kicker}>{kicker}</Text>
      <Text style={[s.title, center && { textAlign: 'center' }]}>{title}</Text>
    </View>
  );
}

/** Where you are in the toolkit: five steps, current one lit. */
export function StepDots({ index }: { index: number }) {
  return (
    <View style={s.dots} accessibilityLabel={`step ${index + 1} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <View key={i} style={[s.dot, i < index && s.dotDone, i === index && s.dotNow]} />
      ))}
    </View>
  );
}

export const shared = StyleSheet.create({
  pane: { flex: 1, padding: Spacing.four, gap: Spacing.four },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

const s = StyleSheet.create({
  skipSlot: { height: 44, alignItems: 'center', justifyContent: 'center' },
  skip: { paddingHorizontal: 16, paddingVertical: 8 },
  skipLabel: { color: palette.textDim, fontSize: 15, fontFamily: type.bodyMed },
  kicker: { color: palette.accent, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: type.bodySemi },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingVertical: Spacing.two },
  dot: { width: 22, height: 4, borderRadius: 2, backgroundColor: palette.surface3 },
  dotDone: { backgroundColor: palette.accentDeep },
  dotNow: { backgroundColor: palette.accent },
  title: { color: palette.text, fontSize: 26, lineHeight: 32, letterSpacing: -0.4, fontFamily: type.display },
});
