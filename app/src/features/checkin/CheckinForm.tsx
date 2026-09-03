import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Tap } from '@/components/ui/tap';
import { upsertCheckin, type Checkin } from '@/db/repo/checkins';
import { Cta, Subtitle, Title } from '@/features/onboarding/components/chrome';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

export const MOODS = ['Rough', 'Low', 'Okay', 'Good', 'Great'] as const;
const DIFFICULTY = ['Easy', 'Fine', 'Some', 'Hard', 'Brutal'] as const;

export function CheckinForm({
  date,
  existing,
  onSaved,
}: {
  date: string;
  existing: Checkin | null;
  onSaved: () => void;
}) {
  const [mood, setMood] = useState<number | null>(existing?.mood ?? null);
  const [difficulty, setDifficulty] = useState<number | null>(existing?.difficulty ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const ready = mood != null && difficulty != null;

  return (
    <View style={s.wrap}>
      <Title>How was today?</Title>
      <Subtitle>Two taps. Keep the streak honest.</Subtitle>

      <Text style={s.section}>Mood</Text>
      <Chips options={MOODS} value={mood} onChange={setMood} />

      <Text style={s.section}>How hard were the urges?</Text>
      <Chips options={DIFFICULTY} value={difficulty} onChange={setDifficulty} />

      <Text style={s.section}>Anything worth remembering? (optional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="A trigger, a win, a thought…"
        placeholderTextColor={palette.textFaint}
        style={s.input}
        multiline
        maxLength={280}
      />

      <View style={{ flex: 1 }} />
      <Cta
        label={existing ? 'Update check-in' : 'Save check-in'}
        disabled={!ready}
        onPress={async () => {
          if (!ready) return;
          await upsertCheckin({ date, mood: mood!, difficulty: difficulty!, note: note.trim() || null });
          onSaved();
        }}
      />
    </View>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <View style={s.chips}>
      {options.map((label, i) => {
        const v = i + 1;
        const on = value === v;
        return (
          <Tap
            key={label}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(v)}
            style={[s.chip, on && s.chipOn]}>
            <Text style={[s.chipLabel, on && s.chipLabelOn]}>{label}</Text>
          </Tap>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, gap: Spacing.two },
  section: { color: palette.textDim, fontSize: 13, fontFamily: type.bodySemi, marginTop: Spacing.three, letterSpacing: 0.3 },
  chips: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: palette.surface2,
    borderWidth: 1.5,
    borderColor: palette.surface2,
  },
  chipOn: { backgroundColor: hues.checkin.wash, borderColor: hues.checkin.solid },
  chipLabel: { color: palette.text, fontSize: 15, fontFamily: type.bodyMed },
  chipLabelOn: { color: hues.checkin.solid, fontFamily: type.bodySemi },
  input: {
    minHeight: 84,
    borderRadius: 12,
    backgroundColor: palette.surface2,
    color: palette.text,
    padding: Spacing.three,
    fontSize: 15,
    fontFamily: type.body,
    textAlignVertical: 'top',
  },
});
