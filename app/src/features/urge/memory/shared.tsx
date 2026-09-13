import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Tap } from '@/components/ui/tap';
import { getSetting, setSetting } from '@/db/repo/settings';
import { durations } from '@/theme/motion';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

/**
 * The personal best for one game, read once and kept for the session.
 *
 * `best` is the record *before* the current run, so a run compares against
 * it; `record()` is called when a run ends and is what moves it. Lower-is-
 * better games (a time) pass `lower`.
 */
export function useBest(key: string, lower = false) {
  const [best, setBest] = useState<number | null>(null);
  useEffect(() => {
    void getSetting<number>(key).then((b) => setBest(b ?? 0));
  }, [key]);

  const beats = (value: number) => best !== null && value > 0 && (best === 0 || (lower ? value < best : value > best));
  const record = (value: number) => {
    if (!beats(value)) return;
    setBest(value);
    void setSetting(key, value);
  };
  return { best, beats, record };
}

/**
 * How every game ends: the number, whether it's the best, and one more go a
 * tap away. No "game over", no red — a round ending is just a round ending.
 */
export function GameEnd({
  title,
  sub,
  onAgain,
  onDone,
}: {
  title: string;
  sub: string;
  onAgain: () => void;
  onDone: () => void;
}) {
  return (
    <Animated.View entering={FadeIn.duration(durations.base)} style={s.end}>
      <Text style={s.endTitle}>{title}</Text>
      <Text style={s.endSub}>{sub}</Text>
      <View style={s.endActions}>
        <Tap haptic="light" onPress={onAgain} style={s.again} accessibilityRole="button">
          <Text style={s.againLabel}>Again</Text>
        </Tap>
        <Tap haptic="none" onPress={onDone} style={s.done} accessibilityRole="button">
          <Text style={s.doneLabel}>Done</Text>
        </Tap>
      </View>
    </Animated.View>
  );
}

/** "Best 12." or "A new best." — the line under the number. */
export function bestLine(newBest: boolean, best: number | null, unit = '') {
  if (newBest) return 'A new best.';
  return best ? `Best ${best}${unit}.` : 'Your first.';
}

/** The one line under a stage while playing: a count, a hint, a streak. */
export function Status({ children, accent = false }: { children: string; accent?: boolean }) {
  return <Text style={[s.status, accent && s.statusAccent]}>{children}</Text>;
}

const s = StyleSheet.create({
  status: { color: palette.textFaint, fontSize: 13, fontFamily: type.bodyMed, fontVariant: ['tabular-nums'], minHeight: 18 },
  statusAccent: { color: palette.accent, fontFamily: type.bodySemi },
  end: { alignItems: 'center', gap: Spacing.one },
  endTitle: { color: palette.text, fontSize: 28, fontFamily: type.display, fontVariant: ['tabular-nums'] },
  endSub: { color: palette.textDim, fontSize: 15, fontFamily: type.body, fontVariant: ['tabular-nums'] },
  endActions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  again: { minHeight: 44, paddingHorizontal: 24, justifyContent: 'center', borderRadius: 999, backgroundColor: palette.accent },
  againLabel: { color: palette.accentInk, fontSize: 15, fontFamily: type.bodySemi },
  done: { minHeight: 44, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 999, backgroundColor: palette.surface2 },
  doneLabel: { color: palette.textDim, fontSize: 15, fontFamily: type.bodySemi },
});
