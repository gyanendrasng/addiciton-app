import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import { Tap } from '@/components/ui/tap';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const GRID = 16; // 4×4
const TOTAL_ROUNDS = 5;

type Round = { odd: number; rot: number };
const newRound = (): Round => ({ odd: Math.floor(Math.random() * GRID), rot: 25 + Math.floor(Math.random() * 20) });

/** One glyph is slightly different. Find it. Five rounds. */
export function SpotGame({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(1);
  const [r, setR] = useState<Round>(newRound);
  const [missed, setMissed] = useState<number | null>(null);

  const tap = (i: number) => {
    if (i !== r.odd) {
      setMissed(i);
      setTimeout(() => setMissed(null), 350);
      return;
    }
    if (round >= TOTAL_ROUNDS) {
      setTimeout(onDone, 300);
      return;
    }
    setRound(round + 1);
    setR(newRound());
  };

  return (
    <View style={s.wrap}>
      <View style={s.grid}>
        {Array.from({ length: GRID }, (_, i) => (
          <Tap key={`${round}-${i}`} haptic="selection" onPress={() => tap(i)} style={[s.cell, missed === i && { borderColor: palette.danger, borderWidth: 1.5 }]}>
            <Svg width={34} height={34} viewBox="0 0 34 34">
              <Rect
                x={7}
                y={7}
                width={20}
                height={20}
                rx={5}
                fill={hues.urge.solid}
                transform={i === r.odd ? `rotate(${r.rot} 17 17)` : undefined}
                opacity={i === r.odd ? 0.95 : 0.8}
              />
              <Circle cx={17} cy={17} r={3.5} fill={palette.bg} />
            </Svg>
          </Tap>
        ))}
      </View>
      <Text style={s.round}>find the tilted one · {round} of {TOTAL_ROUNDS}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.three },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: 4 * 64 + 3 * 10 },
  cell: { width: 64, height: 64, borderRadius: 16, backgroundColor: palette.surface2, alignItems: 'center', justifyContent: 'center' },
  round: { color: palette.textFaint, fontSize: 13, fontFamily: type.bodyMed, fontVariant: ['tabular-nums'] },
});
