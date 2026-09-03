import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import { markCelebrated } from '@/db/repo/milestones';
import { Cta } from '@/features/onboarding/components/chrome';
import { TIERS } from '@/features/streak/tiers';
import { curves, springs, stagger } from '@/theme/motion';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const RAYS = 12;
const SIZE = 320;
const R0 = 96;
const R1 = 140;

/** The one earned celebration: badge enters, container squash-stretches, rays draw, number counts. */
export default function MilestoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { tier: tierParam, period } = useLocalSearchParams<{ tier?: string; period?: string }>();
  const days = Number(tierParam ?? 0);
  const tier = TIERS.find((t) => t.days === days) ?? { days, name: 'Milestone' };
  const periodStart = Number(period ?? 0);

  const badge = useSharedValue(reduced ? 1 : 0);
  const squash = useSharedValue(1);
  const [count, setCount] = useState(reduced ? days : 0);

  useEffect(() => {
    if (reduced) return;
    badge.set(withSpring(1, springs.hero));
    squash.set(
      withDelay(
        250,
        withSequence(
          withTiming(0.97, { duration: 106, easing: curves.out }),
          withTiming(1.01, { duration: 212, easing: curves.out }),
          withTiming(1, { duration: 212, easing: curves.out }),
        ),
      ),
    );
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    // count-up, decelerating
    const start = Date.now();
    const dur = 900;
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * days));
      if (t >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badge.get(),
    transform: [{ scale: 0.9 + 0.1 * badge.get() }, { scale: squash.get() }],
  }));

  return (
    <View style={[s.root, { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={s.center}>
        <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={StyleSheet.absoluteFill}>
            {Array.from({ length: RAYS }, (_, i) => (
              <Ray key={i} i={i} reduced={reduced} />
            ))}
          </Svg>
          <Animated.View style={[s.badge, badgeStyle]}>
            <Text style={s.days}>{count}</Text>
            <Text style={s.daysLabel}>{days === 1 ? 'day' : 'days'}</Text>
          </Animated.View>
        </View>
        <Animated.View entering={FadeIn.delay(reduced ? 0 : 500).duration(400)} style={s.copy}>
          <Text style={s.kicker}>Milestone reached</Text>
          <Text style={s.name}>{tier.name}</Text>
          <Text style={s.sub}>{blurb(days)}</Text>
        </Animated.View>
      </View>
      <Animated.View entering={FadeIn.delay(reduced ? 0 : 900).duration(300)} style={{ paddingHorizontal: Spacing.four }}>
        <Cta
          label="Keep going"
          onPress={async () => {
            if (periodStart) await markCelebrated(days, periodStart);
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
        />
      </Animated.View>
    </View>
  );
}

function Ray({ i, reduced }: { i: number; reduced: boolean }) {
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) p.set(withDelay(300 + i * stagger, withTiming(1, { duration: 420, easing: curves.out })));
  }, [i, p, reduced]);
  const a = (i / RAYS) * Math.PI * 2 - Math.PI / 2;
  const c = SIZE / 2;
  const x0 = c + Math.cos(a) * R0;
  const y0 = c + Math.sin(a) * R0;
  const x1 = c + Math.cos(a) * R1;
  const y1 = c + Math.sin(a) * R1;
  const len = R1 - R0;
  const props = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - p.get()) }));
  return (
    <AnimatedLine
      x1={x0}
      y1={y0}
      x2={x1}
      y2={y1}
      stroke={i % 2 ? palette.accentDeep : palette.accent}
      strokeWidth={4}
      strokeLinecap="round"
      strokeDasharray={len}
      animatedProps={props}
    />
  );
}

function blurb(days: number) {
  if (days <= 1) return 'The first day is the hardest one to start. You started.';
  if (days <= 3) return 'Withdrawal is loudest right about now. You’re through the worst of the noise.';
  if (days <= 7) return 'A full week. Your baseline is already shifting.';
  if (days <= 14) return 'Two weeks — dopamine receptors are measurably recovering.';
  if (days <= 30) return 'A month. This is where habits stop being a fight and start being who you are.';
  if (days <= 60) return 'Two months. Clarity, energy, focus — you’ve earned all of it.';
  if (days <= 90) return 'Ninety days. The program is complete. You are rewired.';
  return 'Beyond the program now. This is just how you live.';
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  badge: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  days: { color: palette.accentInk, fontSize: 64, fontFamily: type.display, fontVariant: ['tabular-nums'], letterSpacing: -2, lineHeight: 68 },
  daysLabel: { color: palette.accentInk, fontSize: 15, fontFamily: type.bodySemi, marginTop: -4 },
  copy: { alignItems: 'center', gap: Spacing.one, paddingHorizontal: Spacing.five },
  kicker: { color: palette.accent, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: type.bodySemi },
  name: { color: palette.bright, fontSize: 40, fontFamily: type.display, letterSpacing: -0.8 },
  sub: { color: palette.textDim, fontSize: 15, fontFamily: type.body, textAlign: 'center', lineHeight: 22, marginTop: Spacing.one },
});
