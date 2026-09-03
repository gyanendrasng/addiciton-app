import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Platform, StyleSheet, View } from 'react-native';

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
  return (
    <View style={[s.chip, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: wash }]}>
      {Platform.OS === 'ios' ? (
        <SymbolView name={name} size={size * 0.55} tintColor={tint} style={{ width: size * 0.55, height: size * 0.55 }} />
      ) : (
        <View style={{ width: size * 0.3, height: size * 0.3, borderRadius: size, backgroundColor: tint }} />
      )}
    </View>
  );
}

const s = StyleSheet.create({ chip: { alignItems: 'center', justifyContent: 'center' } });
