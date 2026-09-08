import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Tick } from '@/components/ui/tick';
import type { TimelineEntry } from '@/features/recovery/timeline';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

/**
 * What the first days already bought, as a row of banked wins.
 *
 * Deliberately placed above the rings: on day two every ring reads 1% and the
 * screen would otherwise say "nothing yet" to the person least able to hear it.
 */
export function QuickWins({ wins }: { wins: TimelineEntry[] }) {
  const done = wins.filter((w) => w.reached);
  if (done.length === 0) return null;
  const next = wins.find((w) => !w.reached);

  return (
    <View style={s.wrap}>
      {done.map((w, i) => (
        <Animated.View key={w.title} entering={FadeIn.delay(i * 40).duration(240)} style={s.row}>
          <View style={s.tick}>
            <Tick size={13} color={palette.bg} weight={2} />
          </View>
          <View style={s.text}>
            <Text style={s.when}>{w.title}</Text>
            <Text style={s.what}>{w.body}</Text>
          </View>
        </Animated.View>
      ))}
      {next ? <Text style={s.next}>Next up at {next.title}.</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: Spacing.three },
  row: { flexDirection: 'row', gap: Spacing.three },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  text: { flex: 1 },
  when: { color: palette.text, fontSize: 15, fontFamily: type.bodyMed },
  what: { color: palette.textFaint, fontSize: 14, fontFamily: type.body, lineHeight: 20, marginTop: 2 },
  next: { color: palette.textFaint, fontSize: 13, fontFamily: type.body, marginTop: Spacing.one },
});
