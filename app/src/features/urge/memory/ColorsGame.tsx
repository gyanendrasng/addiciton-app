import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tap } from '@/components/ui/tap';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const COLORS = [
  { name: 'Green', value: hues.pledge.solid },
  { name: 'Blue', value: hues.checkin.solid },
  { name: 'Orange', value: hues.urge.solid },
  { name: 'Yellow', value: hues.reasons.solid },
  { name: 'Purple', value: hues.progress.solid },
] as const;
const ROUNDS = 8;

type Round = { word: number; ink: number };
const newRound = (): Round => {
  const word = Math.floor(Math.random() * COLORS.length);
  const match = Math.random() < 0.5;
  const ink = match ? word : (word + 1 + Math.floor(Math.random() * (COLORS.length - 1))) % COLORS.length;
  return { word, ink };
};

/** Stroop-style: does the word's MEANING match its COLOR? Fast attention hijack. */
export function ColorsGame({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(1);
  const [r, setR] = useState<Round>(newRound);
  const [wrong, setWrong] = useState(false);

  const answer = (saysMatch: boolean) => {
    const isMatch = r.word === r.ink;
    if (saysMatch !== isMatch) {
      setWrong(true);
      setTimeout(() => {
        setWrong(false);
        setR(newRound());
      }, 400);
      return;
    }
    if (round >= ROUNDS) {
      setTimeout(onDone, 250);
      return;
    }
    setRound(round + 1);
    setR(newRound());
  };

  return (
    <View style={s.wrap}>
      <Text style={s.prompt}>Does the word match its color?</Text>
      <View style={[s.stage, wrong && { borderColor: palette.danger }]}>
        <Text style={[s.word, { color: COLORS[r.ink].value }]}>{COLORS[r.word].name}</Text>
      </View>
      <View style={s.buttons}>
        <Tap haptic="selection" onPress={() => answer(false)} style={[s.btn, s.no]}>
          <Text style={s.btnLabel}>No</Text>
        </Tap>
        <Tap haptic="selection" onPress={() => answer(true)} style={[s.btn, s.yes]}>
          <Text style={s.btnLabel}>Match</Text>
        </Tap>
      </View>
      <Text style={s.round}>{round} of {ROUNDS}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.three, alignSelf: 'stretch' },
  prompt: { color: palette.textDim, fontSize: 14, fontFamily: type.bodyMed },
  stage: {
    alignSelf: 'stretch',
    height: 140,
    borderRadius: 20,
    backgroundColor: palette.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: palette.surface2,
  },
  word: { fontSize: 44, fontFamily: type.display, letterSpacing: -0.5 },
  buttons: { flexDirection: 'row', gap: Spacing.two, alignSelf: 'stretch' },
  btn: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  no: { backgroundColor: palette.surface3 },
  yes: { backgroundColor: palette.accent },
  btnLabel: { color: palette.text, fontSize: 16, fontFamily: type.bodySemi },
  round: { color: palette.textFaint, fontSize: 13, fontFamily: type.bodyMed, fontVariant: ['tabular-nums'] },
});
