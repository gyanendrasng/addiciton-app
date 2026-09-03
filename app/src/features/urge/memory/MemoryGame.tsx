import { useEffect, useReducer } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

import { Tap } from '@/components/ui/tap';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { createGame, gameReducer, isDone } from './logic';

const MISMATCH_MS = 700;

/** Six-pair memory match. Effortful on purpose: it occupies working memory for ~60–90s. */
export function MemoryGame({ onDone }: { onDone: (moves: number) => void }) {
  const [game, dispatch] = useReducer(gameReducer, undefined, createGame);

  useEffect(() => {
    if (!game.locked) return;
    const t = setTimeout(() => dispatch({ type: 'resolve' }), MISMATCH_MS);
    return () => clearTimeout(t);
  }, [game.locked]);

  useEffect(() => {
    if (isDone(game)) {
      const t = setTimeout(() => onDone(game.moves), 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.matched.length]);

  return (
    <View style={s.wrap}>
      <View style={s.grid}>
        {game.cards.map((card, i) => {
          const up = game.open.includes(i) || game.matched.includes(i);
          const solved = game.matched.includes(i);
          return (
            <Tap
              key={card.id}
              haptic="selection"
              onPress={() => dispatch({ type: 'flip', index: i })}
              disabled={up}
              style={[s.card, up && s.cardUp, solved && s.cardSolved]}
              accessibilityLabel={up ? `card ${card.glyph + 1}` : 'face-down card'}>
              {up ? (
                <Animated.View entering={FadeIn.duration(150)}>
                  <Glyph n={card.glyph} solved={solved} />
                </Animated.View>
              ) : (
                <View style={s.back} />
              )}
            </Tap>
          );
        })}
      </View>
      <View style={s.stats}>
        <Text style={s.stat}>{game.matched.length / 2}/6 pairs</Text>
        <View style={s.statDivider} />
        <Text style={s.stat}>{game.moves} moves</Text>
      </View>
    </View>
  );
}

function Glyph({ n, solved }: { n: number; solved: boolean }) {
  const c = solved ? palette.accentInk : palette.text;
  const size = 30;
  switch (n) {
    case 0:
      return <Svg width={size} height={size} viewBox="0 0 30 30"><Circle cx="15" cy="15" r="11" fill={c} /></Svg>;
    case 1:
      return <Svg width={size} height={size} viewBox="0 0 30 30"><Rect x="5" y="5" width="20" height="20" rx="4" fill={c} /></Svg>;
    case 2:
      return <Svg width={size} height={size} viewBox="0 0 30 30"><Polygon points="15,4 27,26 3,26" fill={c} /></Svg>;
    case 3:
      return <Svg width={size} height={size} viewBox="0 0 30 30"><Polygon points="15,3 27,15 15,27 3,15" fill={c} /></Svg>;
    case 4:
      return <Svg width={size} height={size} viewBox="0 0 30 30"><Circle cx="15" cy="15" r="10" stroke={c} strokeWidth="5" fill="none" /></Svg>;
    default:
      return <Svg width={size} height={size} viewBox="0 0 30 30"><Path d="M15 4 V26 M4 15 H26" stroke={c} strokeWidth="5" strokeLinecap="round" /></Svg>;
  }
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.three },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: 3 * 92 + 2 * 10 },
  card: {
    width: 92,
    height: 92,
    borderRadius: 16,
    backgroundColor: palette.surface2,
    borderWidth: 1.5,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: palette.surface3 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: palette.surface, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  stat: { color: palette.textDim, fontSize: 13, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'] },
  statDivider: { width: 1, height: 12, backgroundColor: palette.line },
  cardUp: { backgroundColor: palette.surface3, borderColor: palette.textFaint },
  cardSolved: { backgroundColor: palette.accent, borderColor: palette.accent },

});
