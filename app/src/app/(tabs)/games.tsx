import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Tap } from '@/components/ui/tap';
import { useSetting } from '@/db/repo/settings';
import { Chevron, Eyebrow, Title } from '@/features/onboarding/components/chrome';
import { GAMES, gameById, type GameMeta } from '@/features/urge/memory/registry';
import { track } from '@/lib/analytics';
import { durations } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

/**
 * The same games the urge toolkit uses, playable any time. Practising them
 * when calm is what makes them reachable when not — and for a lot of people
 * a two-minute game is the whole intervention. The tiles say all that needs
 * saying; the header stays out of the way.
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
            style={s.back}
          >
            <Chevron />
          </Tap>
          <Text style={s.playTitle}>{meta.title}</Text>
          <View style={s.back} />
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
            <Current onDone={done} />
          )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Four tiles, two by two, filling the screen — no scroll, nothing else.
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.content}>
        <Eyebrow>Games</Eyebrow>
        <Title>Pick a game.</Title>
        <View style={s.gamesGrid}>
          {[GAMES.slice(0, 2), GAMES.slice(2, 4)].map((row, i) => (
            <View key={i} style={s.gamesRow}>
              {row.map((g) => (
                <GameTile key={g.id} game={g} onPress={() => setPlaying(g.id)} />
              ))}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

/** One game: a picture of it, its name, and the number that makes it worth opening again. */
function GameTile({ game: g, onPress }: { game: GameMeta; onPress: () => void }) {
  const { value: best } = useSetting<number>(g.best.key, 0);
  const { width } = useWindowDimensions();
  // Two tiles across, inside the page padding and the gap; the art bleeds to the tile's edges.
  const artWidth = (width - Spacing.four * 2 - Spacing.two) / 2;
  return (
    <Tap haptic="light" onPress={onPress} style={s.tile} accessibilityRole="button" accessibilityLabel={`${g.title}. ${g.blurb}${best ? ` ${g.best.label} ${best}${g.best.unit ?? ''}.` : ''}`}>
      <g.Art width={artWidth} />
      <View style={{ flex: 1 }} />
      <View style={s.tileText}>
        <Text numberOfLines={1} style={s.cardTitle}>
          {g.title}
        </Text>
        <Text numberOfLines={1} style={s.cardSub}>
          {g.blurb}
        </Text>
        <Text numberOfLines={1} style={[s.cardBest, best ? { color: hues[g.hue].solid } : null]}>
          {best ? `${g.best.label} ${best}${g.best.unit ?? ''}` : 'Not played yet'}
        </Text>
      </View>
    </Tap>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  // The floating tab bar covers the bottom ~96pt; the grid stops above it.
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: 96,
    gap: Spacing.two,
  },
  gamesGrid: { flex: 1, gap: Spacing.two, marginTop: Spacing.two },
  gamesRow: { flex: 1, flexDirection: 'row', gap: Spacing.two },
  tile: {
    flex: 1,
    backgroundColor: palette.surface2,
    borderRadius: 22,
    overflow: 'hidden',
  },
  tileText: { padding: Spacing.three, gap: 2 },
  cardTitle: { color: palette.text, fontSize: 20, fontFamily: type.bodySemi },
  cardSub: {
    color: palette.textDim,
    fontSize: 14,
    fontFamily: type.body,
    marginTop: 2,
  },
  cardBest: {
    color: palette.textFaint,
    fontSize: 13,
    fontFamily: type.bodySemi,
    fontVariant: ['tabular-nums'],
    marginTop: Spacing.two,
  },
  playHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playTitle: { color: palette.text, fontSize: 17, fontFamily: type.bodySemi },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  doneWrap: { alignItems: 'center', gap: Spacing.two },
  doneTitle: { color: palette.bright, fontSize: 40, fontFamily: type.display },
  doneSub: {
    color: palette.textDim,
    fontSize: 15,
    fontFamily: type.body,
    textAlign: 'center',
  },
  again: {
    marginTop: Spacing.two,
    minHeight: 44,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: palette.accent,
  },
  againLabel: {
    color: palette.accentInk,
    fontSize: 15,
    fontFamily: type.bodySemi,
  },
});
