/** Signature, notifications, and soft paywall steps. */
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Tap } from '@/components/ui/tap';
import { Spacing } from '@/theme/spacing';
import { palette } from '@/theme/palette';
import { type } from '@/theme/type';
import {
  requestReminderPermission,
  scheduleDailyReminders,
} from '@/features/notifications';
import { formatFreedomDateLong, freedomDate } from '../lib';
import { Cta, Subtitle, Title } from './chrome';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function Signature({ onNext }: { onNext: () => void }) {
  const d = useSharedValue('');
  const [webD, setWebD] = useState('');
  const [hasInk, setHasInk] = useState(false);
  const [padSize, setPadSize] = useState({ w: 0, h: 0 });
  const date = useMemo(() => formatFreedomDateLong(freedomDate()), []);

  const isWeb = Platform.OS === 'web';
  const beginStroke = (x: number, y: number) => {
    setHasInk(true);
    if (isWeb) setWebD((prev) => `${prev} M ${x.toFixed(1)} ${y.toFixed(1)}`);
  };
  const extendStroke = (x: number, y: number) => {
    if (isWeb) setWebD((prev) => `${prev} L ${x.toFixed(1)} ${y.toFixed(1)}`);
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      'worklet';
      d.value = `${d.value} M ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
      runOnJS(beginStroke)(e.x, e.y);
    })
    .onUpdate((e) => {
      'worklet';
      d.value = `${d.value} L ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
      runOnJS(extendStroke)(e.x, e.y);
    });

  const inkProps = useAnimatedProps(() => ({ d: d.value || 'M 0 0' }));

  return (
    <View style={s.wrap}>
      <View style={{ paddingTop: Spacing.six }}>
        <Animated.View entering={FadeIn.duration(350)}>
          <Title>Sign it.</Title>
          <Subtitle>“I commit to becoming free by {date}.”</Subtitle>
        </Animated.View>
      </View>
      <GestureDetector gesture={pan}>
        <View
          style={s.pad}
          collapsable={false}
          onLayout={(e) =>
            setPadSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
          }>
          <Svg
            width={padSize.w || 1}
            height={padSize.h || 1}
            style={StyleSheet.absoluteFill}
            pointerEvents="none">
            {isWeb ? (
              <Path
                d={webD || 'M 0 0'}
                stroke={palette.text}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : (
              <AnimatedPath
                animatedProps={inkProps}
                stroke={palette.text}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </Svg>
          {!hasInk && (
            <Text style={s.padHint} pointerEvents="none">
              Sign with your finger
            </Text>
          )}
          <View style={s.padLine} pointerEvents="none" />
        </View>
      </GestureDetector>
      <View style={{ gap: Spacing.two }}>
        <Cta
          label="I commit"
          onPress={() => {
            if (!hasInk) return;
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {}
            onNext();
          }}
        />
        <Cta
          label="Clear"
          variant="ghost"
          onPress={() => {
            d.set('');
            setWebD('');
            setHasInk(false);
          }}
        />
      </View>
    </View>
  );
}

export function Notifications({ onNext }: { onNext: () => void }) {
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  // Only ever fired by a deliberate tap: iOS shows its sheet once per install,
  // and a denial here is effectively permanent.
  async function enable() {
    if (busy) return;
    setBusy(true);
    try {
      const outcome = await requestReminderPermission();
      if (outcome === 'granted') {
        await scheduleDailyReminders();
        onNext();
        return;
      }
      // Denied or dismissed — don't trap the user, but say what happened.
      setDenied(true);
      setBusy(false);
    } catch {
      // Never block onboarding on a notification failure.
      onNext();
    }
  }

  return (
    <View style={s.wrap}>
      <View style={s.centerBlock}>
        <Animated.View entering={FadeIn.duration(350)}>
          <Title>Streaks survive on reminders.</Title>
          <Subtitle>
            One nudge for your morning pledge, one for the evening check-in. Nothing else — no
            spam, no “deals”.
          </Subtitle>
          {denied ? (
            <Text style={s.notifNote}>
              Reminders are off. You can turn them on any time in Settings › Notifications.
            </Text>
          ) : null}
        </Animated.View>
      </View>
      <View style={{ gap: Spacing.two }}>
        <Cta
          label={busy ? 'Just a moment…' : denied ? 'Continue' : 'Turn on reminders'}
          onPress={denied ? onNext : enable}
          disabled={busy}
        />
        {!denied ? <Cta label="Maybe later" variant="ghost" onPress={onNext} /> : null}
      </View>
    </View>
  );
}

const PLANS = [
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$29.99',
    period: '/yr',
    sub: 'Just $2.50/mo, billed yearly',
    badge: 'SAVE 75%',
    trial: true,
    cta: 'Start 7-day free trial',
    note: '7 days free, then $29.99/yr. Cancel anytime.',
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$49.99',
    period: ' once',
    sub: 'Pay once, keep it forever',
    badge: 'BEST VALUE',
    trial: false,
    cta: 'Get lifetime access',
    note: 'One payment of $49.99. No subscription.',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$9.99',
    period: '/mo',
    sub: 'Flexible, cancel any time',
    badge: undefined,
    trial: false,
    cta: 'Subscribe monthly',
    note: '$9.99 per month. Cancel anytime.',
  },
] as const;

const BENEFITS = [
  'The full 90-day program, unlocked',
  'Urge toolkit — panic button, breathing, redirects',
  'Streaks, analytics and relapse insights',
  'Home-screen widgets to keep the count visible',
  'Everything syncs and stays private to you',
];

function Check() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Path
        d="M3.5 8.5l3 3 6-7"
        stroke={palette.accent}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function Paywall({ onDone }: { onDone: () => void }) {
  const [sel, setSel] = useState<string>('yearly');
  const plan = PLANS.find((p) => p.id === sel) ?? PLANS[0];

  return (
    <View style={s.wrap}>
      <Animated.View entering={FadeIn.duration(350)}>
        <Title>Go all-in on day one.</Title>
        <Subtitle>
          Everything the program has to offer, from your very first morning.
        </Subtitle>
      </Animated.View>

      {/* value stack */}
      <Animated.View entering={FadeIn.delay(120).duration(300)} style={s.benefits}>
        {BENEFITS.map((b) => (
          <View key={b} style={s.benefitRow}>
            <Check />
            <Text style={s.benefitText}>{b}</Text>
          </View>
        ))}
      </Animated.View>

      {/* plans */}
      <Animated.View entering={FadeIn.delay(220).duration(300)} style={s.plans}>
        {PLANS.map((p) => {
          const on = sel === p.id;
          return (
            <Tap
              key={p.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${p.name}, ${p.price}${p.period}. ${p.sub}`}
              onPress={() => setSel(p.id)}
              style={[s.plan, on && s.planOn]}>
              <View style={s.radio}>
                <View style={[s.radioDot, on && s.radioDotOn]} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.planTop}>
                  <Text style={[s.planName, on && { color: palette.text }]}>{p.name}</Text>
                  {p.badge ? (
                    <View style={[s.badge, on && s.badgeOn]}>
                      <Text style={[s.badgeText, on && { color: palette.accentInk }]}>
                        {p.badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={s.planSub}>{p.sub}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.planPrice, on && { color: palette.text }]}>
                  {p.price}
                  <Text style={s.planPeriod}>{p.period}</Text>
                </Text>
              </View>
            </Tap>
          );
        })}
      </Animated.View>

      {/* trial timeline — only meaningful when a trial exists */}
      {plan.trial ? (
        <Animated.View entering={FadeIn.duration(250)} style={s.timeline}>
          <View style={s.tlRow}>
            <View style={[s.tlDot, s.tlDotOn]} />
            <Text style={s.tlText}>
              <Text style={s.tlDay}>Today </Text>Full access unlocks. You pay nothing.
            </Text>
          </View>
          <View style={s.tlRow}>
            <View style={s.tlDot} />
            <Text style={s.tlText}>
              <Text style={s.tlDay}>Day 5 </Text>We remind you before the trial ends.
            </Text>
          </View>
          <View style={s.tlRow}>
            <View style={s.tlDot} />
            <Text style={s.tlText}>
              <Text style={s.tlDay}>Day 7 </Text>Your subscription begins.
            </Text>
          </View>
        </Animated.View>
      ) : null}

      <View style={{ flex: 1, minHeight: Spacing.three }} />

      <Animated.View entering={FadeIn.delay(400).duration(300)} style={{ gap: Spacing.two }}>
        {/* TODO: RevenueCat purchase for `sel` — until wired, this advances onboarding. */}
        <Cta label={plan.cta} onPress={onDone} />
        <Text style={s.priceNote}>{plan.note}</Text>
        <View style={s.legalRow}>
          {/* TODO: wire restore + open the real Terms / Privacy URLs */}
          <Tap accessibilityRole="button" onPress={onDone}>
            <Text style={s.legalLink}>Restore</Text>
          </Tap>
          <Text style={s.legalDot}>·</Text>
          <Tap accessibilityRole="link" onPress={onDone}>
            <Text style={s.legalLink}>Terms</Text>
          </Tap>
          <Text style={s.legalDot}>·</Text>
          <Tap accessibilityRole="link" onPress={onDone}>
            <Text style={s.legalLink}>Privacy</Text>
          </Tap>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, paddingBottom: Spacing.four },
  centerBlock: { flex: 1, justifyContent: 'center' },
  pad: {
    flex: 1,
    marginVertical: Spacing.four,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  padHint: {
    position: 'absolute',
    alignSelf: 'center',
    top: '46%',
    color: palette.textFaint,
    fontSize: 15,
    fontFamily: type.body,
  },
  padLine: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.five,
    height: 1,
    backgroundColor: palette.line,
  },
  notifNote: {
    marginTop: Spacing.three,
    color: palette.amber,
    fontSize: 13.5,
    fontFamily: type.body,
  },
  benefits: { marginTop: Spacing.four, gap: Spacing.two },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  benefitText: { color: palette.textDim, fontSize: 14.5, fontFamily: type.body, flex: 1 },

  plans: { marginTop: Spacing.four, gap: Spacing.two },
  plan: {
    minHeight: 68,
    borderRadius: 14,
    backgroundColor: palette.surface2,
    borderWidth: 1.5,
    borderColor: palette.surface2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  planOn: { borderColor: palette.accent, backgroundColor: palette.accentWash },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'transparent' },
  radioDotOn: { backgroundColor: palette.accent },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  planName: { color: palette.text, fontSize: 16, fontFamily: type.bodySemi },
  planSub: { color: palette.textFaint, fontSize: 12.5, fontFamily: type.body, marginTop: 2 },
  planPrice: { color: palette.textDim, fontSize: 17, fontFamily: type.bodyBold },
  planPeriod: { color: palette.textFaint, fontSize: 13, fontFamily: type.bodyMed },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: palette.surface3,
  },
  badgeOn: { backgroundColor: palette.accent },
  badgeText: {
    color: palette.accent,
    fontSize: 9.5,
    letterSpacing: 0.6,
    fontFamily: type.bodyBold,
  },

  timeline: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    gap: Spacing.two,
  },
  tlRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  tlDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.line,
  },
  tlDotOn: { backgroundColor: palette.accent },
  tlText: { color: palette.textDim, fontSize: 13, fontFamily: type.body, flex: 1 },
  tlDay: { color: palette.text, fontFamily: type.bodySemi },

  priceNote: {
    color: palette.textFaint,
    fontSize: 12,
    fontFamily: type.body,
    textAlign: 'center',
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  legalLink: { color: palette.textFaint, fontSize: 12, fontFamily: type.bodyMed },
  legalDot: { color: palette.textFaint, fontSize: 12 },
});
