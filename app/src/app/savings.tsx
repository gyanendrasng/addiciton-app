import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useProfile } from '@/db/repo/profile';
import { setSetting, useSetting } from '@/db/repo/settings';
import { habits as ALL_HABITS } from '@/features/onboarding/content';
import { Subtitle } from '@/features/onboarding/components/chrome';
import { withAccess } from '@/features/premium/access';
import { BASE_CURRENCY, defaultRate, perDayFor, type Rate } from '@/features/savings/rates';
import {
  CURRENCY_KEY,
  formatMoney,
  RATES_KEY,
  useSavings,
} from '@/features/savings/use-savings';
import { Tap } from '@/components/ui/tap';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

/**
 * The savings detail — and where the price gets set.
 *
 * There is no default price, by design: the currency comes from the device
 * locale, so any hard-coded figure is wrong wherever it isn't right. Money
 * appears once the user says what one costs *them*, which is also the only
 * number they'll believe. Time is shown from day one — an hour is an hour
 * everywhere.
 */
/** The currencies most users will want. USD first — it's the default. */
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'BRL', 'MXN', 'ZAR', 'AED', 'SGD'];

function SavingsScreen() {
  const { profile } = useProfile();
  const savings = useSavings();
  const { value: overrides } = useSetting<Record<string, Rate>>(RATES_KEY, {});
  const { value: currency } = useSetting<string>(CURRENCY_KEY, BASE_CURRENCY);
  const [draft, setDraft] = useState<Record<string, string>>({});

  if (!profile || !savings) return <Screen title="What you’ve kept">{null}</Screen>;

  const saveCost = async (habitId: string, text: string) => {
    const n = Number(text.replace(/[^0-9.]/g, ''));
    const base = overrides?.[habitId] ?? defaultRate(habitId);
    const next = { ...(overrides ?? {}), [habitId]: { ...base, cost: Number.isFinite(n) ? n : 0 } };
    await setSetting(RATES_KEY, next);
  };

  return (
    <Screen title="What you’ve kept">
      <Subtitle>
        Worked out from how often you said you {profile.habits.length > 1 ? 'did these' : 'did it'}{' '}
        and{' '}
        {savings.days < 1
          ? 'today so far'
          : `your ${Math.floor(savings.days)} clean ${Math.floor(savings.days) === 1 ? 'day' : 'days'}`}
        .
      </Subtitle>

      <View style={s.big}>
        {savings.moneyUnknown ? null : (
          <View style={s.bigStat}>
            <Text style={[s.bigValue, { color: palette.accent }]}>{savings.moneyLabel}</Text>
            <Text style={s.bigLabel}>not spent</Text>
          </View>
        )}
        <View style={s.bigStat}>
          <Text style={[s.bigValue, { color: hues.checkin.solid }]}>{savings.timeLabel}</Text>
          <Text style={s.bigLabel}>back in your day</Text>
        </View>
      </View>

      <Text style={s.section}>Currency</Text>
      <View style={s.chips}>
        {CURRENCIES.map((code) => {
          const on = code === currency;
          return (
            <Tap
              key={code}
              haptic="selection"
              onPress={() => setSetting(CURRENCY_KEY, code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={[s.chip, on && s.chipOn]}>
              <Text style={[s.chipLabel, on && s.chipLabelOn]}>{code}</Text>
            </Tap>
          );
        })}
      </View>

      <Text style={s.section}>What one costs you</Text>
      {savings.moneyUnknown ? (
        <Text style={s.prompt}>
          Put in what one actually costs you and the money appears. The starting figures are US
          prices, so switching currency clears them rather than pretending a dollar is a rupee.
        </Text>
      ) : null}
      <Card style={s.card}>
        {profile.habits.map((id, i) => {
          const habit = ALL_HABITS.find((h) => h.id === id);
          const rate = savings.rates[id] ?? defaultRate(id);
          const perDay = perDayFor(id, profile.answers);
          const key = `${id}-cost`;
          const shown = draft[key] ?? (rate.cost ? String(rate.cost) : '');
          return (
            <View key={id}>
              {i === 0 ? null : <View style={s.sep} />}
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowLabel}>{habit?.label ?? id}</Text>
                  <Text style={s.rowSub}>
                    {perDay >= 1
                      ? `About ${Math.round(perDay)} a day`
                      : `About ${Math.round(perDay * 7)} a week`}{' '}
                    · {rate.minutes} min each
                  </Text>
                </View>
                <View style={s.inputWrap}>
                  <TextInput
                    style={s.input}
                    value={shown}
                    onChangeText={(t) => setDraft({ ...draft, [key]: t })}
                    onEndEditing={() => saveCost(id, shown)}
                    onBlur={() => saveCost(id, shown)}
                    placeholder="0"
                    placeholderTextColor={palette.textFaint}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    accessibilityLabel={`Cost of one ${rate.unit}`}
                  />
                  <Text style={s.currency}>{currency}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </Card>

      <Text style={s.foot}>
        Per {profile.habits.length > 1 ? 'one of each' : `one ${savings.rates[profile.habits[0]]?.unit ?? 'time'}`}.
        Leave it at zero for anything that costs you time rather than money — that one still counts
        toward the hours.
      </Text>

      {savings.moneyUnknown ? null : (
        <Text style={s.foot}>
          At this rate that’s about{' '}
          {formatMoney((savings.money / Math.max(1, savings.days)) * 365, currency)} a year.
        </Text>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  big: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.five },
  bigStat: { flex: 1, gap: 4 },
  bigValue: {
    fontSize: 34,
    lineHeight: 38,
    fontFamily: type.display,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.8,
  },
  bigLabel: { color: palette.textDim, fontSize: 14, fontFamily: type.body },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.surface2,
    borderWidth: 1,
    borderColor: palette.line,
  },
  chipOn: { borderColor: palette.accent, backgroundColor: palette.accentWash },
  chipLabel: {
    color: palette.textDim,
    fontSize: 13,
    fontFamily: type.bodyMed,
    fontVariant: ['tabular-nums'],
  },
  chipLabelOn: { color: palette.accent, fontFamily: type.bodySemi },
  prompt: {
    color: palette.textDim,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: type.body,
    marginTop: Spacing.two,
  },
  section: {
    color: palette.textDim,
    fontSize: 13,
    fontFamily: type.bodySemi,
    letterSpacing: 0.3,
    marginTop: Spacing.five,
  },
  card: { padding: 0, marginTop: Spacing.two, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  sep: { height: 1, backgroundColor: palette.line, marginLeft: Spacing.three },
  rowLabel: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  rowSub: { color: palette.textDim, fontSize: 13, fontFamily: type.body, marginTop: 2 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    minWidth: 64,
    height: 40,
    borderRadius: 10,
    backgroundColor: palette.surface2,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: 10,
    color: palette.text,
    fontSize: 16,
    textAlign: 'right',
    fontFamily: type.bodySemi,
    fontVariant: ['tabular-nums'],
  },
  currency: { color: palette.textFaint, fontSize: 12, fontFamily: type.bodyMed, width: 30 },
  foot: {
    color: palette.textFaint,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: type.body,
    marginTop: Spacing.four,
  },
});

// Not reachable without an account and a subscription — see features/premium/access.
export default withAccess(SavingsScreen);
