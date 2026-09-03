import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tap } from '@/components/ui/tap';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const STEPS = 5;
const SUBTRAHENDS = [3, 4, 6, 7, 8, 9, 11, 12];

function shuffle<T>(a: T[]): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Four plausible options: the answer plus near-miss distractors. */
function optionsFor(correct: number, step: number): number[] {
  const set = new Set<number>([correct]);
  const jitters = [step, -1, 1, 10, -10, 2];
  let k = 0;
  while (set.size < 4 && k < jitters.length) {
    const v = correct + jitters[k++];
    if (v >= 0) set.add(v);
  }
  while (set.size < 4) set.add(correct + set.size); // safety
  return shuffle([...set]);
}

/** Serial subtraction with a random start and step each game. Occupies working memory. */
export function SevensGame({ onDone }: { onDone: () => void }) {
  // Lazy state initializers run exactly once — the sanctioned home for randomness.
  const [config] = useState(() => ({
    start: 80 + Math.floor(Math.random() * 60),
    step: SUBTRAHENDS[Math.floor(Math.random() * SUBTRAHENDS.length)],
  }));
  const [current, setCurrent] = useState(config.start);
  const [step, setStep] = useState(1);
  const [opts, setOpts] = useState(() => optionsFor(config.start - config.step, config.step));
  const [wrong, setWrong] = useState<number | null>(null);

  const pick = (v: number) => {
    const correct = current - config.step;
    if (v !== correct) {
      setWrong(v);
      setTimeout(() => setWrong(null), 400);
      return;
    }
    if (step >= STEPS) {
      setTimeout(onDone, 250);
      return;
    }
    setCurrent(correct);
    setStep(step + 1);
    setOpts(optionsFor(correct - config.step, config.step));
  };

  return (
    <View style={s.wrap}>
      <Text style={s.prompt}>Keep subtracting {config.step}</Text>
      <Text style={s.current}>{current}</Text>
      <Text style={s.minus}>− {config.step} = ?</Text>
      <View style={s.grid}>
        {opts.map((v) => (
          <Tap key={v} haptic="selection" onPress={() => pick(v)} style={[s.opt, wrong === v && { borderColor: palette.danger }]}>
            <Text style={s.optLabel}>{v}</Text>
          </Tap>
        ))}
      </View>
      <Text style={s.round}>{step} of {STEPS}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.two, alignSelf: 'stretch' },
  prompt: { color: palette.textDim, fontSize: 14, fontFamily: type.bodyMed },
  current: { color: palette.bright, fontSize: 72, fontFamily: type.display, fontVariant: ['tabular-nums'], letterSpacing: -2 },
  minus: { color: palette.textDim, fontSize: 20, fontFamily: type.bodyMed, marginBottom: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'center', alignSelf: 'stretch' },
  opt: {
    width: '47%',
    height: 64,
    borderRadius: 16,
    backgroundColor: palette.surface2,
    borderWidth: 1.5,
    borderColor: palette.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optLabel: { color: palette.text, fontSize: 22, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'] },
  round: { color: palette.textFaint, fontSize: 13, fontFamily: type.bodyMed, fontVariant: ['tabular-nums'] },
});
