/** Single- and multi-select option lists for quiz steps. */
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Tap } from '@/components/ui/tap';
import { Spacing } from '@/theme/spacing';
import { palette } from '@/theme/palette';
import { type } from '@/theme/type';
import type { Option } from '../content';
import { Cta } from './chrome';

/** Hold the filled state ~300ms so the selection registers, then advance. */
const CONFIRM_HOLD_MS = 300;

export function SingleSelect({
  options,
  onAnswer,
}: {
  options: Option[];
  onAnswer: (index: number) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const locked = useRef(false);
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}>
      {options.map((o, i) => (
        <Tap
          key={o.label}
          accessibilityRole="button"
          onPress={() => {
            if (locked.current) return;
            locked.current = true;
            setPicked(i);
            setTimeout(() => onAnswer(i), CONFIRM_HOLD_MS);
          }}
          style={[styles.option, picked === i && styles.optionPicked]}>
          <Text style={[styles.optionLabel, picked === i && styles.optionLabelPicked]}>
            {o.label}
          </Text>
        </Tap>
      ))}
    </ScrollView>
  );
}

export function MultiSelect({
  options,
  onAnswer,
}: {
  options: Option[];
  onAnswer: (indexes: number[]) => void;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  return (
    <View style={styles.multiWrap}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}>
        {options.map((o, i) => {
          const on = picked.includes(i);
          return (
            <Tap
              key={o.label}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => setPicked((p) => (on ? p.filter((x) => x !== i) : [...p, i]))}
              style={[styles.option, on && styles.optionPicked]}>
              <Text style={[styles.optionLabel, on && styles.optionLabelPicked]}>{o.label}</Text>
              <View style={[styles.check, on && styles.checkOn]}>
                {on && (
                  <Animated.View entering={FadeIn.duration(120)}>
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
            </Tap>
          );
        })}
      </ScrollView>
      <View style={styles.ctaWrap}>
        <Cta
          label={picked.length > 0 ? `Continue · ${picked.length} selected` : 'Continue'}
          disabled={picked.length === 0}
          onPress={() => onAnswer(picked)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  list: { gap: Spacing.two, paddingBottom: Spacing.two },
  multiWrap: { flex: 1, paddingBottom: Spacing.three },
  ctaWrap: { paddingTop: Spacing.three },
  option: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: palette.surface2,
    borderWidth: 1.5,
    borderColor: palette.surface2,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionPicked: { backgroundColor: palette.accentWash, borderColor: palette.accent },
  optionLabel: { color: palette.text, fontSize: 16, fontFamily: type.bodyMed, flexShrink: 1 },
  optionLabelPicked: { color: palette.accent, fontFamily: type.bodySemi },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: palette.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { borderColor: palette.accent, backgroundColor: palette.accent },
});
