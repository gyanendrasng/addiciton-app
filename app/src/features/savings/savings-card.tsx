import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Tap } from '@/components/ui/tap';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { useSavings } from './use-savings';

/**
 * What the clean days bought you.
 *
 * A streak counts days; this says what the days are worth, which is the thing
 * people actually screenshot. Money is hidden entirely when no habit has a
 * price — an invented number would be worse than none, and for porn or social
 * media the honest figure is time, not money.
 */
export function SavingsCard() {
  const router = useRouter();
  const savings = useSavings();
  if (!savings) return null;

  const showMoney = !savings.moneyUnknown;

  return (
    <Tap haptic="light" onPress={() => router.push('/savings')}>
      <Card style={s.card}>
        <View style={s.head}>
          <Text style={s.title}>What you’ve kept</Text>
          <Text style={s.chev}>›</Text>
        </View>
        <View style={s.row}>
          {showMoney ? (
            <View style={s.stat}>
              <Text style={[s.value, { color: palette.accent }]}>{savings.moneyLabel}</Text>
              <Text style={s.label}>not spent</Text>
            </View>
          ) : null}
          <View style={s.stat}>
            <Text style={[s.value, { color: hues.checkin.solid }]}>{savings.timeLabel}</Text>
            <Text style={s.label}>back in your day</Text>
          </View>
          {showMoney ? null : (
            <View style={s.stat}>
              <Text style={[s.value, { color: hues.progress.solid }]}>
                {Math.floor(savings.occurrences)}
              </Text>
              <Text style={s.label}>times you didn’t</Text>
            </View>
          )}
        </View>
        {showMoney ? null : (
          <Text style={s.hint}>Add what one costs to see the money too.</Text>
        )}
      </Card>
    </Tap>
  );
}

const s = StyleSheet.create({
  card: { gap: Spacing.three },
  head: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, color: palette.text, fontSize: 16, fontFamily: type.bodySemi },
  chev: { color: palette.textFaint, fontSize: 20, fontFamily: type.body },
  row: { flexDirection: 'row', gap: Spacing.three },
  stat: { flex: 1, gap: 2 },
  value: {
    fontSize: 26,
    lineHeight: 30,
    fontFamily: type.display,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  label: { color: palette.textDim, fontSize: 13, fontFamily: type.body },
  hint: { color: palette.textFaint, fontSize: 13, fontFamily: type.body },
});
