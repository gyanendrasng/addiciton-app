import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Tap } from '@/components/ui/tap';
import { useMinuteTick } from '@/lib/clock';
import { durations } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { fmtTime } from './format';
import { LOCK_CHOICES_MIN, startLock, useShield } from './store';

/**
 * "Shield for 15 / 30 / 60 min", for the urge flow's Delay step.
 *
 * Renders nothing until Shield is set up — the step stays about the two
 * minutes, and a feature that isn't configured gets no space. Once a lock is
 * running the chips give way to when it lifts, so a second tap can't stack.
 */
export function LockChips() {
  const shield = useShield();
  useMinuteTick();
  if (!shield.ready) return null;
  return (
    <Animated.View entering={FadeIn.duration(durations.base)} layout={LinearTransition.duration(durations.fast)} style={s.wrap}>
      {shield.lock ? (
        <Text style={s.status}>Shield is up until {fmtTime(shield.lock.until)}</Text>
      ) : (
        <>
          <Text style={s.label}>Shield the apps too</Text>
          <View style={s.chips}>
            {LOCK_CHOICES_MIN.map((m) => (
              <Tap
                key={m}
                haptic="medium"
                onPress={() => void startLock(m)}
                style={s.chip}
                accessibilityRole="button"
                accessibilityLabel={`Shield for ${m} minutes`}>
                <Text style={s.chipLabel}>{m === 60 ? '1 h' : `${m} min`}</Text>
              </Tap>
            ))}
          </View>
        </>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  label: { color: palette.textDim, fontSize: 13, fontFamily: type.bodyMed },
  status: { color: palette.textDim, fontSize: 14, fontFamily: type.bodyMed, fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', gap: Spacing.two },
  chip: { minHeight: 44, minWidth: 72, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: hues.urge.wash },
  chipLabel: { color: hues.urge.solid, fontSize: 15, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'] },
});
