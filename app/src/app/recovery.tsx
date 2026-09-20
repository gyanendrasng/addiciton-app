import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Tap } from '@/components/ui/tap';
import { useProfile } from '@/db/repo/profile';
import { useSetting } from '@/db/repo/settings';
import { Subtitle } from '@/features/onboarding/components/chrome';
import { habits as ALL_HABITS } from '@/features/onboarding/content';
import { withAccess } from '@/features/premium/access';
import { HealthRings } from '@/features/recovery/HealthRings';
import { ORGAN_NAME, OrganPicture, organFor } from '@/features/recovery/OrganFill';
import { QuickWins } from '@/features/recovery/QuickWins';
import { RecoveryCurve } from '@/features/recovery/RecoveryCurve';
import { healthRings, progressThrough, quickWins, recoveryFill } from '@/features/recovery/timeline';
import { BASE_CURRENCY, ratesFor, savedFor, type Rate } from '@/features/savings/rates';
import { CURRENCY_KEY, formatMoney, RATES_KEY } from '@/features/savings/use-savings';
import { useStreak } from '@/features/streak/use-streak';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

// The organ on the detail page: a portrait, not the hero it is on Home.
const ORGAN_SIZE = 132;

/**
 * What the clean time is doing to you.
 *
 * The streak counts days; this says what those days bought. It's the most
 * cited reason people give for sticking with a cessation app, and it costs
 * nothing to ship — the content is static and the position comes from the
 * streak we already compute.
 */
