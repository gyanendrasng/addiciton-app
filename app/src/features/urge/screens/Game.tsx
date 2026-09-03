import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tap } from '@/components/ui/tap';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { SKIP_AFTER_MS } from '../machine';
import { ColorsGame } from '../memory/ColorsGame';
import { MemoryGame } from '../memory/MemoryGame';
import { RecallGame } from '../memory/RecallGame';
import { SevensGame } from '../memory/SevensGame';
import { SpotGame } from '../memory/SpotGame';
import { shared, SkipLater, StepHeader } from './shared';

const GAMES = [
  { id: 'pairs', label: 'Pairs' },
  { id: 'recall', label: 'Recall' },
  { id: 'spot', label: 'Spot it' },
  { id: 'colors', label: 'Colors' },
  { id: 'sevens', label: 'Countdown' },
] as const;
type GameId = (typeof GAMES)[number]['id'];

export function Game({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [game, setGame] = useState<GameId>('pairs');

  return (
    <View style={shared.pane}>
      <StepHeader
        center
        kicker="Step 4 · Occupy your mind"
        title={
          game === 'recall' ? 'Hold the number.'
          : game === 'spot' ? 'Spot the odd one.'
          : game === 'colors' ? 'Word vs. color.'
          : game === 'sevens' ? 'Do the math.'
          : 'Match the pairs.'
        }
      />
      <View style={s.picker}>
        {GAMES.map((g) => {
          const on = game === g.id;
          return (
            <Tap key={g.id} haptic="selection" onPress={() => setGame(g.id)} style={[s.chip, on && s.chipOn]}>
              <Text style={[s.chipLabel, on && s.chipLabelOn]}>{g.label}</Text>
            </Tap>
          );
        })}
      </View>
      <View style={shared.center}>
        {game === 'pairs' && <MemoryGame onDone={() => onDone()} />}
        {game === 'recall' && <RecallGame onDone={onDone} />}
        {game === 'spot' && <SpotGame onDone={onDone} />}
        {game === 'colors' && <ColorsGame onDone={onDone} />}
        {game === 'sevens' && <SevensGame onDone={onDone} />}
      </View>
      <SkipLater afterMs={SKIP_AFTER_MS.game} onSkip={onSkip} />
    </View>
  );
}

const s = StyleSheet.create({
  picker: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'center' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: palette.surface2 },
  chipOn: { backgroundColor: palette.accentWash },
  chipLabel: { color: palette.textDim, fontSize: 14, fontFamily: type.bodyMed },
  chipLabelOn: { color: palette.accent, fontFamily: type.bodySemi },
});
