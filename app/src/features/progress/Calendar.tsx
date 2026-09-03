import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tap } from '@/components/ui/tap';
import { Chevron } from '@/features/onboarding/components/chrome';
import { dayKey, dayKeyToMs } from '@/lib/clock';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export type DayState = 'clean' | 'relapse' | 'future' | 'before';

export function Calendar({
  today,
  quitKey,
  relapseKeys,
  pledgeKeys,
  canGoBack = () => true,
  onBlockedBack,
}: {
  today: string;
  quitKey: string;
  relapseKeys: Set<string>;
  pledgeKeys: Set<string>;
  canGoBack?: (monthKey: string) => boolean;
  onBlockedBack?: () => void;
}) {
  const [y0, m0] = today.split('-').map(Number);
  const [cursor, setCursor] = useState({ y: y0, m: m0 }); // m is 1-based
  const first = new Date(cursor.y, cursor.m - 1, 1);
  const daysInMonth = new Date(cursor.y, cursor.m, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const monthKey = `${cursor.y}-${String(cursor.m).padStart(2, '0')}`;
  const isCurrent = cursor.y === y0 && cursor.m === m0;

  const stateFor = (d: number): DayState => {
    const key = `${monthKey}-${String(d).padStart(2, '0')}`;
    if (relapseKeys.has(key)) return 'relapse';
    if (dayKeyToMs(key) > dayKeyToMs(today)) return 'future';
    if (dayKeyToMs(key) < dayKeyToMs(quitKey)) return 'before';
    return 'clean';
  };

  const goBack = () => {
    const prev = cursor.m === 1 ? { y: cursor.y - 1, m: 12 } : { y: cursor.y, m: cursor.m - 1 };
    const prevKey = `${prev.y}-${String(prev.m).padStart(2, '0')}`;
    if (!canGoBack(prevKey)) return onBlockedBack?.();
    setCursor(prev);
  };
  const goFwd = () => {
    if (isCurrent) return;
    setCursor(cursor.m === 12 ? { y: cursor.y + 1, m: 1 } : { y: cursor.y, m: cursor.m + 1 });
  };

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <Tap haptic="none" onPress={goBack} style={s.nav} accessibilityLabel="Previous month"><Chevron size={18} /></Tap>
        <Text style={s.month}>{MONTHS[cursor.m - 1]} {cursor.y}</Text>
        <Tap haptic="none" onPress={goFwd} style={[s.nav, isCurrent && { opacity: 0.3 }]} accessibilityLabel="Next month">
          <View style={{ transform: [{ scaleX: -1 }] }}><Chevron size={18} /></View>
        </Tap>
      </View>
      <View style={s.row}>{DOW.map((d, i) => <Text key={i} style={s.dow}>{d}</Text>)}</View>
      <View style={s.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={s.cell} />;
          const st = stateFor(d);
          const key = `${monthKey}-${String(d).padStart(2, '0')}`;
          const isToday = key === today;
          const pledged = pledgeKeys.has(key);
          return (
            <View key={i} style={s.cell}>
              <View style={[s.day, st === 'clean' && s.dayClean, st === 'relapse' && s.dayRelapse, isToday && s.dayToday]}>
                <Text style={[s.dayText, st === 'clean' && s.dayTextClean, st === 'relapse' && s.dayTextRelapse, (st === 'future' || st === 'before') && s.dayTextMuted]}>{d}</Text>
                {pledged && <View style={s.pledgeDot} />}
              </View>
            </View>
          );
        })}
      </View>
      <View style={s.legend}>
        <Legend color={palette.accent} label="clean" />
        <Legend color={palette.danger} label="slip" />
        <Legend color={palette.text} label="pledged" dot />
      </View>
    </View>
  );
}

function Legend({ color, label, dot }: { color: string; label: string; dot?: boolean }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendSwatch, { backgroundColor: color }, dot && { width: 5, height: 5, borderRadius: 2.5 }]} />
      <Text style={s.legendLabel}>{label}</Text>
    </View>
  );
}

export const keyOf = (ms: number) => dayKey(ms);

const s = StyleSheet.create({
  wrap: { gap: Spacing.two },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  month: { color: palette.text, fontSize: 16, fontFamily: type.bodySemi },
  row: { flexDirection: 'row' },
  dow: { flex: 1, textAlign: 'center', color: palette.textFaint, fontSize: 11, fontFamily: type.bodySemi },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  day: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  dayClean: { backgroundColor: palette.accentWash },
  dayRelapse: { backgroundColor: 'rgba(224, 101, 90, 0.16)' },
  dayToday: { borderWidth: 1.5, borderColor: palette.text },
  dayText: { color: palette.text, fontSize: 13, fontFamily: type.bodyMed, fontVariant: ['tabular-nums'] },
  dayTextClean: { color: palette.accent, fontFamily: type.bodySemi },
  dayTextRelapse: { color: palette.danger, fontFamily: type.bodySemi },
  dayTextMuted: { color: palette.textFaint },
  pledgeDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: palette.text },
  legend: { flexDirection: 'row', gap: Spacing.three, justifyContent: 'center', marginTop: Spacing.one },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { color: palette.textFaint, fontSize: 12, fontFamily: type.bodyMed },
});
