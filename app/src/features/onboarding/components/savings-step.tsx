/**
 * What stopping gives back — the money and the hours, across every habit
 * picked, before anyone is asked to commit to anything.
 *
 * Every competitor leads with money saved and we already hold both inputs by
 * this point in the quiz: which habits, and how often. The number is the
 * 90-day program at the user's own frequency, at the same conservative
 * default prices the Savings screen uses later, so the promise made here is
 * the one the app keeps.
 *
 * Honesty rules, same as `features/savings`: USD defaults are labelled as
 * typical prices and correctable; habits with no price (porn, social media)
 * show time instead of an invented figure; nothing here says "you will".
 */
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedReaction,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { BASE_CURRENCY, defaultRate, humanDuration, perDayFor, ratesFor, savedFor } from '@/features/savings/rates';
import { HowWorkedOut, type WorkedOutRow } from '@/features/savings/HowWorkedOut';
import { formatMoney } from '@/features/savings/use-savings';
import { curves, stagger } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { PROGRAM_DAYS } from '../content';
import { selectedHabits, type Answers } from '../lib';
import { Cta } from './chrome';

const COUNT_DELAY = 500;
const COUNT_MS = 1400;

function land() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

export function SavingsStep({ answers, onNext }: { answers: Answers; onNext: () => void }) {
  const reduced = useReducedMotion();
  const [showHow, setShowHow] = useState(false);

  const model = useMemo(() => {
    const habits = selectedHabits(answers);
    const ids = habits.map((h) => h.id);
    const rates = ratesFor(ids, BASE_CURRENCY, undefined);
    const program = savedFor(ids, answers, PROGRAM_DAYS, rates);
    const year = savedFor(ids, answers, 365, rates);
    const moneyKnown = ids.some((id) => (rates[id]?.cost ?? 0) > 0);
    // One line per habit, so "collectively" is visible rather than asserted.
    const rows = habits.map((h) => {
      const rate = rates[h.id] ?? defaultRate(h.id);
      const n = perDayFor(h.id, answers) * PROGRAM_DAYS;
      return {
        id: h.id,
        label: h.label,
        money: n * rate.cost,
        minutes: n * rate.minutes,
        count: Math.round(n),
        units: rate.units,
      };
    });
    // The working, for the sheet: nothing has been set yet, so every price is
    // our default.
    const workedOut: WorkedOutRow[] = habits.map((h) => {
      const rate = rates[h.id] ?? defaultRate(h.id);
      return {
        id: h.id,
        label: h.label,
        cost: rate.cost,
        perDay: perDayFor(h.id, answers),
        unit: rate.unit,
        units: rate.units,
        isDefault: true,
      };
    });
    return { habits, program, year, moneyKnown, rows, workedOut };
  }, [answers]);

  // The hero counts up to the 90-day figure; the reaction formats on the JS
  // side because Intl isn't available in a worklet.
  const progress = useSharedValue(reduced ? 1 : 0);
  const [shown, setShown] = useState(reduced ? 1 : 0);
  const landed = useRef(false);
  useEffect(() => {
    if (reduced) return;
    progress.value = withDelay(
      COUNT_DELAY,
      withTiming(1, { duration: COUNT_MS, easing: curves.height }, (fin) => {
        if (fin && !landed.current) {
          landed.current = true;
          runOnJS(land)();
        }
      }),
    );
  }, [progress, reduced]);
  useAnimatedReaction(
    () => progress.value,
    (v, prev) => {
      if (v !== prev) runOnJS(setShown)(v);
    },
  );

  const heroMoney = model.program.money * shown;
  const heroMinutes = model.program.minutes * shown;
  const copyDelay = reduced ? 0 : COUNT_DELAY + COUNT_MS;

  return (
    <View style={s.root}>
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={s.kicker}>Over the next {PROGRAM_DAYS} days, at your pace, stopping gives back</Text>
      </Animated.View>

      <View style={s.hero} accessibilityLabel={heroLabel(model)}>
        {model.moneyKnown ? (
          <>
            <Text style={[s.heroNumber, { color: palette.accent }]}>{formatMoney(heroMoney)}</Text>
            <Text style={s.heroSub}>
              not spent · about {formatMoney(model.year.money)} a year
            </Text>
          </>
        ) : (
          <>
            <Text style={[s.heroNumber, { color: hues.checkin.solid }]}>{humanDuration(heroMinutes)}</Text>
            <Text style={s.heroSub}>back in your days · about {humanDuration(model.year.minutes)} a year</Text>
          </>
        )}
      </View>

      <Animated.View entering={FadeIn.delay(copyDelay).duration(400)} style={s.second}>
        {model.moneyKnown ? (
          <Text style={s.secondLine}>
            <Text style={[s.secondStrong, { color: hues.checkin.solid }]}>{humanDuration(model.program.minutes)}</Text> of
            your time, too.
          </Text>
        ) : null}
      </Animated.View>

      <View style={s.rows}>
        {model.rows.map((r, i) => (
          <Animated.View
            key={r.id}
            entering={FadeIn.delay(copyDelay + 150 + i * stagger).duration(300)}
            style={s.row}>
            <Text style={s.rowLabel}>{r.label}</Text>
            <Text style={s.rowValue}>
              {r.money > 0 ? formatMoney(r.money) : humanDuration(r.minutes)}
              <Text style={s.rowCount}>
                {'  '}· {r.count.toLocaleString()} {r.units}
              </Text>
            </Text>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeIn.delay(copyDelay + 400).duration(400)}>
        <Text style={s.fine}>
          {model.moneyKnown
            ? 'At typical prices, from how often you said. Set what one really costs you in Settings. '
            : 'From how often you said. Add what one costs you in Settings to see the money too. '}
          <Text
            style={s.link}
            onPress={() => setShowHow(true)}
            accessibilityRole="button"
            accessibilityLabel="How this is worked out">
            How this is worked out
          </Text>
        </Text>
      </Animated.View>

      <HowWorkedOut
        visible={showHow}
        onClose={() => setShowHow(false)}
        rows={model.workedOut}
        days={PROGRAM_DAYS}
        currency={BASE_CURRENCY}
      />

      <Animated.View entering={FadeIn.delay(copyDelay + 500).duration(400)} style={s.bottom}>
        <Cta label="Build my plan" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

function heroLabel(m: { moneyKnown: boolean; program: { money: number; minutes: number } }) {
  return m.moneyKnown
    ? `${formatMoney(m.program.money)} not spent over ${PROGRAM_DAYS} days`
    : `${humanDuration(m.program.minutes)} back over ${PROGRAM_DAYS} days`;
}

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: Spacing.four },
  kicker: { color: palette.textDim, fontSize: 17, lineHeight: 24, fontFamily: type.body, maxWidth: 320 },
  hero: { marginTop: Spacing.four, gap: Spacing.one },
  heroNumber: {
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: -2,
    fontFamily: type.display,
    fontVariant: ['tabular-nums'],
  },
  heroSub: { color: palette.textDim, fontSize: 15, fontFamily: type.bodyMed, fontVariant: ['tabular-nums'] },
  second: { marginTop: Spacing.three, minHeight: 24 },
  secondLine: { color: palette.textDim, fontSize: 17, lineHeight: 24, fontFamily: type.body },
  secondStrong: { fontFamily: type.bodySemi, fontVariant: ['tabular-nums'] },
  rows: { marginTop: Spacing.four, borderRadius: 16, backgroundColor: palette.surface, overflow: 'hidden' },
  row: {
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    marginTop: -1,
  },
  rowLabel: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  rowValue: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'] },
  rowCount: { color: palette.textFaint, fontFamily: type.body },
  fine: { color: palette.textFaint, fontSize: 13, lineHeight: 19, fontFamily: type.body, marginTop: Spacing.three },
  link: { color: palette.accent, fontFamily: type.bodySemi },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: Spacing.four },
});
