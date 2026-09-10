import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tap } from '@/components/ui/tap';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const TILES = 6;
const ROUNDS = 6;

type Round = { nums: number[]; target: number };

function newRound(): Round {
  const nums: number[] = [];
  while (nums.length < TILES) {
    const n = 2 + Math.floor(Math.random() * 28);
    if (!nums.includes(n)) nums.push(n);
  }
  const a = Math.floor(Math.random() * TILES);
  let b = Math.floor(Math.random() * (TILES - 1));
  if (b >= a) b += 1;
  return { nums, target: nums[a] + nums[b] };
}

/**
 * Six numbers, one target: tap the two that add up to it. There is always at
 * least one pair. A wrong pair clears and you try again — the round doesn't
 * reset. Six rounds. Arithmetic is a reliable attention hijack because it
 * can't be done half-heartedly.
 */
export function SumsGame({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(1);
  const [r, setR] = useState<Round>(newRound);
  const [picked, setPicked] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);

  const tap = (i: number) => {
    if (wrong || picked.includes(i)) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length < 2) {
      try {
        Haptics.selectionAsync();
      } catch {}
      return;
    }
    const sum = r.nums[next[0]] + r.nums[next[1]];
    if (sum !== r.target) {
      setWrong(true);
      setTimeout(() => {
        setWrong(false);
        setPicked([]);
      }, 400);
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (round >= ROUNDS) {
      setTimeout(onDone, 300);
      return;
    }
    setTimeout(() => {
      setRound(round + 1);
      setR(newRound());
      setPicked([]);
    }, 350);
  };

  return (
    <View style={s.wrap}>
      <Text style={s.prompt}>Two that add up to</Text>
      <Text style={s.target}>{r.target}</Text>
      <View style={s.grid}>
        {r.nums.map((n, i) => {
          const on = picked.includes(i);
          return (
            <Tap
              key={`${round}-${i}`}
              haptic="none"
              onPress={() => tap(i)}
              accessibilityRole="button"
              accessibilityLabel={String(n)}
              style={[s.tile, on && s.tileOn, on && wrong && s.tileWrong]}>
              <Text style={[s.tileText, on && s.tileTextOn]}>{n}</Text>
            </Tap>
          );
        })}
      </View>
      <Text style={s.round}>
        {round} of {ROUNDS}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.two },
  prompt: { color: palette.textDim, fontSize: 14, fontFamily: type.bodyMed },
  target: { color: palette.bright, fontSize: 56, fontFamily: type.display, fontVariant: ['tabular-nums'], marginBottom: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: 3 * 84 + 2 * 10, justifyContent: 'center' },
  tile: { width: 84, height: 64, borderRadius: 16, backgroundColor: palette.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: palette.surface2 },
  tileOn: { backgroundColor: palette.accentWash, borderColor: palette.accent },
  tileWrong: { borderColor: palette.danger },
  tileText: { color: palette.text, fontSize: 24, fontFamily: type.displayMed, fontVariant: ['tabular-nums'] },
  tileTextOn: { color: palette.accent },
  round: { color: palette.textFaint, fontSize: 13, fontFamily: type.bodyMed, fontVariant: ['tabular-nums'], marginTop: Spacing.two },
});
