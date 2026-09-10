import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Tap } from '@/components/ui/tap';
import { useMinuteTick } from '@/lib/clock';
import { durations } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { type } from '@/theme/type';
import { shieldNow, useShield } from './store';

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

  // Not set up yet: one quiet line, until it is. Setting up takes Apple's
  // permission and picker, so Home — not mid-urge — is where to offer it.
  if (shield.available && !shield.setup) {
    return (
      <Animated.View entering={FadeIn.duration(durations.base)} exiting={FadeOut.duration(durations.fast)}>
        <Tap haptic="light" onPress={() => router.push('/shield')} style={s.row} accessibilityRole="button">
          <Text style={s.offer}>Shield the apps that pull you in</Text>
          <Text style={s.chev}>›</Text>
        </Tap>
      </Animated.View>
    );
  }
  if (!shield.ready) return null;

  const state = shieldNow(shield);
  if (!state.up) return null;
  const line = state.until ? `Shield is up until ${state.until}` : 'Shield is up';

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
  offer: { color: palette.textDim, fontSize: 13, fontFamily: type.bodyMed },
  chev: { color: palette.textFaint, fontSize: 16, fontFamily: type.body },
});
