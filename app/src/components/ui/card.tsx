import { StyleSheet, View, type ViewProps } from 'react-native';

import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';

export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[s.card, style]} />;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: Spacing.three,
  },
});
