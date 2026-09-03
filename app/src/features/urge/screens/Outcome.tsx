import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tap } from '@/components/ui/tap';
import { steps } from '@/features/onboarding/content';
import { Cta } from '@/features/onboarding/components/chrome';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { shared, StepHeader } from './shared';
import { useRouter } from 'expo-router';

const triggerStep = steps.find((s) => s.kind === 'question' && s.id === 'trigger');
export const TRIGGERS = [
  ...(triggerStep?.kind === 'question' ? triggerStep.options.map((o) => o.label) : []),
  'Something else',
];
const INTENSITY = ['1', '2', '3', '4', '5'];

export function Outcome({
  onSurvived,
  onSlipped,
}: {
  onSurvived: (d: { trigger: string | null; intensity: number | null }) => void;
  onSlipped: (d: { trigger: string | null; intensity: number | null }) => void;
}) {
  const router = useRouter();
  const [trigger, setTrigger] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number | null>(null);
  const data = { trigger, intensity };

  return (
    <View style={shared.pane}>
      <StepHeader kicker="Step 5 · Log it" title="How did it go?" />
      <Text style={s.label}>What set it off?</Text>
      <View style={s.chips}>
        {TRIGGERS.map((t) => (
          <Tap key={t} onPress={() => setTrigger(t)} style={[s.chip, trigger === t && s.chipOn]}>
            <Text style={[s.chipLabel, trigger === t && s.chipLabelOn]}>{t}</Text>
          </Tap>
        ))}
      </View>
      <Text style={s.label}>How strong was it?</Text>
      <View style={s.chips}>
        {INTENSITY.map((n) => (
          <Tap key={n} onPress={() => setIntensity(Number(n))} style={[s.chip, s.num, intensity === Number(n) && s.chipOn]}>
            <Text style={[s.chipLabel, intensity === Number(n) && s.chipLabelOn]}>{n}</Text>
          </Tap>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <Cta
        label="Urge survived"
        onPress={() => {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
          onSurvived(data);
        }}
      />
      <Cta label="I slipped" variant="ghost" onPress={() => onSlipped(data)} />
      {/* The one place people most need a person rather than an app. Quiet, so
          it isn't shouted at someone who's coping fine. */}
      <Tap haptic="none" onPress={() => router.push('/help')} accessibilityRole="button" style={s.help}>
        <Text style={s.helpLabel}>Talk to someone</Text>
      </Tap>
    </View>
  );
}

const s = StyleSheet.create({
  help: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  helpLabel: { color: palette.textDim, fontSize: 14, fontFamily: type.bodyMed },
  label: { color: palette.textDim, fontSize: 13, fontFamily: type.bodySemi, letterSpacing: 0.3, marginTop: -Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: palette.surface2, borderWidth: 1.5, borderColor: palette.surface2 },
  num: { width: 48, alignItems: 'center' },
  chipOn: { backgroundColor: palette.accentWash, borderColor: palette.accent },
  chipLabel: { color: palette.text, fontSize: 15, fontFamily: type.bodyMed },
  chipLabelOn: { color: palette.accent, fontFamily: type.bodySemi },
});
