import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tap } from '@/components/ui/tap';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

/** Plain, calm, five- and six-letter words. Nothing that points at a habit. */
const WORDS = [
  'river', 'cloud', 'garden', 'light', 'music', 'forest', 'window', 'summer', 'bridge', 'planet',
  'silver', 'orange', 'stone', 'ocean', 'piano', 'candle', 'honey', 'maple', 'meadow', 'harbor',
  'spring', 'winter', 'circle', 'letter', 'travel', 'gentle', 'quiet', 'anchor', 'breeze', 'lantern',
];
const WORDS_TO_SOLVE = 4;

type Tile = { id: number; ch: string };

function scramble(word: string): Tile[] {
  const tiles = word.split('').map((ch, id) => ({ id, ch }));
  for (let tries = 0; tries < 20; tries++) {
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    if (tiles.map((t) => t.ch).join('') !== word) break;
  }
  return tiles;
}

function pick(exclude: string[]): string {
  const pool = WORDS.filter((w) => !exclude.includes(w));
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * A scrambled word; tap the letters in order. A wrong letter just nudges — the
 * word stays. Four words and you're through. Words come from a short, ordinary
 * list on purpose: this is a distraction, not a vocabulary test.
 */
export function LettersGame({ onDone }: { onDone: () => void }) {
  const [solved, setSolved] = useState<string[]>([]);
  const [word, setWord] = useState<string>(() => pick([]));
  const [tiles, setTiles] = useState<Tile[]>(() => scramble(word));
  const [used, setUsed] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);

  const typed = used.map((id) => tiles.find((t) => t.id === id)!.ch).join('');

  const tap = (tile: Tile) => {
    if (used.includes(tile.id)) return;
    const expected = word[typed.length];
    if (tile.ch !== expected) {
      setWrong(tile.id);
      setTimeout(() => setWrong(null), 300);
      return;
    }
    try {
      Haptics.selectionAsync();
    } catch {}
    const nextUsed = [...used, tile.id];
    setUsed(nextUsed);
    if (nextUsed.length === word.length) {
      const done = [...solved, word];
      if (done.length >= WORDS_TO_SOLVE) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        setTimeout(onDone, 350);
        return;
      }
      setTimeout(() => {
        const w = pick(done);
        setSolved(done);
        setWord(w);
        setTiles(scramble(w));
        setUsed([]);
      }, 450);
    }
  };

  return (
    <View style={s.wrap}>
      <View style={s.answer}>
        {word.split('').map((_, i) => (
          <View key={i} style={[s.slot, i < typed.length && s.slotFilled]}>
            <Text style={s.slotText}>{typed[i] ?? ''}</Text>
          </View>
        ))}
      </View>
      <View style={s.tiles}>
        {tiles.map((t) => {
          const spent = used.includes(t.id);
          return (
            <Tap
              key={t.id}
              haptic="none"
              onPress={() => tap(t)}
              disabled={spent}
              accessibilityRole="button"
              accessibilityLabel={`Letter ${t.ch}`}
              style={[s.tile, spent && s.tileSpent, wrong === t.id && s.tileWrong]}>
              <Text style={[s.tileText, spent && s.tileTextSpent]}>{t.ch}</Text>
            </Tap>
          );
        })}
      </View>
      <Text style={s.round}>
        {solved.length + 1} of {WORDS_TO_SOLVE}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.four },
  answer: { flexDirection: 'row', gap: 8 },
  slot: {
    width: 40,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFilled: { borderColor: palette.accent, backgroundColor: palette.accentWash },
  slotText: { color: palette.text, fontSize: 22, fontFamily: type.displayMed },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 320 },
  tile: { width: 52, height: 56, borderRadius: 14, backgroundColor: palette.surface2, alignItems: 'center', justifyContent: 'center' },
  tileSpent: { backgroundColor: 'transparent' },
  tileWrong: { borderWidth: 1.5, borderColor: palette.danger },
  tileText: { color: palette.text, fontSize: 24, fontFamily: type.displayMed },
  tileTextSpent: { color: palette.surface3 },
  round: { color: palette.textFaint, fontSize: 13, fontFamily: type.bodyMed, fontVariant: ['tabular-nums'] },
});
