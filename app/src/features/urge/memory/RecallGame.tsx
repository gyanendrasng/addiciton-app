import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Tap } from '@/components/ui/tap';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const ROUNDS = [4, 5, 6]; // digits per round
const SHOW_MS_PER_DIGIT = 700;

function randomSeq(n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

/** Memorize the number, type it back. Three rounds, growing length. */
export function RecallGame({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState(() => randomSeq(ROUNDS[0]));
  const [phase, setPhase] = useState<'show' | 'enter' | 'wrong'>('show');
  const [entry, setEntry] = useState('');

  useEffect(() => {
    if (phase !== 'show') return;
    const t = setTimeout(() => setPhase('enter'), ROUNDS[round] * SHOW_MS_PER_DIGIT + 400);
    return () => clearTimeout(t);
  }, [phase, round]);

  const press = (d: string) => {
    if (phase !== 'enter') return;
    const next = entry + d;
    if (!seq.startsWith(next)) {
      setPhase('wrong');
      setTimeout(() => {
        setEntry('');
        setSeq(randomSeq(ROUNDS[round]));
        setPhase('show');
      }, 700);
      return;
    }
    setEntry(next);
    if (next.length === seq.length) {
      if (round + 1 >= ROUNDS.length) {
        setTimeout(onDone, 400);
      } else {
        setTimeout(() => {
          const r = round + 1;
          setRound(r);
          setSeq(randomSeq(ROUNDS[r]));
          setEntry('');
          setPhase('show');
        }, 400);
      }
    }
  };

  return (
    <View style={s.wrap}>
      <View style={s.stage}>
        {phase === 'show' ? (
          <Animated.Text entering={FadeIn.duration(200)} style={s.seq}>
            {seq}
          </Animated.Text>
        ) : (
          <Text style={[s.seq, phase === 'wrong' && { color: palette.danger }]}>
            {phase === 'wrong' ? '·'.repeat(seq.length) : (entry + '·'.repeat(seq.length - entry.length))}
          </Text>
        )}
        <Text style={s.hint}>
          {phase === 'show' ? 'memorize it' : phase === 'wrong' ? 'again — new number' : 'type it back'}
        </Text>
      </View>
      <View style={s.pad}>
        {['1','2','3','4','5','6','7','8','9','0'].map((d) => (
          <Tap key={d} haptic="selection" onPress={() => press(d)} style={[s.key, phase !== 'enter' && { opacity: 0.35 }]}>
            <Text style={s.keyLabel}>{d}</Text>
          </Tap>
        ))}
      </View>
      <Text style={s.round}>round {round + 1} of {ROUNDS.length}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.four },
  stage: { alignItems: 'center', gap: Spacing.one, minHeight: 96, justifyContent: 'center' },
  seq: { color: palette.bright, fontSize: 44, fontFamily: type.display, letterSpacing: 8, fontVariant: ['tabular-nums'] },
  hint: { color: palette.textFaint, fontSize: 13, fontFamily: type.bodyMed },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: 5 * 56 + 4 * 10, justifyContent: 'center' },
  key: { width: 56, height: 56, borderRadius: 16, backgroundColor: palette.surface2, alignItems: 'center', justifyContent: 'center' },
  keyLabel: { color: palette.text, fontSize: 20, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'] },
  round: { color: palette.textFaint, fontSize: 13, fontFamily: type.bodyMed, fontVariant: ['tabular-nums'] },
});
