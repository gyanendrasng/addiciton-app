import { SymbolView } from 'expo-symbols';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Tap } from '@/components/ui/tap';
import { DISCLAIMER, EMERGENCY, REGIONS, type Line } from '@/features/help/lines';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

/**
 * Real help, one tap from the urge screen and from Settings.
 *
 * Deliberately NOT behind the paywall gate: someone in trouble must reach this
 * whether or not they've paid, and whether or not they're signed in. It's the
 * one screen in the app where a subscription check would be indefensible.
 */
export default function HelpScreen() {
  const open = (line: Line) => {
    Linking.openURL(line.href).catch(() => undefined);
  };

  return (
    <Screen title="Get help">
      <Notice tone="warn">{EMERGENCY}</Notice>

      {REGIONS.map((region) => (
        <View key={region.id} style={s.block}>
          <Text style={s.section}>{region.label}</Text>
          <Card style={s.card}>
            {region.lines.map((line, i) => (
              <View key={line.name}>
                {i === 0 ? null : <View style={s.sep} />}
                <Tap
                  haptic="light"
                  onPress={() => open(line)}
                  accessibilityRole="button"
                  accessibilityLabel={`${line.name}, ${line.contact}`}>
                  <View style={s.row}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={s.name}>{line.name}</Text>
                      <Text style={s.contact}>{line.contact}</Text>
                      {line.note ? <Text style={s.note}>{line.note}</Text> : null}
                    </View>
                    {Platform.OS === 'ios' ? (
                      <SymbolView
                        name={
                          line.action === 'call'
                            ? 'phone.fill'
                            : line.action === 'text'
                              ? 'message.fill'
                              : 'arrow.up.right'
                        }
                        size={17}
                        tintColor={hues.pledge.solid}
                        style={s.icon}
                      />
                    ) : (
                      <Text style={s.chev}>›</Text>
                    )}
                  </View>
                </Tap>
              </View>
            ))}
          </Card>
        </View>
      ))}

      <Text style={s.disclaimer}>{DISCLAIMER}</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  block: { marginTop: Spacing.five, gap: Spacing.two },
  section: {
    color: palette.textDim,
    fontSize: 13,
    fontFamily: type.bodySemi,
    letterSpacing: 0.3,
  },
  card: { padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    minHeight: 64,
  },
  sep: { height: 1, backgroundColor: palette.line, marginLeft: Spacing.three },
  name: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  contact: { color: hues.pledge.solid, fontSize: 15, fontFamily: type.bodyMed },
  note: { color: palette.textDim, fontSize: 13, lineHeight: 18, fontFamily: type.body },
  icon: { width: 17, height: 17 },
  chev: { color: palette.textFaint, fontSize: 20, fontFamily: type.body },
  disclaimer: {
    color: palette.textFaint,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: type.body,
    marginTop: Spacing.five,
  },
});
