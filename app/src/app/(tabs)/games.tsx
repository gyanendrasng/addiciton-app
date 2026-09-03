import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SymbolChip } from '@/components/ui/symbol-chip';
import { Tap } from '@/components/ui/tap';
import { Chevron, Eyebrow, Subtitle, Title } from '@/features/onboarding/components/chrome';
import { ColorsGame } from '@/features/urge/memory/ColorsGame';
import { MemoryGame } from '@/features/urge/memory/MemoryGame';
import { RecallGame } from '@/features/urge/memory/RecallGame';
import { SevensGame } from '@/features/urge/memory/SevensGame';
import { SpotGame } from '@/features/urge/memory/SpotGame';
import { durations } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const GAMES = [
  { id: 'pairs', title: 'Pairs', blurb: 'Match 6 pairs from memory.', icon: 'square.grid.2x2.fill', hue: 'progress' },
  { id: 'recall', title: 'Recall', blurb: 'Hold a growing number.', icon: 'textformat.123', hue: 'checkin' },
  { id: 'spot', title: 'Spot it', blurb: 'Find the tilted one.', icon: 'eye.fill', hue: 'urge' },
  { id: 'colors', title: 'Colors', blurb: 'Word vs. ink — match?', icon: 'paintpalette.fill', hue: 'reasons' },
  { id: 'sevens', title: 'Countdown', blurb: 'Subtract your way down.', icon: 'minus.circle.fill', hue: 'pledge' },
] as const;
type GameId = (typeof GAMES)[number]['id'];

export default function GamesScreen() {
  const [playing, setPlaying] = useState<GameId | null>(null);
  const [finished, setFinished] = useState(false);

  const done = () => setFinished(true);

  if (playing) {
    const meta = GAMES.find((g) => g.id === playing)!;
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.playHeader}>
          <Tap haptic="none" onPress={() => { setPlaying(null); setFinished(false); }} accessibilityLabel="Back">
            <Chevron />
          </Tap>
          <Text style={s.playTitle}>{meta.title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <Animated.View key={`${playing}-${finished}`} entering={FadeIn.duration(durations.base)} exiting={FadeOut.duration(durations.fast)} style={s.stage}>
          {finished ? (
            <View style={s.doneWrap}>
              <Text style={s.doneTitle}>Nice.</Text>
              <Text style={s.doneSub}>That’s the muscle you’ll use when it counts.</Text>
              <Tap haptic="light" onPress={() => setFinished(false)} style={s.again}>
                <Text style={s.againLabel}>Play again</Text>
              </Tap>
            </View>
          ) : (
            <>
              {playing === 'pairs' && <MemoryGame onDone={done} />}
              {playing === 'recall' && <RecallGame onDone={done} />}
              {playing === 'spot' && <SpotGame onDone={done} />}
              {playing === 'colors' && <ColorsGame onDone={done} />}
              {playing === 'sevens' && <SevensGame onDone={done} />}
            </>
          )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Eyebrow>Games</Eyebrow>
        <Title>Train the distraction muscle.</Title>
        <Subtitle>The same games the urge toolkit uses. Practice now, so they’re second nature when it counts.</Subtitle>
        <View style={s.gamesGrid}>
          {GAMES.map((g) => (
            <Tap key={g.id} haptic="light" onPress={() => setPlaying(g.id)} style={s.tile}>
              <SymbolChip name={g.icon} tint={hues[g.hue].solid} wash={hues[g.hue].wash} size={38} />
              <View style={{ flex: 1 }} />
              <Text numberOfLines={1} style={s.cardTitle}>{g.title}</Text>
              <Text numberOfLines={1} style={s.cardSub}>{g.blurb}</Text>
            </Tap>
          ))}
        </View>
        <View style={{ height: 96 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  content: { padding: Spacing.four, gap: Spacing.two },
  gamesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  tile: {
    width: '48.4%',
    minHeight: 132,
    backgroundColor: palette.surface2,
    borderRadius: 22,
    padding: Spacing.three,
    gap: 2,
  },
  cardTitle: { color: palette.text, fontSize: 17, fontFamily: type.bodySemi },
  cardSub: { color: palette.textDim, fontSize: 13, fontFamily: type.body, marginTop: 2 },
  playHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four },
  playTitle: { color: palette.text, fontSize: 17, fontFamily: type.bodySemi },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  doneWrap: { alignItems: 'center', gap: Spacing.two },
  doneTitle: { color: palette.bright, fontSize: 40, fontFamily: type.display },
  doneSub: { color: palette.textDim, fontSize: 15, fontFamily: type.body, textAlign: 'center' },
  again: { marginTop: Spacing.two, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, backgroundColor: palette.accent },
  againLabel: { color: palette.accentInk, fontSize: 15, fontFamily: type.bodySemi },
});
