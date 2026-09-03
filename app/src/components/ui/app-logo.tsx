import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { palette } from '@/theme/palette';

/**
 * The Curb mark: two chain links snapping apart.
 * Rendered as a rounded mint tile with the links knocked out in the ground colour,
 * matching the app icon exactly.
 */
export function AppLogo({ size = 96, tile = true }: { size?: number; tile?: boolean }) {
  const inner = Math.round(size * 0.74);
  const links = (
    <Svg width={inner} height={inner} viewBox="0 0 1024 1024">
      <Path
        d="M 516.1 663.0 A 138 138 0 1 1 364.0 481.8"
        stroke={tile ? palette.accentInk : palette.accent}
        strokeWidth={88}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M 507.9 361.0 A 138 138 0 1 1 660.0 542.2"
        stroke={tile ? palette.accentInk : palette.accent}
        strokeWidth={88}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );

  if (!tile) return <View style={{ width: size, height: size }}>{links}</View>;

  return (
    <View
      style={[
        s.tile,
        { width: size, height: size, borderRadius: size * 0.28 },
      ]}>
      {links}
    </View>
  );
}

const s = StyleSheet.create({
  tile: {
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
