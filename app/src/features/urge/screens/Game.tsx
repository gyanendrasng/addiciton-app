import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Tap } from '@/components/ui/tap';
import { track } from '@/lib/analytics';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { SKIP_AFTER_MS } from '../machine';
import { GAMES, gameById, randomGameId } from '../memory/registry';
import { shared, SkipLater, StepHeader } from './shared';

/**
 * Step 4: occupy the mind. A different game opens each time so the step
 * doesn't wear thin, and the picker lets someone switch to the one that
 * works for them. Finishing any game finishes the step.
 */
export function Game({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [gameId, setGameId] = useState<string>(randomGameId);
  const game = gameById(gameId);
  const Current = game.Component;

  const finished = () => {
    track('game_played', { game: gameId, where: 'urge' });
    onDone();
  };

  return (
    <View style={shared.pane}>
      <StepHeader center kicker="Step 4 · Occupy your mind" title={game.headline} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.picker}
        style={s.pickerScroll}>
        {GAMES.map((g) => {
          const on = gameId === g.id;
          return (
            <Tap
              key={g.id}
              haptic="selection"
              onPress={() => setGameId(g.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={[s.chip, on && s.chipOn]}>
              <Text style={[s.chipLabel, on && s.chipLabelOn]}>{g.title}</Text>
            </Tap>
          );
        })}
      </ScrollView>
      <View style={shared.center}>
        <Current key={gameId} onDone={finished} />
      </View>
      <SkipLater afterMs={SKIP_AFTER_MS.game} onSkip={onSkip} />
    </View>
  );
}

const s = StyleSheet.create({
  pickerScroll: { flexGrow: 0, marginHorizontal: -Spacing.four },
  picker: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.four },
  chip: { minHeight: 36, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: palette.surface2 },
  chipOn: { backgroundColor: palette.accentWash },
  chipLabel: { color: palette.textDim, fontSize: 14, fontFamily: type.bodyMed },
  chipLabelOn: { color: palette.accent, fontFamily: type.bodySemi },
});
