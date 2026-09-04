/** Signature and notification onboarding steps. */
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

import { setAnalyticsPref } from '@/features/settings/analytics';
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

/**
 * The analytics ask.
 *
 * Asked here rather than left to a switch in Settings because almost nobody
 * finds a switch in Settings — and asked at all because of *what* is sent.
 * Alongside interaction events, PostHog receives which habits someone tracks
 * and how their streaks run, which is health data: special category under GDPR
 * and consent-bound under India's DPDP Act. Neither store requires this prompt;
 * the law does.
 *
 * Both buttons write the preference, so a decline is recorded as a decision
 * rather than left at the default.
 */
export function Analytics({ onNext }: { onNext: () => void }) {
  const [busy, setBusy] = useState(false);

  async function choose(on: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      await setAnalyticsPref(on);
    } catch {
      // Never block onboarding on a settings write.
    }
    onNext();
  }

  return (
    <View style={s.wrap}>
      <View style={s.centerBlock}>
        <Animated.View entering={FadeIn.duration(350)}>
          <Title>Help make Curb better?</Title>
          <Subtitle>
            Curb can report which features get used and how streaks progress, so the parts that
            help get better and the parts that don’t get cut.
          </Subtitle>
          <Text style={s.notifNote}>
            Never what you write — your reasons, notes and check-ins are not part of it. You can
            change this any time in Settings.
          </Text>
        </Animated.View>
      </View>
      <View style={{ gap: Spacing.two }}>
        <Cta label="Share usage data" onPress={() => choose(true)} disabled={busy} />
        <Cta label="Not now" variant="ghost" onPress={() => choose(false)} />
      </View>
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
