/** Welcome, framing, interstitial, and plan steps. */
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Spacing } from '@/theme/spacing';
import { palette } from '@/theme/palette';
import { type } from '@/theme/type';
import { AppLogo } from '@/components/ui/app-logo';
import type { Answers } from '../lib';
import { steps } from '../content';
import { Cta, Eyebrow, Subtitle, Title } from './chrome';

export function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <View style={s.wrap}>
      <View style={s.centerBlock}>
        <Animated.View entering={FadeIn.duration(350)} style={s.centered}>
          <View style={s.markWrap}>
            <AppLogo size={112} />
          </View>
          <Title center>Break the cycle.{'\n'}For good.</Title>
          <Subtitle center>
            A 90-day plan with something to do in the moment an urge hits — not another test of
            willpower.
          </Subtitle>
        </Animated.View>
      </View>
      <Cta label="Start the 2-minute quiz" onPress={onNext} />
      <Text style={s.legal}>Private by design — your answers stay on this device.</Text>
    </View>
  );
}

export function Framing({ onNext }: { onNext: () => void }) {
  return (
    <View style={s.wrap}>
      <View style={s.centerBlock}>
        <Animated.View entering={FadeIn.duration(350)} style={s.centered}>
          <Eyebrow center>The science</Eyebrow>
          <Title center>Your brain can rewire itself in 90 days.</Title>
          <Subtitle center>
            First, let’s find out where you’re starting from. Answer honestly — nobody sees this
            but you.
          </Subtitle>
        </Animated.View>
      </View>
      <Cta label="I’m ready" onPress={onNext} />
    </View>
  );
}

export function Interstitial({
  title,
  body,
  footnote,
  onNext,
}: {
  title: string;
  body: string;
  footnote?: string;
  onNext: () => void;
}) {
  return (
    <View style={s.wrap}>
      <View style={s.centerBlock}>
        <Animated.View entering={FadeIn.duration(350)} style={s.centered}>
          <Eyebrow center>Worth knowing</Eyebrow>
          <Title center>{title}</Title>
          <Subtitle center>{body}</Subtitle>
          {footnote ? <Text style={[s.footnote, s.centerText]}>{footnote}</Text> : null}
        </Animated.View>
      </View>
      <Cta label="Continue" onPress={onNext} />
    </View>
  );
}

export function Plan({ answers, onNext }: { answers: Answers; onNext: () => void }) {
  const triggerStep = steps.find((x) => x.kind === 'question' && x.id === 'trigger');
  const triggerIdx = answers['trigger']?.[0];
  const triggerLabel =
    triggerStep?.kind === 'question' && triggerIdx != null
      ? triggerStep.options[triggerIdx].label.toLowerCase()
      : 'your risky hours';
  const items = [
    { k: 'Daily pledge', v: 'A 10-second morning commitment that anchors the day.' },
    { k: 'Urge toolkit', v: `Tuned for ${triggerLabel} — breathe, delay, remember why.` },
    { k: 'Evening check-in', v: 'Two taps to log the day and keep your streak honest.' },
    { k: 'Shame-free resets', v: 'A slip is data, not failure. Your history is never erased.' },
  ];
  return (
    <View style={s.wrap}>
      <View style={{ paddingTop: Spacing.six }}>
        <Animated.View entering={FadeIn.duration(350)}>
          <Title>Your 90-day plan</Title>
        </Animated.View>
        <View style={{ marginTop: Spacing.four, gap: Spacing.three }}>
          {items.map((it, i) => (
            <View key={it.k} style={s.planRow}>
              <View style={s.planDot} />
              <View style={{ flex: 1 }}>
                <Text style={s.planKey}>{it.k}</Text>
                <Text style={s.planVal}>{it.v}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <Animated.View entering={FadeIn.delay(600).duration(300)}>
        <Cta label="Commit to it" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, paddingBottom: Spacing.four },
  centerBlock: { flex: 1, justifyContent: 'center' },
  markWrap: { marginBottom: Spacing.five },
  centered: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
  legal: { color: palette.textFaint, fontSize: 11, textAlign: 'center', marginTop: Spacing.three, fontFamily: type.body },
  footnote: { color: palette.accent, fontSize: 15, fontFamily: type.bodySemi, marginTop: Spacing.three },
  planRow: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  planDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.accent, marginTop: 7 },
  planKey: { color: palette.text, fontSize: 17, fontFamily: type.bodySemi },
  planVal: { color: palette.textDim, fontSize: 15, lineHeight: 21, marginTop: 2, fontFamily: type.body },
});
