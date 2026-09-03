import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { hues, palette, type Hue } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { Tap } from './tap';

export const HUE_SYMBOL: Record<Hue, SFSymbol> = {
  pledge: 'hand.raised.fill',
  urge: 'flame.fill',
  checkin: 'face.smiling.fill',
  reasons: 'heart.fill',
  progress: 'chart.bar.fill',
  premium: 'checkmark.seal.fill',
};

/** Native symbol on iOS; a hue dot elsewhere. */
export function HueIcon({ hue, color, size = 22 }: { hue: Hue; color: string; size?: number }) {
  if (Platform.OS === 'ios') {
    return <SymbolView name={HUE_SYMBOL[hue]} size={size} tintColor={color} resizeMode="scaleAspectFit" style={{ width: size, height: size }} />;
  }
  return <View style={{ width: size * 0.55, height: size * 0.55, borderRadius: size, backgroundColor: color }} />;
}

/** Small color-coded action tile: symbol, label, one-line status. `filled` = done state. */
export function ActionTile({
  hue,
  label,
  status,
  onPress,
  filled = false,
  style,
}: {
  hue: Hue;
  label: string;
  status?: string;
  onPress?: () => void;
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const h = hues[hue];
  return (
    <Tap
      haptic="light"
      onPress={onPress}
      accessibilityRole="button"
      style={[s.tile, { backgroundColor: filled ? h.solid : palette.surface2 }, style]}>
      <View style={s.icon}>
        <HueIcon hue={hue} color={filled ? h.ink : h.solid} />
      </View>
      <View style={{ flex: 1 }} />
      <Text numberOfLines={1} style={[s.label, { color: filled ? h.ink : palette.text }]}>{label}</Text>
      <Text numberOfLines={1} style={[s.status, { color: filled ? h.ink : palette.textDim }]}>{status ?? ' '}</Text>
    </Tap>
  );
}

export const tileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 108,
    borderRadius: 22,
    padding: Spacing.three,
    gap: 2,
  },
});

const s = StyleSheet.create({
  tile: tileStyles.tile,
  icon: { height: 24, justifyContent: 'center' },
  label: { fontSize: 16, fontFamily: type.bodySemi },
  status: { fontSize: 12, fontFamily: type.bodyMed },
});
