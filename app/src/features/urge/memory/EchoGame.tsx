import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tap } from '@/components/ui/tap';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const PADS = ['pledge', 'checkin', 'urge', 'reasons'] as const;
const START = 2;
const FINISH = 6;
const LIT_MS = 420;
const GAP_MS = 160;

type Phase = 'show' | 'echo' | 'again';

/** Kept out of the component so the compiler's purity rule sees the randomness where it belongs. */
const randomPad = () => Math.floor(Math.random() * 4);

/**
 * Four pads light in a sequence; tap it back. The sequence grows by one each
 * round from two to six. Getting it wrong replays the same sequence — nothing
 * resets, nobody loses, you just hear it again.
 */
export function EchoGame({ onDone }: { onDone: () => void }) {
  const [seq, setSeq] = useState<number[]>(() => Array.from({ length: START }, randomPad));
  const [lit, setLit] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('show');
  const [pos, setPos] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Play the sequence back, one pad at a time, then hand over.
  useEffect(() => {
    if (phase !== 'show') return;
    clear();
    seq.forEach((pad, i) => {
      timers.current.push(setTimeout(() => setLit(pad), 500 + i * (LIT_MS + GAP_MS)));
      timers.current.push(setTimeout(() => setLit(null), 500 + i * (LIT_MS + GAP_MS) + LIT_MS));
    });
    timers.current.push(
      setTimeout(() => {
        setPos(0);
        setPhase('echo');
      }, 500 + seq.length * (LIT_MS + GAP_MS)),
    );
    return clear;
  }, [phase, seq]);

  useEffect(() => clear, []);

  const tap = (pad: number) => {
    if (phase !== 'echo') return;
    try {
      Haptics.selectionAsync();
    } catch {}
    setLit(pad);
    timers.current.push(setTimeout(() => setLit(null), 140));
    if (pad !== seq[pos]) {
      setPhase('again');
      timers.current.push(setTimeout(() => setPhase('show'), 900));
      return;
    }
    if (pos + 1 < seq.length) {
      setPos(pos + 1);
      return;
    }
    if (seq.length >= FINISH) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      timers.current.push(setTimeout(onDone, 350));
      return;
    }
    setSeq([...seq, randomPad()]);
    setPhase('show');
  };

  return (
    <View style={s.wrap}>
      <Text style={s.prompt}>
        {phase === 'show' ? 'Watch…' : phase === 'again' ? 'Not quite — once more.' : 'Your turn.'}
      </Text>
      <View style={s.grid}>
        {PADS.map((h, i) => (
          <Tap
            key={h}
            haptic="none"
            onPress={() => tap(i)}
            accessibilityRole="button"
            accessibilityLabel={`Pad ${i + 1}`}
            style={[s.pad, { backgroundColor: lit === i ? hues[h].solid : hues[h].wash }]}
          />
        ))}
      </View>
      <Text style={s.round}>
        {seq.length} of {FINISH} · {phase === 'echo' ? `${pos} tapped` : ' '}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.three },
  prompt: { color: palette.textDim, fontSize: 14, fontFamily: type.bodyMed, minHeight: 20 },
  grid: { width: 2 * 128 + 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pad: { width: 128, height: 128, borderRadius: 24 },
  round: { color: palette.textFaint, fontSize: 13, fontFamily: type.bodyMed, fontVariant: ['tabular-nums'] },
});
