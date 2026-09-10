import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SymbolChip } from '@/components/ui/symbol-chip';
import { Tap } from '@/components/ui/tap';
import { Chevron, Eyebrow, Subtitle, Title } from '@/features/onboarding/components/chrome';
import { GAMES, gameById } from '@/features/urge/memory/registry';
import { track } from '@/lib/analytics';
import { durations } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

/**
 * The same games the urge toolkit uses, playable any time. Practising them
 * when calm is what makes them reachable when not — and for a lot of people
 * a two-minute game is the whole intervention.
 */
export default function GamesScreen() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const done = () => {
    if (playing) track('game_played', { game: playing, where: 'tab' });
    setFinished(true);
  };

  if (playing) {
    const meta = gameById(playing);
    const Current = meta.Component;
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.playHeader}>
          <Tap
            haptic="none"
            onPress={() => {
              setPlaying(null);
              setFinished(false);
            }}
            accessibilityLabel="Back"
            style={s.back}>
            <Chevron />
          </Tap>
          <Text style={s.playTitle}>{meta.title}</Text>
          <View style={s.back} />
        </View>
        <Animated.View
          key={`${playing}-${finished}`}
          entering={FadeIn.duration(durations.base)}
          exiting={FadeOut.duration(durations.fast)}
          style={s.stage}>
          {finished ? (
            <View style={s.doneWrap}>
              <Text style={s.doneTitle}>Nice.</Text>
              <Text style={s.doneSub}>That’s the muscle you’ll use when it counts.</Text>
              <Tap haptic="light" onPress={() => setFinished(false)} style={s.again}>
                <Text style={s.againLabel}>Play again</Text>
              </Tap>
            </View>
          ) : (
            <Current onDone={done} />
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
        <Subtitle>
          The same games the urge toolkit uses. Practice now, so they’re second nature when it counts.
        </Subtitle>
        <View style={s.gamesGrid}>
          {GAMES.map((g) => (
            <Tap key={g.id} haptic="light" onPress={() => setPlaying(g.id)} style={s.tile} accessibilityRole="button">
              <SymbolChip name={g.icon} tint={hues[g.hue].solid} wash={hues[g.hue].wash} size={38} />
              <View style={{ flex: 1 }} />
              <Text numberOfLines={1} style={s.cardTitle}>
                {g.title}
              </Text>
              <Text numberOfLines={1} style={s.cardSub}>
                {g.blurb}
              </Text>
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
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  playTitle: { color: palette.text, fontSize: 17, fontFamily: type.bodySemi },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  doneWrap: { alignItems: 'center', gap: Spacing.two },
  doneTitle: { color: palette.bright, fontSize: 40, fontFamily: type.display },
  doneSub: { color: palette.textDim, fontSize: 15, fontFamily: type.body, textAlign: 'center' },
  again: { marginTop: Spacing.two, minHeight: 44, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 999, backgroundColor: palette.accent },
  againLabel: { color: palette.accentInk, fontSize: 15, fontFamily: type.bodySemi },
});
