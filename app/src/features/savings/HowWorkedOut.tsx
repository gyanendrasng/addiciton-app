import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Tap } from '@/components/ui/tap';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { formatMoney } from './use-savings';

export type WorkedOutRow = {
  id: string;
  label: string;
  /** what one occurrence is priced at, in `currency`; 0 when no price is set */
  cost: number;
  /** occurrences per day, from the onboarding frequency answer */
  perDay: number;
  unit: string;
  units: string;
  /** true when the price is our default rather than one the user set */
  isDefault: boolean;
};

/**
 * Where the money number comes from, in full.
 *
 * Nothing requires this — a savings estimate isn't a regulated claim — but a
 * number with its working shown is one people trust and correct, and a
 * corrected number is theirs. It also happens to be the strongest answer to
 * "where did that figure come from" if anyone ever asks.
 */
export function HowWorkedOut({
  visible,
  onClose,
  rows,
  days,
  currency,
  onEdit,
}: {
  visible: boolean;
  onClose: () => void;
  rows: WorkedOutRow[];
  /** the period the headline covers — 90 for the program, or the clean days so far */
  days: number;
  currency: string;
  /** when given, a button to go and set real prices */
  onEdit?: () => void;
}) {
  const periodLabel = `${Math.round(days)} ${Math.round(days) === 1 ? 'day' : 'days'}`;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.root} edges={['bottom']}>
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>How this is worked out</Text>
          <Text style={s.formula}>
            <Text style={s.formulaStrong}>what one costs</Text> × <Text style={s.formulaStrong}>how often you said</Text> ×{' '}
            <Text style={s.formulaStrong}>{periodLabel}</Text>
          </Text>

          <View style={s.table}>
            {rows.map((r) => (
              <View key={r.id} style={s.row}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.rowLabel}>{r.label}</Text>
                  <Text style={s.rowSub}>
                    {describeFrequency(r.perDay, r.unit, r.units)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Text style={s.rowValue}>{r.cost > 0 ? `${formatMoney(r.cost, currency)} a ${r.unit}` : 'no price set'}</Text>
                  <Text style={s.rowSub}>{r.cost > 0 ? (r.isDefault ? 'typical price' : 'your price') : 'time only'}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={s.body}>
            The typical prices are deliberately on the low side, and they’re in {currency}. Your real number is
            probably higher — set what one actually costs you and Nocrave uses that instead, everywhere.
          </Text>
          <Text style={s.body}>
            This is an estimate from your own answers, not a promise. It counts what you didn’t buy on the days
            you didn’t; it doesn’t know about anything else.
          </Text>
        </ScrollView>
        <View style={s.footer}>
          {onEdit ? (
            <Tap haptic="light" onPress={onEdit} style={s.secondary} accessibilityRole="button">
              <Text style={s.secondaryLabel}>Set my prices</Text>
            </Tap>
          ) : null}
          <Tap haptic="light" onPress={onClose} style={s.primary} accessibilityRole="button">
            <Text style={s.primaryLabel}>Got it</Text>
          </Tap>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/** "3 drinks a day" / "1 drink a day" / "about 3 sessions a week" / "about 1 a week" */
export function describeFrequency(perDay: number, unit: string, units: string): string {
  if (perDay >= 1) {
    const n = Math.round(perDay);
    return `${n} ${n === 1 ? unit : units} a day`;
  }
  const perWeek = Math.round(perDay * 7);
  return perWeek <= 1 ? `about 1 ${unit} a week` : `about ${perWeek} ${units} a week`;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  content: { padding: Spacing.four, paddingTop: Spacing.five, gap: Spacing.three },
  title: { color: palette.text, fontSize: 26, lineHeight: 32, letterSpacing: -0.4, fontFamily: type.display },
  formula: { color: palette.textDim, fontSize: 16, lineHeight: 24, fontFamily: type.body },
  formulaStrong: { color: palette.text, fontFamily: type.bodySemi },
  table: { borderRadius: 16, backgroundColor: palette.surface, overflow: 'hidden', marginTop: Spacing.one },
  row: {
    minHeight: 60,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    marginTop: -1,
  },
  rowLabel: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  rowValue: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'] },
  rowSub: { color: palette.textDim, fontSize: 13, fontFamily: type.body },
  body: { color: palette.textDim, fontSize: 15, lineHeight: 22, fontFamily: type.body },
  footer: { padding: Spacing.four, paddingTop: Spacing.two, gap: Spacing.two },
  primary: { minHeight: 56, borderRadius: 18, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  primaryLabel: { color: palette.accentInk, fontSize: 17, fontFamily: type.bodySemi },
  secondary: { minHeight: 56, borderRadius: 18, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  secondaryLabel: { color: palette.accent, fontSize: 17, fontFamily: type.bodySemi },
});
