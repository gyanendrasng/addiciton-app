import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Tap } from '@/components/ui/tap';
import { useProfile } from '@/db/repo/profile';
import { Subtitle } from '@/features/onboarding/components/chrome';
import { habits as ALL_HABITS } from '@/features/onboarding/content';
import { withAccess } from '@/features/premium/access';
import { progressThrough } from '@/features/recovery/timeline';
import { useStreak } from '@/features/streak/use-streak';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

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
  const [habitId, setHabitId] = useState<string | null>(null);

  if (!profile || !state) return <Screen title="Your recovery">{null}</Screen>;

  const selected = habitId ?? profile.habits[0];
  // Per-habit streaks exist only when tracking more than one.
  const hours =
    state.perHabit.find((h) => h.id === selected)?.days != null
      ? (state.perHabit.find((h) => h.id === selected)!.days * 24 +
          state.perHabit.find((h) => h.id === selected)!.hours)
      : state.streak.ms / 3_600_000;

  const entries = progressThrough(selected, hours);
  const nextIdx = entries.findIndex((e) => !e.reached);

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
        Sourced from public health guidance. Curb isn’t medical advice — if you’re dependent on
        alcohol or a prescription, stopping suddenly can be dangerous, so talk to a doctor first.
      </Text>
    </Screen>
  );
}

const s = StyleSheet.create({
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
