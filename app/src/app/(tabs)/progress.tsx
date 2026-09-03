import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { DayGrid } from '@/components/ui/day-grid';
import { useProfile } from '@/db/repo/profile';
import { Eyebrow, Title } from '@/features/onboarding/components/chrome';
import { Calendar } from '@/features/progress/Calendar';
import { MoodTrend } from '@/features/progress/MoodTrend';
import { useProgressData } from '@/features/progress/use-progress';
import { useStreak } from '@/features/streak/use-streak';
import { dayKey, diffDays, useDayKey } from '@/lib/clock';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

export default function ProgressScreen() {
  const today = useDayKey();
  const { profile } = useProfile();
  const { state } = useStreak();
  const { data } = useProgressData();
  if (!profile || !state || !data) return <SafeAreaView style={s.root} />;

  const quitKey = dayKey(profile.quitStartedAt);
  const relapseKeys = new Set(data.relapses.map((r) => dayKey(r.createdAt)));
  const marks: Record<number, 'relapse' | 'today'> = {};
  for (const r of data.relapses) {
    const idx = diffDays(quitKey, dayKey(r.createdAt));
    if (idx >= 0 && idx < 90) marks[idx] = 'relapse';
  }
  const todayIdx = diffDays(quitKey, today);
  if (todayIdx >= 0 && todayIdx < 90 && !marks[todayIdx]) marks[todayIdx] = 'today';

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Eyebrow>Progress</Eyebrow>
        <Title>The whole picture.</Title>

        <View style={s.tiles}>
          <Tile value={String(state.streak.days)} label="current streak" color={palette.accent} />
          <Tile value={String(state.longest)} label="longest streak" color={hues.progress.solid} />
          <Tile value={String(state.totalClean)} label="clean days total" color={palette.text} />
        </View>
        <View style={s.tiles}>
          <Tile value={String(data.urgesSurvived)} label="urges survived" color={hues.urge.solid} />
          <Tile value={String(data.relapses.length)} label="slips" color={palette.danger} />
          <Tile value={String(data.checkins.length)} label="check-ins" color={hues.checkin.solid} />
        </View>

        <Card>
          <Calendar today={today} quitKey={quitKey} relapseKeys={relapseKeys} pledgeKeys={data.pledgeDates} />
        </Card>

        <Card style={{ gap: Spacing.two }}>
          <Text style={s.cardTitle}>Your 90 days</Text>
          <DayGrid lit={Math.min(90, todayIdx + 1)} marks={marks} />
        </Card>

        <Card style={{ gap: Spacing.two }}>
          <Text style={s.cardTitle}>Mood, last 30 check-ins</Text>
          <MoodTrend checkins={data.checkins} />
        </Card>
        <View style={{ height: 96 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Tile({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={s.tile}>
      <Text style={[s.tileValue, { color }]}>{value}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  content: { padding: Spacing.four, gap: Spacing.three },
  tiles: { flexDirection: 'row', gap: Spacing.two },
  tile: { flex: 1, backgroundColor: palette.surface, borderRadius: 14, padding: Spacing.three, gap: 2 },
  tileValue: { color: palette.text, fontSize: 22, fontFamily: type.display, fontVariant: ['tabular-nums'] },
  tileLabel: { color: palette.textFaint, fontSize: 12, fontFamily: type.bodyMed },
  cardTitle: { color: palette.text, fontSize: 16, fontFamily: type.bodySemi },
});
