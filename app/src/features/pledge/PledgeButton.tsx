import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { pledge, usePledged } from '@/db/repo/pledges';
import { HueIcon, tileStyles } from '@/components/ui/action-tile';
import { curves, springs } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const HOLD_MS = 1800;

/**
 * Press-and-hold to pledge. Linear fill over 1.8s (mechanical → linear is correct);
 * early release springs back; completion squash-stretches and morphs the label.
 */
export function PledgeButton({ date, compact = false }: { date: string; compact?: boolean }) {
  const { pledged, loading } = usePledged(date);
  const reduced = useReducedMotion();
  const [justPledged, setJustPledged] = useState(false);
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  // shared value (not a ref) so gesture callbacks can read the latest without the render-ref lint
  const pledgedSv = useSharedValue(pledged);
  useEffect(() => {
    pledgedSv.set(pledged);
  }, [pledged, pledgedSv]);

  const commit = async () => {
    if (pledgedSv.get()) return;
    pledgedSv.set(true);
    await pledge(date);
    setJustPledged(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    scale.set(
      withSequence(
        withTiming(0.97, { duration: 106, easing: curves.out }),
        withTiming(1.01, { duration: 212, easing: curves.out }),
        withTiming(1, { duration: 212, easing: curves.out }),
      ),
    );
  };

  const hold = Gesture.LongPress()
    .minDuration(HOLD_MS)
    .maxDistance(40)
    .runOnJS(true)
    .onBegin(() => {
      if (pledgedSv.get()) return;
      progress.set(withTiming(1, { duration: HOLD_MS, easing: curves.linear }));
      scale.set(withSpring(0.97, springs.press));
    })
    .onStart(() => {
      commit();
    })
    .onFinalize((_e, success) => {
      scale.set(withSpring(1, springs.press));
      if (!success) progress.set(withSpring(0, springs.swap));
    });

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  if (loading) return <View style={compact ? tileStyles.tile : s.btn} />;

  if (compact) {
    const h = hues.pledge;
    if (pledged) {
      return (
        <Animated.View
          entering={justPledged && !reduced ? FadeIn.duration(200) : undefined}
          style={[tileStyles.tile, { backgroundColor: h.solid }, scaleStyle]}>
          <View style={s.tileIcon}><HueIcon hue="pledge" color={h.ink} /></View>
          <View style={{ flex: 1 }} />
          <Text numberOfLines={1} style={[s.tileLabel, { color: h.ink }]}>Pledged ✓</Text>
          <Text numberOfLines={1} style={[s.tileStatus, { color: h.ink }]}>for today</Text>
        </Animated.View>
      );
    }
    return (
      <GestureDetector gesture={hold}>
        <Animated.View
          style={[tileStyles.tile, { backgroundColor: palette.surface2, overflow: 'hidden' }, scaleStyle]}
          accessibilityRole="button"
          accessibilityLabel="Hold to pledge">
          <Animated.View style={[s.fill, { backgroundColor: h.wash }, fillStyle]} />
          <View style={s.tileIcon}><HueIcon hue="pledge" color={h.solid} /></View>
          <View style={{ flex: 1 }} />
          <Text numberOfLines={1} style={[s.tileLabel, { color: palette.text }]}>Pledge</Text>
          <Text numberOfLines={1} style={[s.tileStatus, { color: palette.textDim }]}>press & hold</Text>
        </Animated.View>
      </GestureDetector>
    );
  }

  if (pledged) {
    return (
      <Animated.View entering={justPledged && !reduced ? FadeIn.duration(200) : undefined} style={[s.btn, s.done, scaleStyle]}>
        <Text style={s.doneLabel}>Pledged for today ✓</Text>
        <Text style={s.doneSub}>One day at a time.</Text>
      </Animated.View>
    );
  }

  return (
    <GestureDetector gesture={hold}>
      <Animated.View style={[s.btn, scaleStyle]} accessibilityRole="button" accessibilityLabel="Hold to pledge">
        <Animated.View style={[s.fill, fillStyle]} />
        <Text style={s.label}>Hold to pledge</Text>
        <Text style={s.sub}>I stay clean today.</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const s = StyleSheet.create({
  btn: {
    minHeight: 76,
    borderRadius: 18,
    backgroundColor: palette.surface2,
    borderWidth: 1.5,
    borderColor: palette.line,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: Spacing.three,
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: palette.accentWash },
  label: { color: palette.text, fontSize: 17, fontFamily: type.bodySemi },
  sub: { color: palette.textDim, fontSize: 13, fontFamily: type.body, marginTop: 2 },
  done: { backgroundColor: palette.accentWash, borderColor: palette.accent },
  tileIcon: { height: 24, justifyContent: 'center' },
  tileLabel: { fontSize: 16, fontFamily: type.bodySemi },
  tileStatus: { fontSize: 12, fontFamily: type.bodyMed },
  doneLabel: { color: palette.accent, fontSize: 17, fontFamily: type.bodySemi },
  doneSub: { color: palette.textDim, fontSize: 13, fontFamily: type.body, marginTop: 2 },
});
