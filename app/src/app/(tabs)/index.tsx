import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionTile, HueIcon } from '@/components/ui/action-tile';
import { Tap } from '@/components/ui/tap';
import { DayGrid } from '@/components/ui/day-grid';
import { useCheckin } from '@/db/repo/checkins';
import { useReasons } from '@/db/repo/reasons';
import { MOODS } from '@/features/checkin/CheckinForm';
import { PledgeButton } from '@/features/pledge/PledgeButton';
import { UndoBanner } from '@/features/relapse/UndoBanner';
import { MilestoneRing } from '@/features/streak/MilestoneRing';
import { StreakHero } from '@/features/streak/StreakHero';
import { useStreak } from '@/features/streak/use-streak';
import { useDayKey } from '@/lib/clock';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

export default function HomeScreen() {
  const router = useRouter();
  const today = useDayKey();
  const { state } = useStreak();
  const { checkin } = useCheckin(today);
  const { reasons } = useReasons();
  if (!state) return <SafeAreaView style={s.root} />;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <UndoBanner />

        <View style={s.top}>
          <Text style={s.eyebrow}>Day {state.dayOfProgram} of 90</Text>
          <Text style={s.stat}>
            <Text style={s.statStrong}>{state.daysUntilFreedom}</Text> days to freedom
          </Text>
        </View>
        <StreakHero streak={state.streak} />
        {state.perHabit.length > 0 && (
          <View style={s.habitStrip}>
            {state.perHabit.map((h) => (
              <Tap
                key={h.id}
                haptic="light"
                onPress={() => router.push({ pathname: '/relapse', params: { habit: h.id } })}
                style={s.habitChip}
                accessibilityRole="button"
                accessibilityLabel={`${h.label} streak, ${h.days} days. Tap to log a slip.`}>
                <Text style={s.habitName}>{h.label}</Text>
                <Text style={[s.habitDays, h.days === 0 && { color: palette.textDim }]}>
                  {h.days > 0 ? `${h.days}d` : `${h.hours}h`}
                </Text>
              </Tap>
            ))}
          </View>
        )}

        <Tap haptic="medium" onPress={() => router.push('/urge')} style={s.urgeBar} accessibilityRole="button">
          <HueIcon hue="urge" color={hues.urge.ink} size={26} />
          <View style={{ flex: 1 }}>
            <Text style={s.urgeLabel}>I have an urge</Text>
            <Text style={s.urgeSub}>breathe · wait · remember · distract</Text>
          </View>
          <Text style={s.urgeChev}>›</Text>
        </Tap>

        <View style={s.row}>
          <PledgeButton date={today} compact />
          <ActionTile
            hue="checkin"
            label="Check-in"
            status={checkin ? `${MOODS[checkin.mood - 1]} · edit` : 'rate your day'}
            filled={!!checkin}
            onPress={() => router.push('/checkin')}
          />
          <ActionTile
            hue="reasons"
            label="Reasons"
            status={reasons.length ? `${reasons.length} noted` : 'add your why'}
            onPress={() => router.push('/reasons')}
          />
        </View>

        <Tap haptic="light" onPress={() => router.push('/milestones')} style={s.progressCard} accessibilityRole="button" accessibilityLabel="See all milestones">
          <View style={s.progressTop}>
            <MilestoneRing progress={state.tierProgress} tier={state.tier} next={state.next} size={96} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.cardTitle}>{Math.round(state.rewiring * 100)}% rewired</Text>
              <Text style={s.cardSub}>
                {state.next ? `${state.next.name} at day ${state.next.days}` : 'every tier reached'}
              </Text>
            </View>
            <Text style={s.cardChev}>›</Text>
          </View>
          <DayGrid lit={state.streak.days} />
        </Tap>
        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  content: { padding: Spacing.four, gap: Spacing.four },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  eyebrow: { color: palette.accent, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: type.bodySemi },
  stat: { color: palette.textDim, fontSize: 13, fontFamily: type.bodyMed, fontVariant: ['tabular-nums'] },
  statStrong: { color: palette.text, fontFamily: type.bodySemi },
  row: { flexDirection: 'row', gap: Spacing.two },
  habitStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: -Spacing.two },
  habitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.surface,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  habitName: { color: palette.textDim, fontSize: 13, fontFamily: type.bodyMed },
  habitDays: { color: palette.accent, fontSize: 13, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'] },
  urgeBar: {
    minHeight: 72,
    borderRadius: 22,
    backgroundColor: hues.urge.solid,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  urgeLabel: { color: hues.urge.ink, fontSize: 18, fontFamily: type.bodySemi },
  urgeSub: { color: hues.urge.ink, fontSize: 12, fontFamily: type.bodyMed, opacity: 0.75, marginTop: 1 },
  urgeChev: { color: hues.urge.ink, fontSize: 26, fontFamily: type.body },
  progressCard: {
    gap: Spacing.three,
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: Spacing.three,
  },
  progressTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  cardSub: { color: palette.textDim, fontSize: 13, fontFamily: type.body },
  cardChev: { color: palette.textFaint, fontSize: 24 },
  cardTitle: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
});