function RecoveryScreen() {
  const { profile } = useProfile();
  const { state } = useStreak();
  // Home's organ carousel opens this screen on a specific habit.
  const params = useLocalSearchParams<{ habit?: string }>();
  const [habitId, setHabitId] = useState<string | null>(params.habit ?? null);
  const { value: overrides } = useSetting<Record<string, Rate>>(RATES_KEY, {});
  const { value: currency } = useSetting<string>(CURRENCY_KEY, BASE_CURRENCY);

  if (!profile || !state) return <Screen title="Your recovery">{null}</Screen>;

  const selected = habitId ?? profile.habits[0];
  // This habit's own run; the whole streak only if the habit has no counter yet.
  const own = state.perHabit.find((h) => h.id === selected);
  const hours = own ? own.days * 24 + own.hours : state.streak.ms / 3_600_000;

  const entries = progressThrough(selected, hours);
  // What this habit's streak has kept: the same arithmetic as the Savings screen, for one habit.
  const rates = ratesFor([selected], currency, overrides);
  const kept = savedFor([selected], profile.answers, hours / 24, rates);
  const keptHours = Math.round(kept.minutes / 60);
  const nextIdx = entries.findIndex((e) => !e.reached);
  const rings = healthRings(selected, hours);
  const wins = quickWins(selected, hours);
  const organ = organFor(selected);
  const fill = recoveryFill(selected, hours);
  const pct = Math.round(fill.fraction * 100);

  return (
    <Screen title="Your recovery">
      <Subtitle>
        What tends to happen after you stop, and where {hours < 24 ? 'today' : 'your streak'} has got
        you. Timings are typical, not promises — bodies differ.
      </Subtitle>

      {profile.habits.length > 1 ? (
        <View style={s.chips}>
          {profile.habits.map((id) => {
            const on = id === selected;
            return (
              <Tap key={id} haptic="selection" onPress={() => setHabitId(id)} style={[s.chip, on && s.chipOn]}>
                <Text style={[s.chipLabel, on && s.chipLabelOn]}>
                  {ALL_HABITS.find((h) => h.id === id)?.label ?? id}
                </Text>
              </Tap>
            );
          })}
        </View>
      ) : null}

      <Card style={s.organCard}>
        <View style={s.organRow}>
          <OrganPicture key={selected} organ={organ} progress={fill.fraction} size={ORGAN_SIZE} />
          <View style={s.organWords}>
            <Text style={s.organPct}>{pct}%</Text>
            <Text style={s.organName}>{ORGAN_NAME[organ]} recovery</Text>
            <Text style={s.organNext}>{fill.next ? `Next milestone at ${fill.next.title}` : 'Every milestone reached'}</Text>
          </View>
        </View>
        <RecoveryCurve habitId={selected} hoursClean={hours} />
        <Text style={s.organNote}>
          How the number is worked out: the recovery timeline for your {ORGAN_NAME[organ].toLowerCase()} from the research, month by month, with the dot where your
          streak is. Steep at first, then slower — the early days count for a lot.
        </Text>
      </Card>

      <Card style={s.keptCard}>
        {kept.money > 0 ? (
          <View style={s.kept}>
            <Text style={[s.keptValue, { color: palette.accent }]}>{formatMoney(kept.money, currency)}</Text>
            <Text style={s.keptLabel}>not spent</Text>
          </View>
        ) : null}
        <View style={s.kept}>
          <Text style={[s.keptValue, { color: hues.checkin.solid }]}>
            {keptHours.toLocaleString()} {keptHours === 1 ? 'hour' : 'hours'}
          </Text>
          <Text style={s.keptLabel}>back in your days</Text>
        </View>
      </Card>

      {wins.some((w) => w.reached) ? (
        <>
          <Text style={s.section}>Already banked</Text>
          <Card style={s.ringCard}>
            <QuickWins wins={wins} />
          </Card>
        </>
      ) : null}

      {rings.length > 0 ? (
        <>
          <Text style={s.section}>How far you&apos;ve come</Text>
          <Card style={s.ringCard}>
            <HealthRings rings={rings} />
            <Text style={s.ringNote}>
              Progress toward the milestones below — how much of the way your streak has come, not a
              measurement of your own risk.
            </Text>
          </Card>
        </>
      ) : null}

      <Card style={s.card}>
        {entries.map((e, i) => {
          const isNext = i === nextIdx;
          return (
            <View key={e.title} style={s.item}>
              <View style={s.rail}>
                <View
                  style={[
                    s.node,
                    e.reached && s.nodeDone,
                    isNext && s.nodeNext,
                  ]}>
                  {e.reached && Platform.OS === 'ios' ? (
                    <SymbolView
                      name="checkmark"
                      size={10}
                      weight="bold"
                      tintColor={palette.accentInk}
                      style={s.tick}
                    />
                  ) : null}
                </View>
                {i === entries.length - 1 ? null : (
                  <View style={[s.line, e.reached && s.lineDone]} />
                )}
              </View>
              <View style={s.body}>
                <Text style={[s.when, e.reached && s.whenDone, isNext && s.whenNext]}>
                  {e.title}
                  {isNext ? ' · next' : ''}
                </Text>
                <Text style={s.what}>{e.body}</Text>
              </View>
            </View>
          );
        })}
      </Card>

      <Text style={s.foot}>
        Sourced from public health guidance. Qwyt isn’t medical advice — if you’re dependent on
        alcohol or a prescription, stopping suddenly can be dangerous, so talk to a doctor first.
      </Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  section: {
    color: palette.text,
    fontSize: 17,
    fontFamily: type.displayMed,
    marginTop: Spacing.five,
    marginBottom: Spacing.three,
  },
  ringCard: { padding: Spacing.four },
  ringNote: {
    color: palette.textFaint,
    fontSize: 12,
    fontFamily: type.body,
    lineHeight: 17,
    marginTop: Spacing.four,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.three },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: palette.surface2,
    borderWidth: 1,
    borderColor: palette.line,
  },
  chipOn: { borderColor: palette.accent, backgroundColor: palette.accentWash },
  chipLabel: { color: palette.textDim, fontSize: 14, fontFamily: type.bodyMed },
  chipLabelOn: { color: palette.accent, fontFamily: type.bodySemi },

  card: { marginTop: Spacing.four, paddingVertical: Spacing.three },
  // The same organ as Home, with its number and what it's working toward beside it.
  organCard: { marginTop: Spacing.four },
  organRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  organWords: { flex: 1, gap: 2 },
  organNote: { color: palette.textFaint, fontSize: 12, lineHeight: 17, fontFamily: type.body, marginTop: Spacing.three },
  organPct: { color: palette.accent, fontSize: 34, lineHeight: 38, fontFamily: type.display, fontVariant: ['tabular-nums'], letterSpacing: -1 },
  organName: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  organNext: { color: palette.textDim, fontSize: 13, lineHeight: 18, fontFamily: type.body, marginTop: 2 },
  keptCard: { marginTop: Spacing.four, flexDirection: 'row', gap: Spacing.four },
  kept: { flex: 1, gap: 2 },
  keptValue: { fontSize: 28, lineHeight: 32, fontFamily: type.display, fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  keptLabel: { color: palette.textDim, fontSize: 13, fontFamily: type.body },
  item: { flexDirection: 'row', gap: Spacing.three },
  rail: { alignItems: 'center', width: 20 },
  node: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  nodeDone: { backgroundColor: palette.accent, borderColor: palette.accent },
  nodeNext: { borderColor: palette.accent },
  tick: { width: 10, height: 10 },
  line: { flex: 1, width: 2, backgroundColor: palette.line, marginVertical: 4 },
  lineDone: { backgroundColor: palette.accent },
  body: { flex: 1, paddingBottom: Spacing.four, gap: 3 },
  when: { color: palette.textDim, fontSize: 15, fontFamily: type.bodySemi },
  whenDone: { color: palette.text },
  whenNext: { color: palette.accent },
  what: { color: palette.textDim, fontSize: 14, lineHeight: 20, fontFamily: type.body },
  foot: {
    color: palette.textFaint,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: type.body,
    marginTop: Spacing.four,
  },
});

// Not reachable without an account and a subscription — see features/premium/access.
export default withAccess(RecoveryScreen);
