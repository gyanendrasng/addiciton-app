import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Tap } from '@/components/ui/tap';
import { insertRelapse } from '@/db/repo/relapses';
import { rescheduleMilestones } from '@/features/streak/milestone-schedule';
import { useProfile } from '@/db/repo/profile';
import { habits as ALL_HABITS } from '@/features/onboarding/content';
import { Cta, Eyebrow, Subtitle, Title } from '@/features/onboarding/components/chrome';
import { TRIGGERS } from '@/features/urge/screens/Outcome';
import { durations } from '@/theme/motion';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { useRouter } from 'expo-router';

const SUGGESTIONS = ['Drink a glass of water and walk for 10 minutes', 'Text someone who knows', 'Open this app tomorrow morning'];

type Pane = 'habits' | 'what' | 'next';

/** Shame-free by design: slow crossfades, no red flashes, total clean days are kept. */
export function RelapseFlow({ urgeId, presetHabit }: { urgeId: number | null; presetHabit?: string | null }) {
  const router = useRouter();
  const { profile } = useProfile();
  const myHabits = ALL_HABITS.filter((h) => profile?.habits.includes(h.id));
  // Trust the preset from the tapped chip (available synchronously from the URL,
  // before the profile finishes loading). Otherwise start at the picker.
  const [pane, setPane] = useState<Pane>(presetHabit ? 'what' : 'habits');
  const [picked, setPicked] = useState<string[]>(presetHabit ? [presetHabit] : []);

  // Single-habit users have nothing to pick — derive it rather than set state in
  // an effect (which the compiler flags as a cascading render).
  const autoSingle = !presetHabit && myHabits.length === 1;
  const habitIds = autoSingle && picked.length === 0 ? [myHabits[0].id] : picked;
  const shownPane: Pane = autoSingle && pane === 'habits' ? 'what' : pane;
  const setHabitIds = setPicked;
  const [trigger, setTrigger] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [actions, setActions] = useState<string[]>(SUGGESTIONS);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    await insertRelapse({
      habitIds,
      trigger,
      note: note.trim() || null,
      nextActions: actions.map((a) => a.trim()).filter(Boolean),
      urgeId,
    });
    await rescheduleMilestones();
    if (router.canDismiss()) router.dismissAll();
    else router.replace('/');
  };

  return (
    <Animated.View key={shownPane} entering={FadeIn.duration(durations.base)} exiting={FadeOut.duration(durations.fast)} style={s.pane}>
      {shownPane === 'habits' && (
        <>
          <Eyebrow>A lapse isn’t a relapse</Eyebrow>
          <Title>Which one slipped?</Title>
          <Subtitle>Your total clean days stay. Only the streak restarts — and it restarts now.</Subtitle>
          <View style={s.chips}>
            {myHabits.map((h) => {
              const on = habitIds.includes(h.id);
              return (
                <Tap key={h.id} onPress={() => setHabitIds((p) => (on ? p.filter((x) => x !== h.id) : [...p, h.id]))} style={[s.chip, on && s.chipOn]}>
                  <Text style={[s.chipLabel, on && s.chipLabelOn]}>{h.label}</Text>
                </Tap>
              );
            })}
          </View>
          <View style={{ flex: 1 }} />
          <Cta label="Continue" disabled={habitIds.length === 0} onPress={() => setPane('what')} />
        </>
      )}
      {shownPane === 'what' && (
        <>
          <Eyebrow>
            {habitIds.length === 1
              ? ALL_HABITS.find((h) => h.id === habitIds[0])?.label ?? 'A lapse isn’t a relapse'
              : 'A lapse isn’t a relapse'}
          </Eyebrow>
          <Title>What happened?</Title>
          <Subtitle>Not for judging. For spotting the pattern next time.</Subtitle>
          <View style={s.chips}>
            {TRIGGERS.map((t) => (
              <Tap key={t} onPress={() => setTrigger(t)} style={[s.chip, trigger === t && s.chipOn]}>
                <Text style={[s.chipLabel, trigger === t && s.chipLabelOn]}>{t}</Text>
              </Tap>
            ))}
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Anything else worth writing down… (optional)"
            placeholderTextColor={palette.textFaint}
            style={s.input}
            multiline
            maxLength={400}
          />
          <View style={{ flex: 1 }} />
          <Cta label="Continue" onPress={() => setPane('next')} />
        </>
      )}
      {shownPane === 'next' && (
        <>
          <Eyebrow>The next 48 hours matter most</Eyebrow>
          <Title>Three things you’ll do next.</Title>
          <Subtitle>Edit these or keep them. Small and concrete beats big and vague.</Subtitle>
          <View style={{ gap: Spacing.two }}>
            {actions.map((a, i) => (
              <TextInput
                key={i}
                value={a}
                onChangeText={(v) => setActions((p) => p.map((x, j) => (j === i ? v : x)))}
                style={s.action}
                placeholder={`Action ${i + 1}`}
                placeholderTextColor={palette.textFaint}
              />
            ))}
          </View>
          <View style={{ flex: 1 }} />
          <Cta label={saving ? 'Saving…' : 'Start again'} disabled={saving} onPress={save} />
          {/* Offered after a slip, where it's most likely to be wanted and
              least likely to feel like a lecture. */}
          <Tap haptic="none" onPress={() => router.push('/help')} accessibilityRole="button" style={s.help}>
            <Text style={s.helpLabel}>Talk to someone</Text>
          </Tap>
          <Text style={s.foot}>You can undo this from Home for the next 24 hours.</Text>
        </>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  help: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  helpLabel: { color: palette.textDim, fontSize: 14, fontFamily: type.bodyMed },
  pane: { flex: 1, padding: Spacing.four, paddingTop: Spacing.two, gap: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: palette.surface2, borderWidth: 1.5, borderColor: palette.surface2 },
  chipOn: { backgroundColor: palette.accentWash, borderColor: palette.accent },
  chipLabel: { color: palette.text, fontSize: 15, fontFamily: type.bodyMed },
  chipLabelOn: { color: palette.accent, fontFamily: type.bodySemi },
  input: { minHeight: 96, borderRadius: 12, backgroundColor: palette.surface2, color: palette.text, padding: Spacing.three, fontSize: 15, fontFamily: type.body, textAlignVertical: 'top' },
  action: { minHeight: 52, borderRadius: 12, backgroundColor: palette.surface2, color: palette.text, paddingHorizontal: Spacing.three, fontSize: 15, fontFamily: type.bodyMed },
  foot: { color: palette.textFaint, fontSize: 13, fontFamily: type.body, textAlign: 'center' },
});
