import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Tap } from '@/components/ui/tap';
import { nowDate, useMinuteTick } from '@/lib/clock';
import { durations } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { type } from '@/theme/type';
import { fmtHour, fmtTime } from './format';
import { useShield } from './store';

/**
 * One line on Home while the shield is up, so it's never a surprise.
 *
 * A lock started by hand has an end time in the store; the daily window is
 * run by the extension without telling the app, so "up" is inferred from the
 * clock and the schedule the user set.
 */
export function ShieldStatus() {
  const router = useRouter();
  const shield = useShield();
  useMinuteTick();
  if (!shield.ready) return null;

  let line: string | null = null;
  if (shield.lock) {
    line = `Shield is up until ${fmtTime(shield.lock.until)}`;
  } else if (shield.window?.on) {
    const h = nowDate().getHours();
    const end = Math.min(24, shield.window.startHour + shield.window.hours);
    if (h >= shield.window.startHour && h < end) line = `Shield is up until ${fmtHour(end)}`;
  }
  if (!line) return null;

  return (
    <Animated.View entering={FadeIn.duration(durations.base)} exiting={FadeOut.duration(durations.fast)}>
      <Tap haptic="light" onPress={() => router.push('/shield')} style={s.row} accessibilityRole="button">
        <Text style={s.text}>{line}</Text>
        <Text style={s.chev}>›</Text>
      </Tap>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: -8 },
  text: { color: hues.urge.solid, fontSize: 13, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'] },
  chev: { color: palette.textFaint, fontSize: 16, fontFamily: type.body },
});
