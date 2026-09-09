import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Platform, StyleSheet, View } from 'react-native';

/**
 * SF Symbols exist only on iOS. This used to draw a plain coloured dot on
 * Android, so every Settings row, the account screen and the games list showed
 * an identical blob — the app looked broken on half its platforms.
 *
 * Android now draws the Material equivalent, which is also the platform-correct
 * choice: an Android user should see Android iconography, not a traced copy of
 * Apple's. Anything unmapped falls back to a neutral dot rather than rendering
 * nothing, so a new symbol degrades instead of vanishing.
 */
const MATERIAL: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  'arrow.backward.circle': 'arrow-left-circle',
  'arrow.clockwise': 'refresh',
  'banknote.fill': 'cash',
  'bell.fill': 'bell',
  'chart.bar.fill': 'chart-bar',
  checkmark: 'check',
  'circle.lefthalf.filled': 'theme-light-dark',
  creditcard: 'credit-card-outline',
  'doc.text': 'file-document-outline',
  gamecontroller: 'gamepad-variant',
  gearshape: 'cog',
  'gearshape.fill': 'cog',
  'hammer.fill': 'hammer-wrench',
  'hand.raised': 'hand-back-right',
  'heart.fill': 'heart',
  'heart.text.square.fill': 'heart-pulse',
  house: 'home',
  'house.fill': 'home',
  iphone: 'cellphone',
  lifepreserver: 'lifebuoy',
  'list.bullet.rectangle': 'format-list-bulleted',
  'person.crop.circle': 'account-circle-outline',
  'person.crop.circle.fill': 'account-circle',
  'person.text.rectangle': 'card-account-details-outline',
  'rectangle.portrait.and.arrow.right': 'logout',
  'shield.fill': 'shield',
  'square.and.arrow.up': 'tray-arrow-up',
  'trash.fill': 'trash-can',
  'exclamationmark.circle.fill': 'alert-circle',
  'exclamationmark.triangle.fill': 'alert',
  'eye.fill': 'eye',
  'info.circle.fill': 'information',
  'minus.circle.fill': 'minus-circle',
  'paintpalette.fill': 'palette',
  'square.grid.2x2.fill': 'view-grid',
  'textformat.123': 'numeric',
};

/** iOS-Settings-style icon chip: rounded square wash with a tinted symbol. */
export function SymbolChip({
  name,
  tint,
  wash,
  size = 30,
}: {
  name: SFSymbol;
  tint: string;
  wash: string;
  size?: number;
}) {
  const glyph = size * 0.55;
  const material = MATERIAL[name];
  return (
    <View style={[s.chip, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: wash }]}>
      {Platform.OS === 'ios' ? (
        <SymbolView name={name} size={glyph} tintColor={tint} style={{ width: glyph, height: glyph }} />
      ) : material ? (
        <MaterialCommunityIcons name={material} size={glyph} color={tint} />
      ) : (
        <View style={{ width: size * 0.3, height: size * 0.3, borderRadius: size, backgroundColor: tint }} />
      )}
    </View>
  );
}

const s = StyleSheet.create({ chip: { alignItems: 'center', justifyContent: 'center' } });
