import * as Haptics from 'expo-haptics';
import { useEffect, useReducer, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

import { curves, durations, springs } from '@/theme/motion';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { createGame, gameReducer, isDone, PAIRS } from './logic';
import { bestLine, GameEnd, Status, useBest } from './shared';

const MISMATCH_MS = 600;
/** Every card shows for a moment at the start — the game is remembering it. */
const PEEK_MS = 1600;
const BEST_KEY = 'game.pairs.best';

/**
 * Pairs. Twelve cards, six pairs, all shown for a breath and then turned
 * over; clear them against the clock. Pure visuospatial memory — where was
 * the triangle — which is the load the craving research points at, and a
 * time to beat is what makes the next go worth it.
 */
export function MemoryGame({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [game, dispatch] = useReducer(gameReducer, undefined, createGame);
  const [run, setRun] = useState(0);
  const [peeking, setPeeking] = useState(true);
  const [secs, setSecs] = useState(0);
  const { best, beats, record } = useBest(BEST_KEY, true);

  const cleared = isDone(game);
  const newBest = cleared && beats(secs);

  // The peek, then the clock.
  useEffect(() => {
    const t = setTimeout(() => setPeeking(false), PEEK_MS);
    return () => clearTimeout(t);
  }, [run]);

  useEffect(() => {
    if (peeking || cleared) return;
    const t = setInterval(() => setSecs((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [peeking, cleared]);

  useEffect(() => {
    if (!game.locked) return;
    const t = setTimeout(() => dispatch({ type: 'resolve' }), MISMATCH_MS);
    return () => clearTimeout(t);
  }, [game.locked]);

  useEffect(() => {
    try {
      if (cleared) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (game.matched.length > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  }, [cleared, game.matched.length]);

  const again = () => {
    record(secs);
    dispatch({ type: 'reset' });
    setSecs(0);
    setPeeking(true);
    setRun((r) => r + 1);
  };
  const done = () => {
    record(secs);
    onDone();
  };

  const found = game.matched.length / 2;

  return (
    <View style={s.wrap}>
      <View style={s.grid}>
        {game.cards.map((card, i) => {
          const solved = game.matched.includes(i);
          const up = peeking || solved || game.open.includes(i);
          return (
            <Card
              key={`${run}-${card.id}`}
              glyph={card.glyph}
              up={up}
              solved={solved}
              reduced={reduced}
              disabled={peeking || up || game.locked}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                dispatch({ type: 'flip', index: i });
              }}
            />
          );
        })}
      </View>
      {cleared ? (
        <GameEnd title={`Cleared in ${secs}s`} sub={bestLine(newBest, best, 's')} onAgain={again} onDone={done} />
      ) : (
        <Status>{peeking ? 'Remember where they are.' : `${found} of ${PAIRS} · ${secs}s${best ? ` · Best ${best}s` : ''}`}</Status>
      )}
    </View>
  );
}

/** A card that turns over — a real flip, with the glyph on the far side. */
function Card({
  glyph,
  up,
  solved,
  reduced,
  disabled,
  onPress,
}: {
  glyph: number;
  up: boolean;
  solved: boolean;
  reduced: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const flip = useSharedValue(up ? 1 : 0);
  const pop = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      flip.set(up ? 1 : 0);
    } else {
      flip.set(withTiming(up ? 1 : 0, { duration: durations.base, easing: curves.inOut }));
    }
  }, [flip, reduced, up]);

  useEffect(() => {
    if (!solved || reduced) return;
    pop.set(0.92);
    pop.set(withSpring(1, springs.pop));
  }, [pop, reduced, solved]);

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${flip.get() * 180}deg` }, { scale: pop.get() }],
  }));
  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${flip.get() * 180 + 180}deg` }, { scale: pop.get() }],
  }));

  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={up ? `card ${glyph + 1}` : 'face-down card'} style={s.slot}>
      <Animated.View style={[s.card, s.back, backStyle]}>
        <View style={s.backMark} />
      </Animated.View>
      <Animated.View style={[s.card, s.face, solved && s.faceSolved, faceStyle]}>
        <Glyph n={glyph} solved={solved} />
      </Animated.View>
    </Pressable>
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

const CARD = 92;

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.three },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: 3 * CARD + 2 * 10 },
  slot: { width: CARD, height: CARD },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  back: { backgroundColor: palette.surface2, borderWidth: 1.5, borderColor: palette.line },
  backMark: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: palette.surface3 },
  face: { backgroundColor: palette.surface3, borderWidth: 1.5, borderColor: palette.textFaint },
  faceSolved: { backgroundColor: palette.accent, borderColor: palette.accent },
});
